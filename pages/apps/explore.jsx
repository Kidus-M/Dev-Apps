// pages/apps/explore.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient'; // Adjust path if needed
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
// --- Components & Icons ---
import Navbar from '../../components/Navbar'; // Use main Navbar
import Footer from '../../components/Footer'; // Use main Footer
import Button from '../../components/Button';
import AppCard from '../../components/AppCard'; // Use the updated card
import { FiCompass, FiSearch, FiAlertCircle, FiLoader, FiBox } from 'react-icons/fi';
import { motion } from 'framer-motion';

const BROWSE_PAGE_SIZE = 12;

export default function ExploreAppsPage() {
    const [user, setUser] = useState(null); // Still useful to know if logged in for potential actions
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    // App Fetching State
    const [apps, setApps] = useState([]);
    const [loadingApps, setLoadingApps] = useState(false);
    const [lastVisibleApp, setLastVisibleApp] = useState(null);
    const [hasMoreApps, setHasMoreApps] = useState(true);

    const router = useRouter();

    // --- Auth Check (Require Login to Browse) ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser); // Store user if logged in
                fetchInitialApps(); // Fetch apps only if logged in
            } else {
                setUser(null);
                // Redirect to signin if login is required to browse
                console.log("Explore Apps: No user, redirecting to signin.");
                router.replace('/signin?message=Please sign in to explore apps.');
                return; // Stop processing
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    // Run only once on mount to check auth, subsequent fetches triggered by fetchInitialApps call
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    // --- Fetch Initial Apps ---
    const fetchInitialApps = useCallback(async () => {
        // ... (Fetch logic remains the same as previous Explore page) ...
        setLoadingApps(true);
        setError(null);
        setApps([]);
        setHasMoreApps(true);
        try {
            const appsQuery = query(
                collection(db, "apps"),
                where("status", "in", ["active", "beta"]),
                orderBy("createdAt", "desc"),
                limit(BROWSE_PAGE_SIZE)
            );
            // ... (rest of fetch logic) ...
            const documentSnapshots = await getDocs(appsQuery);
            const fetchedApps = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setApps(fetchedApps);
            setLastVisibleApp(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMoreApps(fetchedApps.length === BROWSE_PAGE_SIZE);
        } catch (err) { /* ... error handling ... */ }
        finally { setLoadingApps(false); }
    }, []);

    // --- Load More Apps ---
    const handleLoadMore = async () => {
        // ... (Load More Logic - same as before) ...
        if (!lastVisibleApp) return;
        setLoadingApps(true);
        try {
             const nextQuery = query(
                collection(db, "apps"),
                where("status", "in", ["active", "beta"]),
                orderBy("createdAt", "desc"),
                startAfter(lastVisibleApp),
                limit(BROWSE_PAGE_SIZE)
             );
             // ... (rest of load more logic) ...
             const documentSnapshots = await getDocs(nextQuery);
             const newApps = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             setApps(prevApps => [...prevApps, ...newApps]);
             setLastVisibleApp(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
             setHasMoreApps(newApps.length === BROWSE_PAGE_SIZE);
        } catch (err) { /* ... error handling ... */ }
        finally { setLoadingApps(false); }
    };

    // --- Render Logic ---
    if (loadingUser) {
        return (<div className="min-h-screen flex items-center justify-center">Checking authentication...</div>);
    }
    // No need to check !user here as useEffect redirects

    const containerVariants = { /* ... */ };

    return (
        <div className="min-h-screen flex flex-col bg-nova-gray-50">
            <Head><title>Explore Apps - DevApps</title></Head>
            <Navbar /> {/* Use the main site Navbar */}

            <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                {/* Page Header */}
                <div className="mb-8 text-center md:text-left">
                     <h1 className="text-3xl md:text-4xl font-bold text-nova-gray-900 flex items-center justify-center md:justify-start">
                         <FiCompass className="mr-3 text-nova-blue-500" /> Explore Applications
                     </h1>
                     <p className="text-nova-gray-600 mt-2">Discover new apps shared by developers for testing and feedback.</p>
                </div>

                {/* TODO: Add Search and Filter Controls Here */}

                {error }

                {/* Content Area */}
                <div>
                    {loadingApps && apps.length === 0 }
                    {!loadingApps && !error && apps.length === 0}
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
                    {!loadingApps && hasMoreApps && apps.length > 0}
                </div>
            </main>

            <Footer /> {/* Use the main site Footer */}
             {/* Global styles needed by AppCard */}
            <style jsx global>{` /* ... badge styles ... */ `}</style>
        </div>
    );
}