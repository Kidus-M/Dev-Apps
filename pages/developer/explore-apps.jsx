// pages/developer/explore-apps.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient'; // Correct relative path
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout'; // Use Developer Layout
import AppCard from '../../components/AppCard'; // Use the updated card
import { FiCompass, FiSearch, FiAlertCircle, FiLoader, FiBox } from 'react-icons/fi';
import { motion } from 'framer-motion';

const BROWSE_PAGE_SIZE = 12;

export default function ExploreAppsPage() {
    const [user, setUser] = useState(null); // Track logged-in user
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

    // --- Auth Check & Role Verification ---
    // Simplified check as DeveloperLayout might handle basic redirection
    // but keeping it here ensures role is verified specifically for this page's logic
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Verify developer role
                const profileDocRef = doc(db, "profiles", currentUser.uid);
                 try {
                    const profileSnap = await getDoc(profileDocRef);
                     if (!profileSnap.exists() || profileSnap.data().role !== 'developer') {
                         console.warn("Explore Apps: User is not a developer or profile missing.");
                         router.replace('/signin'); // Redirect if not a valid developer
                         return;
                     }
                     setError(null); // Clear error if developer role confirmed
                     fetchInitialApps(); // Fetch apps only after confirming user and role
                 } catch (err) {
                      console.error("Explore Apps: Error fetching profile:", err);
                      setError("Failed to verify user profile.");
                      setUser(null);
                      router.replace('/signin');
                      return;
                 }

            } else {
                setUser(null);
                router.replace('/signin'); // Redirect if not logged in
                return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    // Only run when router is available, subsequent fetches triggered by fetchInitialApps
    }, [router]);


    // --- Fetch Initial Apps ---
    const fetchInitialApps = useCallback(async () => {
        // No need to check user here again, useEffect above handles it
        setLoadingApps(true);
        setError(null); // Clear previous fetch errors
        setApps([]);
        setHasMoreApps(true);

        try {
            console.log("Fetching initial explore apps...");
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
            console.log("Fetched initial explore apps:", fetchedApps);

        } catch (err) {
            console.error("Error fetching initial apps:", err);
            if (err.code === 'failed-precondition' && err.message.includes('index')) {
                 setError("Database index required. Please ask the administrator to create the necessary Firestore index (status asc/desc, createdAt desc).");
            } else {
                 setError("Failed to load applications.");
            }
        } finally {
            setLoadingApps(false);
        }
    }, []); // Empty dependency array, called from auth useEffect

    // --- Load More Apps ---
    const handleLoadMore = async () => {
        // ... (Load More Logic - same as before) ...
         if (!lastVisibleApp) return;
         setLoadingApps(true);
         try {
            console.log("Loading more explore apps...");
            const nextQuery = query(
                collection(db, "apps"),
                where("status", "in", ["active", "beta"]),
                orderBy("createdAt", "desc"),
                startAfter(lastVisibleApp),
                limit(BROWSE_PAGE_SIZE)
            );
            const documentSnapshots = await getDocs(nextQuery);
            const newApps = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setApps(prevApps => [...prevApps, ...newApps]);
            setLastVisibleApp(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMoreApps(newApps.length === BROWSE_PAGE_SIZE);
         } catch (err) {
            console.error("Error loading more apps:", err);
            setError("Failed to load more applications.");
         } finally {
            setLoadingApps(false);
         }
    };

    // --- Render Logic ---
    // Show main loading indicator while checking user auth
    if (loadingUser) {
        return (
            <DeveloperLayout>
                 <div className="flex justify-center items-center py-20">
                     <FiLoader className="animate-spin text-nova-blue-500 text-3xl" />
                 </div>
            </DeveloperLayout>
        );
    }
    // Should not render if no user, as useEffect redirects
    if (!user) return null;

    // Grid animation variants
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } }};


    return (
        <DeveloperLayout> {/* Use the DeveloperLayout */}
            <Head><title>Explore Apps - DevApps Developer</title></Head>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900 flex items-center">
                    <FiCompass className="mr-3 text-nova-blue-500" /> Explore Applications
                </h1>
                {/* TODO: Add Search/Filter Button */}
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
                {/* Loading state for apps */}
                {loadingApps && apps.length === 0 && (
                    <div className="flex justify-center items-center py-20">
                         <FiLoader className="animate-spin text-nova-blue-500 text-3xl" />
                     </div>
                )}

                {/* Empty State (No apps found after loading) */}
                 {!loadingApps && !error && apps.length === 0 && (
                      <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                          <FiBox size={48} className="mx-auto text-nova-gray-400 mb-4" />
                          <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">No Applications Found</h2>
                          <p className="text-nova-gray-500">Looks like no apps have been published for testing yet.</p>
                      </div>
                  )}

                 {/* Apps Grid */}
                 {apps.length > 0 && (
                     <motion.div
                         className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" // Adjusted grid cols
                         variants={containerVariants}
                         initial="hidden"
                         animate="visible"
                     >
                         {apps.map((app) => (
                             // Render AppCard - showDevActions is false by default
                             <AppCard key={app.id} app={app} />
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
              {/* Global styles needed by AppCard if not defined elsewhere */}
             <style jsx global>{`
                .badge { @apply inline-flex items-center bg-nova-gray-100 px-1.5 py-0.5 rounded text-xs text-nova-gray-600; }
                .badge-icon { @apply w-3 h-3 mr-1; }
                .badge-success { @apply bg-nova-success-100 text-nova-success-800; }
                .badge-warning { @apply bg-nova-warning-100 text-nova-warning-800; }
                .badge-gray { @apply bg-nova-gray-200 text-nova-gray-600; }
             `}</style>
        </DeveloperLayout>
    );
}