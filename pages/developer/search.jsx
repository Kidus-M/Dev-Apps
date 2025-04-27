// pages/developer/search.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAt, endAt, doc, getDoc, addDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout';
import UserCard from '../../components/UserCard'; // Import the new card
import { FiSearch, FiAlertCircle, FiUsers, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
// --- Debounce Hook (Optional but Recommended) ---
// You can use a library like 'use-debounce' or write a simple one
import { useDebounce } from 'use-debounce'; // Example: npm install use-debounce

export default function SearchUsersPage() {
    const [user, setUser] = useState(null); // Current logged-in user
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // Debounce input by 500ms
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Follow State
    const [followingList, setFollowingList] = useState(new Set()); // Set of UIDs the current user follows
    const [updatingFollow, setUpdatingFollow] = useState(new Set()); // Set of UIDs currently being updated

    const router = useRouter();

    // --- Auth Check ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                 setUser(currentUser);
                 // Verify developer role (optional but good)
                 const profileDocRef = doc(db, "profiles", currentUser.uid);
                 const profileSnap = await getDoc(profileDocRef);
                 if (!profileSnap.exists() || profileSnap.data().role !== 'developer') {
                     router.replace('/signin'); return;
                 }
                 fetchFollowingList(currentUser.uid); // Fetch initial follow list
                 setError(null);
            } else {
                 setUser(null);
                 router.replace('/signin'); return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]);

    // --- Fetch Initial Following List ---
    const fetchFollowingList = useCallback(async (currentUserId) => {
         if (!currentUserId) return;
         console.log("Fetching following list for:", currentUserId);
         try {
            const q = query(collection(db, 'follows'), where('followerUid', '==', currentUserId));
            const snapshot = await getDocs(q);
            const followedIds = new Set(snapshot.docs.map(doc => doc.data().followingUid));
            setFollowingList(followedIds);
            console.log("Following list:", followedIds);
         } catch (err) {
             console.error("Error fetching following list:", err);
             setError("Could not load your following status.");
         }
    }, []); // Empty dependency array means this runs once on user load typically

    // --- Perform Search when Debounced Term Changes ---
    useEffect(() => {
        const performSearch = async () => {
            if (!user || !debouncedSearchTerm || debouncedSearchTerm.trim().length < 2) {
                setSearchResults([]); // Clear results if term is too short
                setSearchPerformed(debouncedSearchTerm.trim().length >= 2); // Track if search was attempted
                return;
            }

            console.log(`Searching for username starting with: "${debouncedSearchTerm}"`);
            setLoadingSearch(true);
            setError(null);
            setSearchPerformed(true);

            try {
                const lowerCaseTerm = debouncedSearchTerm.toLowerCase();
                const profilesRef = collection(db, "profiles");
                // Firestore prefix search using >= and < trick
                const q = query(
                    profilesRef,
                    where('username', '>=', lowerCaseTerm),
                    where('username', '<', lowerCaseTerm + '\uf8ff'), // \uf8ff is a high unicode char
                    limit(20) // Limit results
                );

                const querySnapshot = await getDocs(q);
                const results = querySnapshot.docs
                    .map(doc => ({ uid: doc.id, ...doc.data() }))
                    .filter(profile => profile.uid !== user.uid); // Exclude self from results

                setSearchResults(results);
                console.log("Search results:", results);

            } catch (err) {
                console.error("Error performing search:", err);
                setError("Failed to search for users.");
                setSearchResults([]);
            } finally {
                setLoadingSearch(false);
            }
        };

        performSearch();
    }, [debouncedSearchTerm, user]); // Re-run search when debounced term or user changes


    // --- Follow/Unfollow Handlers ---
    const handleFollow = async (targetUserUid) => {
         if (!user || updatingFollow.has(targetUserUid)) return;

         console.log(`Following user: ${targetUserUid}`);
         setUpdatingFollow(prev => new Set(prev).add(targetUserUid)); // Indicate loading for this user
         setError(null);

        try {
            // Check if already following (client-side check first)
            if (followingList.has(targetUserUid)) {
                 console.warn("Already following, shouldn't happen based on button state.");
                 setUpdatingFollow(prev => { const next = new Set(prev); next.delete(targetUserUid); return next; });
                 return;
            }

            const followData = {
                followerUid: user.uid,
                followingUid: targetUserUid,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'follows'), followData);

            // Update local state optimistically
            setFollowingList(prev => new Set(prev).add(targetUserUid));
            console.log("Follow successful");

            // TODO: Trigger Cloud Function to update counts in profiles

        } catch (err) {
             console.error("Error following user:", err);
             setError(`Could not follow user: ${err.message}`);
             // Rollback optimistic update might be needed if critical
        } finally {
            setUpdatingFollow(prev => { const next = new Set(prev); next.delete(targetUserUid); return next; }); // Remove loading state
        }
    };

    const handleUnfollow = async (targetUserUid) => {
         if (!user || updatingFollow.has(targetUserUid)) return;

         console.log(`Unfollowing user: ${targetUserUid}`);
         setUpdatingFollow(prev => new Set(prev).add(targetUserUid));
         setError(null);

        try {
             // Check if actually following (client-side check first)
            if (!followingList.has(targetUserUid)) {
                 console.warn("Not following, shouldn't happen based on button state.");
                  setUpdatingFollow(prev => { const next = new Set(prev); next.delete(targetUserUid); return next; });
                 return;
            }

             // Find the follow document ID
            const q = query(
                collection(db, 'follows'),
                where('followerUid', '==', user.uid),
                where('followingUid', '==', targetUserUid),
                limit(1)
             );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error("Could not find follow relationship to delete.");
            }

            const followDocId = snapshot.docs[0].id;
            await deleteDoc(doc(db, 'follows', followDocId));

            // Update local state optimistically
            setFollowingList(prev => { const next = new Set(prev); next.delete(targetUserUid); return next; });
            console.log("Unfollow successful");

            // TODO: Trigger Cloud Function to update counts in profiles

        } catch (err) {
             console.error("Error unfollowing user:", err);
             setError(`Could not unfollow user: ${err.message}`);
             // Rollback optimistic update might be needed if critical
        } finally {
            setUpdatingFollow(prev => { const next = new Set(prev); next.delete(targetUserUid); return next; }); // Remove loading state
        }
    };


    // --- Render Logic ---
    if (loadingUser) { return (<div className="min-h-screen flex items-center justify-center">Loading...</div>); }
    if (!user) return null; // Should be redirected

     // Grid animation variants
     const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 }}};


    return (
        <DeveloperLayout>
            <Head><title>Search Users - DevApps Developer</title></Head>

            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900">Search Users</h1>
                <p className="text-nova-gray-500 text-sm mt-1">Find and connect with other developers and testers.</p>
            </div>

            {/* Search Input */}
             <div className="relative mb-8">
                <FiSearch className="absolute top-1/2 left-3.5 transform -translate-y-1/2 text-nova-gray-400 pointer-events-none" size={18}/>
                <input
                    type="search"
                    placeholder="Search by username (min 2 chars)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-nova-gray-300 rounded-lg focus:ring-2 focus:ring-nova-blue-300 focus:border-nova-blue-500 transition duration-150"
                />
             </div>

             {/* Error Display */}
             {error && (
                 <div className="mb-6 p-4 text-center text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center justify-center space-x-2">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
                </div>
             )}

             {/* Search Results Area */}
             <div>
                 {loadingSearch && (
                     <div className="flex justify-center items-center py-10">
                         <FiLoader className="animate-spin text-nova-blue-500 text-3xl" />
                     </div>
                 )}

                 {!loadingSearch && searchPerformed && searchResults.length === 0 && (
                     <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                         <FiUsers size={48} className="mx-auto text-nova-gray-400 mb-4" />
                         <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">No users found</h2>
                         <p className="text-nova-gray-500">Try refining your search term.</p>
                    </div>
                 )}

                 {!loadingSearch && searchResults.length > 0 && (
                     <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                     >
                         {searchResults.map((profile) => (
                             <UserCard
                                 key={profile.uid}
                                 profile={profile}
                                 currentUserId={user.uid}
                                 isFollowing={followingList.has(profile.uid)}
                                 isUpdating={updatingFollow.has(profile.uid)}
                                 onFollow={handleFollow}
                                 onUnfollow={handleUnfollow}
                             />
                         ))}
                     </motion.div>
                 )}

                 {/* Initial state before search */}
                  {!loadingSearch && !searchPerformed && searchTerm.length < 2 && (
                     <div className="text-center py-16 px-6 bg-white rounded-lg border border-nova-gray-100">
                         <FiSearch size={48} className="mx-auto text-nova-gray-300 mb-4" />
                         <p className="text-nova-gray-500">Enter at least 2 characters to search for users by username.</p>
                    </div>
                 )}

             </div>


        </DeveloperLayout>
    );
}