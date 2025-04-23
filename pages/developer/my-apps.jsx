// pages/developer/my-apps.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout'; // Import the layout
import AppCard from '../../components/AppCard'; // Import the new card component
import { FiPlusSquare, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
// import { FiLoader } from 'react-icons/fi'; // Optional spinner

export default function MyAppsPage() {
    const [user, setUser] = useState(null);
    const [apps, setApps] = useState([]); // State to hold the fetched apps
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        setError(null);
        setLoading(true);
        setApps([]); // Reset apps on user change

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);

                // Fetch profile first to ensure role (redundant if layout checks, but safe)
                const profileDocRef = doc(db, "profiles", currentUser.uid);
                try {
                    const profileSnap = await getDoc(profileDocRef);
                    if (profileSnap.exists() && profileSnap.data().role === 'developer') {
                        // User is logged in and is a developer, fetch their apps
                        console.log("Fetching apps for developer:", currentUser.uid);
                        const appsQuery = query(
                            collection(db, "apps"), // Target 'apps' collection
                            where("developerUid", "==", currentUser.uid), // Filter by developer UID
                            orderBy("createdAt", "desc") // Order by creation date
                        );

                        const querySnapshot = await getDocs(appsQuery);
                        const fetchedApps = querySnapshot.docs.map(doc => ({
                            id: doc.id, // Add Firestore document ID to app data
                            ...doc.data()
                        }));
                        setApps(fetchedApps);
                        console.log("Fetched apps:", fetchedApps);

                    } else {
                        // Not a developer or profile missing
                        if (!profileSnap.exists()) setError("Profile not found.");
                        else setError("Access denied. User is not a developer.");
                        router.replace(profileSnap.exists() ? '/tester/dashboard' : '/signin');
                        return;
                    }
                } catch (err) {
                    console.error("Error fetching data:", err);
                    setError("Failed to load your applications.");
                } finally {
                    setLoading(false);
                }
            } else {
                // User is signed out
                setUser(null);
                router.replace('/signin');
                return; // Stop processing if user is signed out
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [router]);

     // Animation variants for the grid container (stagger effect)
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08, // Stagger delay between cards
        },
        },
    };


    return (
        <DeveloperLayout>
            <Head><title>My Apps - DevApps Developer</title></Head>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900">My Applications</h1>
                <Button href="/developer/upload-app" variant="primary" icon={FiPlusSquare} className="mt-4 sm:mt-0">
                    Upload New App
                </Button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-10">
                     {/* <FiLoader className="animate-spin text-nova-blue-500 text-3xl" /> */}
                     <p className="ml-3 text-nova-gray-500">Loading your apps...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                 <div className="p-4 text-center text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center justify-center space-x-2">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && apps.length === 0 && (
                <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                    <FiPackage size={48} className="mx-auto text-nova-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">No applications uploaded yet!</h2>
                    <p className="text-nova-gray-500 mb-6">Get started by uploading your first application for testing.</p>
                    <Button href="/developer/upload-app" variant="primary" icon={FiPlusSquare}>
                        Upload Your First App
                    </Button>
                </div>
            )}

            {/* Apps Grid */}
            {!loading && !error && apps.length > 0 && (
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {apps.map((app) => (
                        // Wrap AppCard in motion.div if AppCard itself doesn't have variants prop applied
                        // Or apply variants directly to AppCard if it accepts them
                        <AppCard key={app.id} app={app} />
                    ))}
                </motion.div>
            )}

        </DeveloperLayout>
    );
}