// pages/developer/following.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc, addDoc, deleteDoc, serverTimestamp, writeBatch, documentId } from 'firebase/firestore'; // Added documentId for 'in' query
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout';
import UserCard from '../../components/UserCard';
import { FiUserCheck, FiAlertCircle, FiLoader, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';

const PAGE_SIZE = 20; // How many profiles to load per batch

export default function FollowingPage() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    // Following State
    const [followingProfiles, setFollowingProfiles] = useState([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    // Note: For this page, everyone listed *is* being followed.
    // We still need the full list for unfollow consistency if UserCard expects it.
    const [followingListSet, setFollowingListSet] = useState(new Set()); // Set of UIDs the current user follows
    const [updatingFollow, setUpdatingFollow] = useState(new Set()); // Set of UIDs currently being updated

    const router = useRouter();

    // --- Auth Check ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Verify developer role
                const profileDocRef = doc(db, "profiles", currentUser.uid);
                const profileSnap = await getDoc(profileDocRef);
                if (!profileSnap.exists() || profileSnap.data().role !== 'developer') {
                    router.replace('/signin'); return;
                }
                setError(null);
            } else {
                setUser(null);
                router.replace('/signin'); return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]);

    // --- Fetch Following List & Profiles ---
    const fetchFollowingData = useCallback(async () => {
        if (!user) return;
        setLoadingProfiles(true);
        setError(null);
        setFollowingProfiles([]); // Reset on fetch
        setFollowingListSet(new Set()); // Also reset the full set

        try {
            // 1. Get the list of UIDs the user follows
            const followsQuery = query(collection(db, 'follows'), where('followerUid', '==', user.uid));
            const followsSnapshot = await getDocs(followsQuery);
            const followedIds = followsSnapshot.docs.map(doc => doc.data().followingUid);
            setFollowingListSet(new Set(followedIds)); // Set the full list for button state consistency

            if (followedIds.length === 0) {
                console.log("User is not following anyone.");
                setFollowingProfiles([]);
                setLoadingProfiles(false);
                return;
            }

            console.log("Fetching profiles for followed UIDs:", followedIds);

            // 2. Fetch profiles for those UIDs (handle potential pagination if needed later)
            // Firestore 'in' query limit is 30 IDs per query currently
            const profilesToFetch = followedIds.slice(0, 30); // Fetch first 30 for now

            const profilesQuery = query(
                collection(db, 'profiles'),
                where(documentId(), 'in', profilesToFetch) // Query by document ID
            );
            const profilesSnapshot = await getDocs(profilesQuery);
            const profiles = profilesSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
            setFollowingProfiles(profiles);
            console.log("Fetched following profiles:", profiles);

        } catch (err) {
            console.error("Error fetching following data:", err);
            setError("Could not load users you follow.");
        } finally {
            setLoadingProfiles(false);
        }
    }, [user]);

    // Trigger fetch when user loads
    useEffect(() => {
        if (user) {
            fetchFollowingData();
        }
    }, [user, fetchFollowingData]);


    // --- Follow/Unfollow Handlers (Adapted from Search Page) ---
    const handleFollow = async (targetUserUid) => {
        // Should generally not be called from this page, but include for consistency if UserCard is generic
        if (!user || updatingFollow.has(targetUserUid) || followingListSet.has(targetUserUid)) return;
        setUpdatingFollow(prev => new Set(prev).add(targetUserUid));
        setError(null);
        try {
            await addDoc(collection(db, 'follows'), { followerUid: user.uid, followingUid: targetUserUid, createdAt: serverTimestamp() });
            setFollowingListSet(prev => new Set(prev).add(targetUserUid)); // Update local state
        } catch (err) { setError(`Could not follow user: ${err.message}`); }
        finally { setUpdatingFollow(prev => { const next = new Set(prev); next.delete(targetUserUid); return next; }); }
    };

    const handleUnfollow = async (targetUserUid) => {
        if (!user || updatingFollow.has(targetUserUid) || !followingListSet.has(targetUserUid)) return;
        setUpdatingFollow(prev => new Set(prev).add(targetUserUid));
        setError(null);
        try {
            const q = query(collection(db, 'follows'), where('followerUid', '==', user.uid), where('followingUid', '==', targetUserUid), limit(1));
            const snapshot = await getDocs(q);
            if (snapshot.empty) throw new Error("Could not find follow relationship.");
            await deleteDoc(doc(db, 'follows', snapshot.docs[0].id));
            setFollowingListSet(prev => { const next = new Set(prev); next.delete(targetUserUid); return next; }); // Update local state
             // Also remove the user from the displayed list on this page
             setFollowingProfiles(prev => prev.filter(p => p.uid !== targetUserUid));
        } catch (err) { setError(`Could not unfollow user: ${err.message}`); }
        finally { setUpdatingFollow(prev => { const next = new Set(prev); next.delete(targetUserUid); return next; }); }
    };

     // --- Render Logic ---
    if (loadingUser) { /* ... loading ... */ }
    if (!user) return null; // Auth check

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 }}};

    return (
        <DeveloperLayout>
            <Head><title>Following - DevApps Developer</title></Head>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900 flex items-center">
                    <FiUserCheck className="mr-3 text-nova-blue-500" /> Following
                </h1>
                 <Link href="/developer/search" className="text-sm text-nova-blue-600 hover:underline mt-2 sm:mt-0 inline-flex items-center">
                      <FiSearch className="mr-1"/> Find More Users
                 </Link>
            </div>

            {/* Error Display */}
             {error }

            {/* Content Area */}
            <div>
                 {loadingProfiles }

                 {!loadingProfiles && !error && followingProfiles.length === 0 && (
                      <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                          <FiUsers size={48} className="mx-auto text-nova-gray-400 mb-4" />
                          <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">You aren't following anyone yet.</h2>
                          <p className="text-nova-gray-500 mb-6">Find developers and testers to see their updates in your feed.</p>
                          <Button href="/developer/search" variant="primary" icon={FiSearch}>
                              Search for Users
                          </Button>
                      </div>
                  )}

                 {!loadingProfiles && !error && followingProfiles.length > 0 && (
                     <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                        variants={containerVariants} initial="hidden" animate="visible"
                    >
                         {followingProfiles.map((profile) => (
                             <UserCard
                                 key={profile.uid}
                                 profile={profile}
                                 currentUserId={user.uid}
                                 // Everyone on this list IS being followed
                                 isFollowing={true}
                                 isUpdating={updatingFollow.has(profile.uid)}
                                 onFollow={handleFollow} // Pass handlers
                                 onUnfollow={handleUnfollow}
                             />
                         ))}
                     </motion.div>
                 )}
                 {/* TODO: Add pagination / Load More button if needed */}
            </div>

        </DeveloperLayout>
    );
}