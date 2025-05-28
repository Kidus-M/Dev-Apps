// pages/tester/explore-apps.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
// --- Components & Icons ---
import TesterLayout from '../../components/TesterLayout';
import Button from '../../components/Button';
// --- IMPORT THE NEW CARD ---
import TesterAppCard from '../../components/TesterAppCard'; // Changed from AppCard
import { FiCompass, FiSearch, FiAlertCircle, FiLoader, FiBox } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useDebounce } from 'use-debounce';

const EXPLORE_PAGE_SIZE = 12;

export default function ExploreAppsPage() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);
    const [apps, setApps] = useState([]);
    const [loadingApps, setLoadingApps] = useState(false);
    const [lastVisibleApp, setLastVisibleApp] = useState(null);
    const [hasMoreApps, setHasMoreApps] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();

    // --- Auth Check & Role Verification (same as before) ---
    useEffect(() => {
        // ... (Auth logic remains the same, ensure user is tester or allowed role)
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const profileDocRef = doc(db, "profiles", currentUser.uid);
                 try {
                    const profileSnap = await getDoc(profileDocRef);
                    if (profileSnap.exists() && ['tester', 'developer'].includes(profileSnap.data().role) ) { // Allow developers to browse too for now
                         setError(null);
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

    // --- Fetch Apps (Initial & Search - logic largely same) ---
    const fetchApps = useCallback(async (currentSearchTermVal = '', loadMore = false) => {
        // ... (fetchApps logic remains the same - just ensure you handle errors for index etc.)
        if (!user) return;
        setLoadingApps(true);
        if (!loadMore) { setApps([]); setLastVisibleApp(null); setHasMoreApps(true); }
        setError(null);

        try {
            const appsRef = collection(db, "apps");
            let q;
            const normalizedSearchTerm = currentSearchTermVal.trim().toLowerCase();
            const constraints = [ where("status", "in", ["active", "beta"]), orderBy("createdAt", "desc"), limit(EXPLORE_PAGE_SIZE) ];

            if (normalizedSearchTerm.length >= 2) {
                constraints.unshift(where("appName_lowercase", ">=", normalizedSearchTerm));
                constraints.unshift(where("appName_lowercase", "<", normalizedSearchTerm + '\uf8ff'));
                // Consider if default sort by createdAt is still best when searching, or if appName_lowercase should be primary sort
            }
            if (loadMore && lastVisibleApp) { constraints.push(startAfter(lastVisibleApp)); }
            q = query(appsRef, ...constraints);

            const documentSnapshots = await getDocs(q);
            const fetchedApps = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setApps(prevApps => loadMore ? [...prevApps, ...fetchedApps] : fetchedApps);
            setLastVisibleApp(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMoreApps(fetchedApps.length === EXPLORE_PAGE_SIZE);

        } catch (err) { /* ... error handling (same as before, including index error check) ... */
            console.error("Error fetching apps:", err);
            if (err.code === 'failed-precondition' && err.message.includes('index')) {
                 setError("Data loading requires a database index. Please ask the admin to create it.");
            } else {
                 setError("Failed to load applications.");
            }
            setHasMoreApps(false);
        } finally {
            setLoadingApps(false);
            setIsSearching(false);
        }
    }, [user, lastVisibleApp]);

    // --- Trigger Search When Debounced Term Changes or User Loads ---
    useEffect(() => {
        if (user) {
             setIsSearching(true);
             fetchApps(debouncedSearchTerm, false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, user]); // User added to ensure fetchApps has access to user

    // --- Load More Handler (same as before) ---
    const handleLoadMore = () => { /* ... */ };

    // --- Render Logic (same as before, but using TesterAppCard) ---
    if (loadingUser) { /* ... Initial loading placeholder ... */ }
    if (!user) return null;

    const containerVariants = { /* ... */ };

    return (
        <TesterLayout>
            <Head><title>Explore Apps - DevApps</title></Head>
            {/* Header and Search Input (same as before) ... */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900 flex items-center">
                    <FiCompass className="mr-3 text-nova-blue-500" /> Explore Applications
                </h1>
                <p className="text-nova-gray-500 text-sm mt-1">Discover apps available for testing.</p>
            </div>
            <div className="relative mb-8">
                <FiSearch className="absolute top-1/2 left-3.5 transform -translate-y-1/2 text-nova-gray-400 pointer-events-none" size={18}/>
                <input type="search" placeholder="Search apps by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-nova-gray-300 rounded-lg focus:ring-2 focus:ring-nova-blue-300 focus:border-nova-blue-500 transition duration-150"
                />
            </div>

            {error }

            <div>
                {loadingApps && apps.length === 0 }
                {!loadingApps && !error && apps.length === 0  }

                {apps.length > 0 && (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6" // XL changed to 3 for potentially larger cards
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {apps.map((app) => (
                            // --- USE THE NEW TesterAppCard ---
                            <TesterAppCard key={app.id} app={app} />
                        ))}
                    </motion.div>
                )}

                {!loadingApps && hasMoreApps && apps.length > 0 }
            </div>
             {/* Removed global badge styles as TesterAppCard now defines its own */}
        </TesterLayout>
    );
}