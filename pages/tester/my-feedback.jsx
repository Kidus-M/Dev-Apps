// pages/tester/my-feedback.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc, documentId } from 'firebase/firestore';
// --- Components & Icons ---
import TesterLayout from '../../components/TesterLayout'; // Use Tester Layout
import Button from '../../components/Button';
import FeedbackCard from '../../components/FeedbackCard'; // Import the card
import { FiClipboard, FiAlertCircle, FiLoader, FiCompass } from 'react-icons/fi';
import { motion } from 'framer-motion';

const FEEDBACK_PAGE_SIZE = 10;

export default function MyFeedbackPage() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    // Feedback State
    const [feedbackList, setFeedbackList] = useState([]);
    const [appDetails, setAppDetails] = useState({}); // Store fetched app info { appId: { name, iconUrl } }
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [lastVisibleFeedback, setLastVisibleFeedback] = useState(null);
    const [hasMoreFeedback, setHasMoreFeedback] = useState(true);

    const router = useRouter();

    // --- Auth Check & Role Verification ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                 setUser(currentUser);
                 // Verify tester role
                 const profileDocRef = doc(db, "profiles", currentUser.uid);
                 try {
                    const profileSnap = await getDoc(profileDocRef);
                     if (profileSnap.exists() && profileSnap.data().role === 'tester') {
                         setError(null);
                         fetchInitialFeedback(currentUser.uid); // Fetch feedback after confirming role
                     } else {
                         setError("Access denied. Tester profile not found or invalid role.");
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
    // Only run when router is available
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    // --- Function to fetch App details for a list of IDs ---
    const fetchAppDetails = useCallback(async (appIds) => {
         if (!appIds || appIds.length === 0) return {};
         // Remove duplicates and already fetched apps
         const uniqueNewAppIds = [...new Set(appIds)].filter(id => !appDetails[id]);
         if (uniqueNewAppIds.length === 0) return {};

         console.log("Fetching app details for IDs:", uniqueNewAppIds);
         const fetchedDetails = {};
         try {
             // Firestore 'in' query limit is 30 - handle chunking if necessary
             const appQuery = query(collection(db, 'apps'), where(documentId(), 'in', uniqueNewAppIds.slice(0, 30)));
             const appSnapshots = await getDocs(appQuery);
             appSnapshots.docs.forEach(doc => {
                 fetchedDetails[doc.id] = {
                     name: doc.data().appName,
                     iconUrl: doc.data().iconUrl, // Assuming you store an iconUrl
                     type: doc.data().appType
                 };
             });
            // Update state, merging with existing details
            setAppDetails(prev => ({ ...prev, ...fetchedDetails }));
            return fetchedDetails;
         } catch(err) {
             console.error("Error fetching app details:", err);
             // Return empty object on error, cards will show loading/default
             return {};
         }
    }, [appDetails]); // Depend on current appDetails to avoid refetching

    // --- Fetch Initial Feedback ---
    const fetchInitialFeedback = useCallback(async (userId) => {
        setLoadingFeedback(true);
        setError(null);
        setFeedbackList([]);
        setHasMoreFeedback(true);

        try {
            console.log("Fetching initial feedback for tester:", userId);
            const feedbackQuery = query(
                collection(db, "feedback"),
                where("testerUid", "==", userId),
                orderBy("createdAt", "desc"),
                limit(FEEDBACK_PAGE_SIZE)
            );
            const documentSnapshots = await getDocs(feedbackQuery);
            const fetchedFeedback = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setFeedbackList(fetchedFeedback);
            setLastVisibleFeedback(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMoreFeedback(fetchedFeedback.length === FEEDBACK_PAGE_SIZE);

            // Fetch app details for the loaded feedback
            const appIds = fetchedFeedback.map(fb => fb.appId);
            await fetchAppDetails(appIds);

        } catch (err) {
            console.error("Error fetching initial feedback:", err);
             if (err.code === 'failed-precondition' && err.message.includes('index')) {
                 setError("Database index required. Please ask the administrator to create the necessary Firestore index (feedback collection: testerUid asc, createdAt desc).");
            } else {
                 setError("Failed to load your feedback.");
            }
        } finally {
            setLoadingFeedback(false);
        }
    }, [fetchAppDetails]); // Depends on fetchAppDetails

    // --- Load More Feedback ---
     const handleLoadMore = async () => {
        if (!user || !lastVisibleFeedback) return;
        setLoadingFeedback(true);

        try {
            console.log("Loading more feedback...");
            const nextQuery = query(
                collection(db, "feedback"),
                where("testerUid", "==", user.uid),
                orderBy("createdAt", "desc"),
                startAfter(lastVisibleFeedback),
                limit(FEEDBACK_PAGE_SIZE)
            );
             const documentSnapshots = await getDocs(nextQuery);
             const newFeedback = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

             setFeedbackList(prev => [...prev, ...newFeedback]);
             setLastVisibleFeedback(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
             setHasMoreFeedback(newFeedback.length === FEEDBACK_PAGE_SIZE);

             // Fetch app details for the newly loaded feedback
             const newAppIds = newFeedback.map(fb => fb.appId);
             await fetchAppDetails(newAppIds);

        } catch (err) {
            console.error("Error loading more feedback:", err);
            setError("Failed to load more feedback.");
        } finally {
             setLoadingFeedback(false);
        }
    };

     // --- Render Logic ---
     if (loadingUser) { /* ... initial user loading ... */ }
     if (!user) return null;

     const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 }}};

    return (
        <TesterLayout>
            <Head><title>My Feedback - DevApps Tester</title></Head>

             {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900 flex items-center">
                   <FiClipboard className="mr-3 text-nova-blue-500" /> My Feedback
                </h1>
                 <Link href="/apps/explore" className="text-sm text-nova-blue-600 hover:underline mt-2 sm:mt-0 inline-flex items-center">
                      <FiCompass className="mr-1"/> Explore More Apps
                 </Link>
            </div>

             {/* Error Display */}
             {error}

             {/* Content Area */}
             <div>
                {/* Initial Loading State for Feedback */}
                {loadingFeedback && feedbackList.length === 0 }

                 {/* Empty State (No feedback submitted) */}
                {!loadingFeedback && !error && feedbackList.length === 0 && (
                    <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                         <FiClipboard size={48} className="mx-auto text-nova-gray-400 mb-4" />
                         <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">No Feedback Submitted Yet</h2>
                         <p className="text-nova-gray-500 mb-6">Explore some apps and share your thoughts!</p>
                         <Button href="/apps/explore" variant="primary" icon={FiCompass}>
                             Explore Apps
                         </Button>
                     </div>
                 )}

                 {/* Feedback List */}
                 {feedbackList.length > 0 && (
                     <motion.div
                        className="space-y-6" // Use space-y for list view
                        // className="grid grid-cols-1 lg:grid-cols-2 gap-6" // Optional grid view
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                     >
                         {feedbackList.map((feedback) => (
                             <FeedbackCard
                                key={feedback.id}
                                feedback={feedback}
                                appInfo={appDetails[feedback.appId] || null} // Pass fetched app info
                            />
                         ))}
                     </motion.div>
                 )}

                 {/* Load More Button */}
                 {!loadingFeedback && hasMoreFeedback && feedbackList.length > 0 && (
                      <div className="text-center mt-10">
                         <Button onClick={handleLoadMore} variant="secondary" disabled={loadingFeedback}>
                             {loadingFeedback ? 'Loading...' : 'Load More Feedback'}
                         </Button>
                     </div>
                  )}
             </div>

        </TesterLayout>
    );
}