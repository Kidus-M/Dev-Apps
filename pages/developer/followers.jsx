// pages/developer/followers.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc, addDoc, deleteDoc, serverTimestamp, writeBatch, documentId } from 'firebase/firestore';
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout';
import UserCard from '../../components/UserCard';
import { FiUsers, FiAlertCircle, FiLoader, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';

const PAGE_SIZE = 20;

export default function FollowersPage() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    // Follower State
    const [followerProfiles, setFollowerProfiles] = useState([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [followingListSet, setFollowingListSet] = useState(new Set()); // Still need this to show correct button state on follower cards
    const [updatingFollow, setUpdatingFollow] = useState(new Set()); // Track follow/unfollow actions

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
                 fetchFollowingList(currentUser.uid); // Fetch who the current user follows
                 setError(null);
            } else {
                 setUser(null);
                 router.replace('/signin'); return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]);

     // --- Fetch Initial Following List (needed for button states) ---
     const fetchFollowingList = useCallback(async (currentUserId) => {
         if (!currentUserId) return;
         console.log("Fetching current user's following list for button states...");
         try {
            const q = query(collection(db, 'follows'), where('followerUid', '==', currentUserId));
            const snapshot = await getDocs(q);
            const followedIds = new Set(snapshot.docs.map(doc => doc.data().followingUid));
            setFollowingListSet(followedIds);
         } catch (err) {
             console.error("Error fetching following list:", err);
             // Non-critical for displaying followers, but buttons might be wrong
         }
    }, []);

    // --- Fetch Followers List & Profiles ---
    const fetchFollowersData = useCallback(async () => {
        if (!user) return;
        setLoadingProfiles(true);
        setError(null);
        setFollowerProfiles([]);

        try {
            // 1. Get the list of UIDs who follow the current user
            const followsQuery = query(collection(db, 'follows'), where('followingUid', '==', user.uid));
            const followsSnapshot = await getDocs(followsQuery);
            const followerIds = followsSnapshot.docs.map(doc => doc.data().followerUid);

            if (followerIds.length === 0) {
                console.log("User has no followers.");
                setFollowerProfiles([]);
                setLoadingProfiles(false);
                return;
            }

            console.log("Fetching profiles for follower UIDs:", followerIds);

            // 2. Fetch profiles for those UIDs (handle pagination if needed)
            const profilesToFetch = followerIds.slice(0, 30); // Fetch first 30

            const profilesQuery = query(
                collection(db, 'profiles'),
                where(documentId(), 'in', profilesToFetch)
            );
            const profilesSnapshot = await getDocs(profilesQuery);
            const profiles = profilesSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
            setFollowerProfiles(profiles);
            console.log("Fetched follower profiles:", profiles);

        } catch (err) {
            console.error("Error fetching followers data:", err);
            setError("Could not load your followers.");
        } finally {
            setLoadingProfiles(false);
        }
    }, [user]);

    // Trigger fetch when user loads
    useEffect(() => {
        if (user) {
            fetchFollowersData();
        }
    }, [user, fetchFollowersData]);


    // --- Follow/Unfollow Handlers (Needed for buttons on follower cards) ---
    const handleFollow = async (targetUserUid) => {
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
        } catch (err) { setError(`Could not unfollow user: ${err.message}`); }
        finally { setUpdatingFollow(prev => { const next = new Set(prev); next.delete(targetUserUid); return next; }); }
    };

     // --- Render Logic ---
    if (loadingUser) { /* ... loading ... */ }
    if (!user) return null;

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 }}};

    return (
        <DeveloperLayout>
            <Head><title>Followers - DevApps Developer</title></Head>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                 <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900 flex items-center">
                     <FiUsers className="mr-3 text-nova-blue-500" /> Followers
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

                  {!loadingProfiles && !error && followerProfiles.length === 0 && (
                       <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                           <FiUsers size={48} className="mx-auto text-nova-gray-400 mb-4" />
                           <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">No followers yet.</h2>
                           <p className="text-nova-gray-500">Share your profile and apps to attract followers!</p>
                       </div>
                   )}

                  {!loadingProfiles && !error && followerProfiles.length > 0 && (
                      <motion.div
                         className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                         variants={containerVariants} initial="hidden" animate="visible"
                     >
                          {followerProfiles.map((profile) => (
                              <UserCard
                                  key={profile.uid}
                                  profile={profile}
                                  currentUserId={user.uid}
                                  // Check if the current user is ALSO following this follower
                                  isFollowing={followingListSet.has(profile.uid)}
                                  isUpdating={updatingFollow.has(profile.uid)}
                                  onFollow={handleFollow}
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