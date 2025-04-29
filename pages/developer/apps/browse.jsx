// pages/apps/browse.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient'; // Adjusted path
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
// --- Components & Icons ---
import Navbar from '../../components/Navbar'; // Use main Navbar
import Footer from '../../components/Footer'; // Use main Footer
import Button from '../../components/Button';
import AppCard from '../../components/AppCard'; // Use the updated card
import { FiCompass, FiSearch, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';

const BROWSE_PAGE_SIZE = 12; // Number of apps per page

export default function BrowseAppsPage() {
    const [user, setUser] = useState(null); // Track logged-in user (optional for browse, needed for future actions)
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    // App Fetching State
    const [apps, setApps] = useState([]);
    const [loadingApps, setLoadingApps] = useState(false);
    const [lastVisibleApp, setLastVisibleApp] = useState(null);
    const [hasMoreApps, setHasMoreApps] = useState(true);

    // TODO: Search/Filter State
    // const [searchTerm, setSearchTerm] = useState('');
    // const [filterType, setFilterType] = useState('all');

    const router = useRouter();

    // --- Auth Check (Optional for Browse, but good practice) ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
                 // Decide if login is required to browse:
                 // router.replace('/signin');
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]);

    // --- Fetch Initial Apps ---
    const fetchInitialApps = useCallback(async () => {
        setLoadingApps(true);
        setError(null);
        setApps([]); // Reset on initial fetch
        setHasMoreApps(true); // Assume more initially

        try {
            console.log("Fetching initial browse apps...");
            const appsQuery = query(
                collection(db, "apps"),
                where("status", "in", ["active", "beta"]), // Show active/beta apps
                orderBy("createdAt", "desc"),
                limit(BROWSE_PAGE_SIZE)
            );
            const documentSnapshots = await getDocs(appsQuery);
            const fetchedApps = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setApps(fetchedApps);
            setLastVisibleApp(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMoreApps(fetchedApps.length === BROWSE_PAGE_SIZE);
            console.log("Fetched initial apps:", fetchedApps);

        } catch (err) {
            console.error("Error fetching initial apps:", err);
            // Check for missing index error specifically
            if (err.code === 'failed-precondition' && err.message.includes('index')) {
                 setError("Database index required. Please ask the administrator to create the necessary Firestore index (status asc/desc, createdAt desc).");
            } else {
                 setError("Failed to load applications.");
            }
        } finally {
            setLoadingApps(false);
        }
    }, []); // No dependencies, run once

    // Trigger initial fetch on component mount
    useEffect(() => {
        fetchInitialApps();
    }, [fetchInitialApps]);

    // --- Load More Apps ---
    const handleLoadMore = async () => {
        if (!lastVisibleApp) return; // Cannot load more if no previous last item
        setLoadingApps(true); // Indicate loading more

        try {
            console.log("Loading more browse apps...");
            const nextQuery = query(
                collection(db, "apps"),
                where("status", "in", ["active", "beta"]),
                orderBy("createdAt", "desc"),
                startAfter(lastVisibleApp), // Start after the last fetched doc
                limit(BROWSE_PAGE_SIZE)
            );
            const documentSnapshots = await getDocs(nextQuery);
            const newApps = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setApps(prevApps => [...prevApps, ...newApps]); // Append new apps
            setLastVisibleApp(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMoreApps(newApps.length === BROWSE_PAGE_SIZE);

        } catch (err) {
            console.error("Error loading more apps:", err);
            setError("Failed to load more applications.");
        } finally {
            setLoadingApps(false);
        }
    };

    // Animation variants for the grid container
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } }};

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
                {/* <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border"> Search/Filter UI </div> */}

                 {/* Error Display */}
                 {error && (
                     <div className="mb-6 p-4 text-center text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center justify-center space-x-2">
                        <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
                    </div>
                 )}

                {/* Content Area */}
                <div>
                    {/* Initial Loading State */}
                    {loadingApps && apps.length === 0 && (
                        <div className="flex justify-center items-center py-20">
                            <FiLoader className="animate-spin text-nova-blue-500 text-4xl" />
                        </div>
                    )}

                    {/* Empty State (No apps found after loading) */}
                    {!loadingApps && !error && apps.length === 0 && (
                         <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                             <FiBox size={48} className="mx-auto text-nova-gray-400 mb-4" />
                             <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">No Applications Found</h2>
                             <p className="text-nova-gray-500">Check back later or ask developers to upload their apps!</p>
                         </div>
                     )}

                    {/* Apps Grid */}
                    {apps.length > 0 && (
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {apps.map((app) => (
                                // Pass false for showDevActions
                                <AppCard key={app.id} app={app} showDevActions={false} />
                            ))}
                        </motion.div>
                    )}

                    {/* Load More Button */}
                    {hasMoreApps && apps.length > 0 && (
                        <div className="text-center mt-12">
                            <Button onClick={handleLoadMore} variant="secondary" disabled={loadingApps}>
                                {loadingApps ? 'Loading...' : 'Load More Apps'}
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            <Footer /> {/* Use the main site Footer */}
             {/* Helper for badge styles needed by AppCard */}
             <style jsx global>{`
                .badge { @apply inline-flex items-center bg-nova-gray-100 px-1.5 py-0.5 rounded text-xs text-nova-gray-600; }
                .badge-icon { @apply w-3 h-3 mr-1; }
                .badge-success { @apply bg-nova-success-100 text-nova-success-800; }
                .badge-warning { @apply bg-nova-warning-100 text-nova-warning-800; }
                .badge-gray { @apply bg-nova-gray-200 text-nova-gray-600; }
             `}</style>
        </div>
    );
}