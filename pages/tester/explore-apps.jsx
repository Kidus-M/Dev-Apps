// pages/tester/explore-apps.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient'; // Adjust path
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
// --- Components & Icons ---
import TesterLayout from '../../components/TesterLayout'; // Use Tester Layout
import Button from '../../components/Button';
import AppCard from '../../components/AppCard';
import { FiCompass, FiSearch, FiAlertCircle, FiLoader, FiBox } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useDebounce } from 'use-debounce'; // Assuming you installed this

const EXPLORE_PAGE_SIZE = 12;

export default function ExploreAppsPage() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    // App Fetching State
    const [apps, setApps] = useState([]);
    const [loadingApps, setLoadingApps] = useState(false);
    const [lastVisibleApp, setLastVisibleApp] = useState(null);
    const [hasMoreApps, setHasMoreApps] = useState(true);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // Debounce input
    const [isSearching, setIsSearching] = useState(false); // To differentiate initial load from search load

    const router = useRouter();

    // --- Auth Check & Role Verification ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Verify tester (or developer?) role - let's allow developers too for now
                 const profileDocRef = doc(db, "profiles", currentUser.uid);
                 try {
                    const profileSnap = await getDoc(profileDocRef);
                     // Allow if profile exists and role is tester OR developer
                    if (profileSnap.exists() && ['tester', 'developer'].includes(profileSnap.data().role)) {
                         setError(null);
                         // Initial fetch triggered by search term change below
                     } else {
                         setError("Access denied. Profile not found or invalid role.");
                         router.replace('/signin'); return;
                     }
                 } catch (err) { setError("Failed to verify user profile."); router.replace('/signin'); return; }
            } else {
                setUser(null);
                router.replace('/signin'); return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]);

    // --- Fetch Apps (Initial & Search) ---
    const fetchApps = useCallback(async (searchTerm = '', loadMore = false) => {
        if (!user) return; // Ensure user is loaded

        console.log(`Workspaceing apps... Search: "${searchTerm}", Load More: ${loadMore}`);
        setLoadingApps(true);
        setError(null);
        if (!loadMore) { // Reset list only on new search/initial load
             setApps([]);
             setLastVisibleApp(null);
             setHasMoreApps(true);
        }

        try {
            const appsRef = collection(db, "apps");
            let q;
            const currentSearchTerm = searchTerm.trim().toLowerCase();

            // Base query constraints
            const constraints = [
                where("status", "in", ["active", "beta"]), // Only show active/beta apps
                orderBy("createdAt", "desc"), // Default sort
                limit(EXPLORE_PAGE_SIZE)
            ];

            // Add search constraint if applicable
            if (currentSearchTerm.length >= 2) { // Minimum search term length
                 // Simple prefix search on appName (lowercase recommended for storage)
                 // Note: Requires index on status, appName, createdAt
                constraints.unshift(where("appName_lowercase", ">=", currentSearchTerm)); // Assuming you store lowercase name
                constraints.unshift(where("appName_lowercase", "<", currentSearchTerm + '\uf8ff'));
                 // Adjust orderBy if searching - might need name sort primarily
                 // constraints[1] = orderBy("appName_lowercase", "asc"); // Replace createdAt sort
            } else {
                 // Default sort (by createdAt) - Requires index on status, createdAt
                 // constraints[1] = orderBy("createdAt", "desc"); // Already there
            }


            // Add pagination constraint if loading more
            if (loadMore && lastVisibleApp) {
                constraints.push(startAfter(lastVisibleApp));
            }

            // Construct the final query
            q = query(appsRef, ...constraints);

            const documentSnapshots = await getDocs(q);
            const fetchedApps = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            console.log("Fetched apps:", fetchedApps.length);

            setApps(prevApps => loadMore ? [...prevApps, ...fetchedApps] : fetchedApps);
            setLastVisibleApp(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMoreApps(fetchedApps.length === EXPLORE_PAGE_SIZE);

        } catch (err) {
            console.error("Error fetching apps:", err);
            if (err.code === 'failed-precondition' && err.message.includes('index')) {
                 setError("Data loading requires a database index. Please ask the admin to create it based on the console error.");
            } else {
                 setError("Failed to load applications.");
            }
             setHasMoreApps(false); // Stop pagination on error
        } finally {
            setLoadingApps(false);
            setIsSearching(false); // Reset search loading state if applicable
        }
    }, [user, lastVisibleApp]); // Add dependencies


    // --- Trigger Search When Debounced Term Changes or User Loads ---
    useEffect(() => {
        if (user) { // Only run fetch if user is loaded
             setIsSearching(true); // Indicate search activity
             fetchApps(debouncedSearchTerm, false); // Perform new search, not loading more
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, user]); // Rerun when debounced term or user changes

    // --- Load More Handler ---
    const handleLoadMore = () => {
        if (!loadingApps && hasMoreApps) {
            fetchApps(debouncedSearchTerm, true); // Load more with current search term
        }
    };

    // --- Render Logic ---
    if (loadingUser) { /* ... Initial loading ... */ }
    if (!user) return null;

    const containerVariants = { /* ... */ };

    return (
        <TesterLayout> {/* Use Tester Layout */}
            <Head><title>Explore Apps - DevApps</title></Head>

            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900 flex items-center">
                    <FiCompass className="mr-3 text-nova-blue-500" /> Explore Applications
                </h1>
                <p className="text-nova-gray-500 text-sm mt-1">Discover apps available for testing.</p>
            </div>

             {/* Search Input */}
             <div className="relative mb-8">
                <FiSearch className="absolute top-1/2 left-3.5 transform -translate-y-1/2 text-nova-gray-400 pointer-events-none" size={18}/>
                <input
                    type="search"
                    placeholder="Search apps by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} // Update search term on change
                    className="w-full pl-10 pr-4 py-2.5 border border-nova-gray-300 rounded-lg focus:ring-2 focus:ring-nova-blue-300 focus:border-nova-blue-500 transition duration-150"
                />
             </div>

            {/* Error Display */}
            {error }

            {/* Content Area */}
            <div>
                {/* Loading State */}
                {loadingApps && apps.length === 0 }

                {/* Empty State (No results for search or initially) */}
                {!loadingApps && !error && apps.length === 0 && (
                    <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                        <FiBox size={48} className="mx-auto text-nova-gray-400 mb-4" />
                        <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">
                            {searchTerm ? 'No Apps Found' : 'No Applications Yet'}
                        </h2>
                        <p className="text-nova-gray-500">
                             {searchTerm ? `No apps matched your search for "${searchTerm}".` : 'Check back later for new apps!'}
                         </p>
                    </div>
                 )}

                {/* Apps Grid */}
                {apps.length > 0 && (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        // ... animation variants ...
                    >
                        {apps.map((app) => (
                             <AppCard key={app.id} app={app} showDevActions={false} />
                         ))}
                    </motion.div>
                )}

                {/* Load More Button */}
                 {!loadingApps && hasMoreApps && apps.length > 0 && (
                     <div className="text-center mt-10">
                         <Button onClick={handleLoadMore} variant="secondary" disabled={loadingApps}>
                             {loadingApps ? 'Loading...' : 'Load More Apps'}
                         </Button>
                     </div>
                 )}
            </div>
            {/* Global styles needed by AppCard */}
            <style jsx global>{` /* ... badge styles ... */ `}</style>
        </TesterLayout>
    );
}