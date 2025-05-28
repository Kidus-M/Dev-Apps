// pages/tester/explore-apps.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient'; // Adjust path if needed
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
// --- Components & Icons ---
import TesterLayout from '../../components/TesterLayout';
import Button from '../../components/Button';
import TesterAppCard from '../../components/TesterAppCard'; // Using the new TesterAppCard
import { FiCompass, FiSearch, FiAlertCircle, FiLoader, FiBox } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useDebounce } from 'use-debounce'; // Make sure this is installed: npm install use-debounce

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
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
    const [isSearching, setIsSearching] = useState(false);

    const router = useRouter();

    // --- Auth Check & Role Verification ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const profileDocRef = doc(db, "profiles", currentUser.uid);
                try {
                    const profileSnap = await getDoc(profileDocRef);
                    // Allow if profile exists and role is tester OR developer (can adjust if strictly tester only)
                    if (profileSnap.exists() && ['tester', 'developer'].includes(profileSnap.data().role)) {
                        setError(null);
                        // Initial fetch is now triggered by the useEffect monitoring debouncedSearchTerm and user
                    } else {
                        setError("Access denied. Profile not found or invalid role for exploring apps.");
                        router.replace('/signin?message=Access Denied'); // Redirect with a message
                        return;
                    }
                } catch (err) {
                    console.error("Error verifying profile for explore page:", err);
                    setError("Failed to verify user profile.");
                    router.replace('/signin');
                    return;
                }
            } else {
                setUser(null);
                router.replace('/signin?message=Please sign in to explore apps.');
                return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]);

    // --- Fetch Apps (Initial & Search) ---
    const fetchApps = useCallback(async (currentSearchTermVal = '', loadMore = false) => {
        if (!user) return; // Ensure user is loaded and authenticated

        console.log(`Fetching apps... Search: "${currentSearchTermVal}", Load More: ${loadMore}`);
        setLoadingApps(true);
        if (!loadMore) {
            setApps([]);
            setLastVisibleApp(null);
            setHasMoreApps(true); // Assume there are more on a new search/initial load
        }
        setError(null); // Clear previous errors on new fetch attempt

        try {
            const appsRef = collection(db, "apps");
            const normalizedSearchTerm = currentSearchTermVal.trim().toLowerCase();
            let constraints = [
                where("status", "in", ["active", "beta"]), // Only show active/beta apps
                // Default sort:
                orderBy("createdAt", "desc"),
            ];

            if (normalizedSearchTerm.length >= 2) {
                // Add search constraints. Assumes you have an 'appName_lowercase' field.
                // If not, search directly on 'appName' but be mindful of case sensitivity.
                constraints.push(where("appName_lowercase", ">=", normalizedSearchTerm));
                constraints.push(where("appName_lowercase", "<", normalizedSearchTerm + '\uf8ff'));
                // When searching, you might want to primarily sort by relevance or appName.
                // For simplicity, we keep createdAt, but a dedicated search index (e.g., Algolia) is better for relevance.
                // If keeping appName_lowercase sort:
                // constraints = constraints.filter(c => c._methodName !== 'orderBy' || c._field.toString() !== 'createdAt'); // Remove createdAt orderBy
                // constraints.push(orderBy("appName_lowercase", "asc"));
            }

            constraints.push(limit(EXPLORE_PAGE_SIZE));

            if (loadMore && lastVisibleApp) {
                constraints.push(startAfter(lastVisibleApp));
            }

            const finalQuery = query(appsRef, ...constraints);
            const documentSnapshots = await getDocs(finalQuery);
            const fetchedApps = documentSnapshots.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

            setApps(prevApps => loadMore ? [...prevApps, ...fetchedApps] : fetchedApps);
            setLastVisibleApp(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMoreApps(fetchedApps.length === EXPLORE_PAGE_SIZE);

        } catch (err) {
            console.error("Error fetching apps:", err);
            if (err.code === 'failed-precondition' && err.message.includes('index')) {
                setError("Data loading requires a database index. Please ensure the necessary Firestore indexes are created and enabled. The Firebase console often provides a link to create it directly from the error message.");
            } else if (err.code === 'permission-denied') {
                 setError("Permission denied. Please check Firestore security rules for the 'apps' collection to allow list operations for authenticated users.");
            }
            else {
                setError("Failed to load applications. Please try again later.");
            }
            setHasMoreApps(false); // Stop pagination on error
        } finally {
            setLoadingApps(false);
            setIsSearching(false);
        }
    }, [user, lastVisibleApp]); // Added lastVisibleApp as dependency

    // --- Trigger Fetch When Debounced Term Changes or User Initially Loads ---
    useEffect(() => {
        if (user && !loadingUser) { // Only run fetch if user is loaded and not still in initial loadingUser state
            setIsSearching(true); // Indicate search activity or initial load
            fetchApps(debouncedSearchTerm, false); // Perform new search/initial load
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, user, loadingUser]); // Rerun when debounced term or user/loadingUser changes

    // --- Load More Handler ---
    const handleLoadMore = () => {
        if (!loadingApps && hasMoreApps) {
            fetchApps(debouncedSearchTerm, true); // Load more with current search term
        }
    };

    // --- Render Logic ---
    if (loadingUser) {
        return (
            <TesterLayout>
                <div className="flex justify-center items-center py-20">
                    <FiLoader className="animate-spin text-nova-blue-500 text-3xl" />
                    <p className="ml-3 text-nova-gray-500">Authenticating...</p>
                </div>
            </TesterLayout>
        );
    }

    // User should be loaded by this point if not redirected.
    // If error is set during auth, it will display that.
    if (!user && !error) { // Fallback, should be caught by useEffect redirect
        return (
             <TesterLayout>
                <div className="flex justify-center items-center py-20">
                    <p className="ml-3 text-nova-gray-500">Redirecting...</p>
                </div>
            </TesterLayout>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    return (
        <TesterLayout>
            <Head><title>Explore Apps - DevApps</title></Head>

            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900 flex items-center">
                    <FiCompass className="mr-3 text-nova-blue-500" /> Explore Applications
                </h1>
                <p className="text-nova-gray-500 text-sm mt-1">Discover apps available for testing and provide your feedback.</p>
            </div>

            <div className="relative mb-8">
                <FiSearch className="absolute top-1/2 left-3.5 transform -translate-y-1/2 text-nova-gray-400 pointer-events-none" size={18}/>
                <input
                    type="search"
                    placeholder="Search apps by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-nova-gray-300 rounded-lg focus:ring-2 focus:ring-nova-blue-300 focus:border-nova-blue-500 transition duration-150"
                />
            </div>

            {error && (
                <div className="mb-6 p-4 text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center space-x-2">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
                </div>
             )}

            <div>
                {loadingApps && apps.length === 0 && (
                    <div className="flex justify-center items-center py-20">
                        <FiLoader className="animate-spin text-nova-blue-500 text-3xl" />
                        <p className="ml-3 text-nova-gray-500">Loading apps...</p>
                    </div>
                )}

                {!loadingApps && !error && apps.length === 0 && (
                    <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                        <FiBox size={48} className="mx-auto text-nova-gray-400 mb-4" />
                        <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">
                            {debouncedSearchTerm.length >= 2 ? 'No Apps Found' : 'No Applications Available'}
                        </h2>
                        <p className="text-nova-gray-500">
                            {debouncedSearchTerm.length >= 2 ? `No apps matched your search for "${debouncedSearchTerm}". Try a different term.` : 'Check back later for new apps or try broadening your search!'}
                        </p>
                    </div>
                 )}

                {apps.length > 0 && (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6" // Adjusted for potentially slightly larger TesterAppCard
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {apps.map((app) => (
                            <TesterAppCard key={app.id} app={app} />
                        ))}
                    </motion.div>
                )}

                {!loadingApps && hasMoreApps && apps.length > 0 && (
                    <div className="text-center mt-10">
                        <Button onClick={handleLoadMore} variant="secondary" disabled={loadingApps}>
                            {loadingApps ? 'Loading...' : 'Load More Apps'}
                        </Button>
                    </div>
                )}
            </div>
        </TesterLayout>
    );
}