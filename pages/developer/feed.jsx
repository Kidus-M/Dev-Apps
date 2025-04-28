// pages/developer/feed.jsx
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout';
import BlogPostCard from '../../components/BlogPostCard'; // Import the card
import { FiRss, FiSearch, FiAlertCircle, FiLoader, FiUsers } from 'react-icons/fi';
import { motion } from 'framer-motion';

const FEED_PAGE_SIZE = 9; // Number of posts to load per page

export default function DeveloperFeedPage() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    // Feed State
    const [followingUids, setFollowingUids] = useState([]);
    const [feedPosts, setFeedPosts] = useState([]);
    const [loadingFeed, setLoadingFeed] = useState(false);
    const [lastVisiblePost, setLastVisiblePost] = useState(null); // For pagination
    const [hasMorePosts, setHasMorePosts] = useState(true);

    const router = useRouter();

    // --- Auth Check ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                 // Verify developer role (optional reinforcement)
                 const profileDocRef = doc(db, "profiles", currentUser.uid);
                 const profileSnap = await getDoc(profileDocRef);
                 if (!profileSnap.exists() || profileSnap.data().role !== 'developer') {
                     router.replace('/signin'); return;
                 }
            } else {
                setUser(null);
                router.replace('/signin'); return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]);

    // --- Fetch Following List ---
    const fetchFollowing = useCallback(async () => {
        if (!user) return;
        console.log("Fetching following list for:", user.uid);
        try {
            const q = query(collection(db, 'follows'), where('followerUid', '==', user.uid));
            const snapshot = await getDocs(q);
            const followedIds = snapshot.docs.map(doc => doc.data().followingUid);
            setFollowingUids(followedIds);
            console.log("Following UIDs:", followedIds);
            if (followedIds.length === 0) {
                setHasMorePosts(false); // No one followed, no posts to load
            }
        } catch (err) {
            console.error("Error fetching following list:", err);
            setError("Could not load your following list.");
            setHasMorePosts(false);
        }
    }, [user]); // Depends on user

    // Fetch following list when user loads
    useEffect(() => {
        if (user) {
            fetchFollowing();
        }
    }, [user, fetchFollowing]);

    // --- Fetch Initial Feed Posts ---
    const fetchInitialPosts = useCallback(async () => {
        if (!user || followingUids.length === 0) {
            setFeedPosts([]); // Clear posts if not following anyone
            setLoadingFeed(false);
            setHasMorePosts(false);
            return;
        }

        console.log("Fetching initial feed posts...");
        setLoadingFeed(true);
        setError(null);

        try {
            const postsQuery = query(
                collection(db, "blogPosts"),
                where("authorUid", "in", followingUids), // Filter by followed users
                where("status", "==", "published"), // Only published posts
                orderBy("createdAt", "desc"),
                limit(FEED_PAGE_SIZE)
            );
            const documentSnapshots = await getDocs(postsQuery);
            const posts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFeedPosts(posts);
            setLastVisiblePost(documentSnapshots.docs[documentSnapshots.docs.length - 1]); // Save last doc for pagination
            setHasMorePosts(posts.length === FEED_PAGE_SIZE); // Check if there might be more

        } catch (err) {
            console.error("Error fetching initial feed posts:", err);
            setError("Failed to load feed.");
        } finally {
            setLoadingFeed(false);
        }
    }, [user, followingUids]); // Depends on user and the list of followed UIDs

    // Fetch initial posts only when followingUids state is populated
    useEffect(() => {
        // Check > 0 to prevent query with empty 'in' array which Firestore rejects
        if (followingUids.length > 0) {
            fetchInitialPosts();
        } else if (user) {
            // If user is loaded but following list is empty, set loading to false
             setLoadingFeed(false);
             setHasMorePosts(false);
        }
    }, [followingUids, user, fetchInitialPosts]);

    // --- Load More Posts ---
    const handleLoadMore = async () => {
        if (!user || !lastVisiblePost || followingUids.length === 0) return;

        console.log("Loading more feed posts...");
        setLoadingFeed(true); // Indicate loading more

        try {
            const nextQuery = query(
                collection(db, "blogPosts"),
                where("authorUid", "in", followingUids),
                where("status", "==", "published"),
                orderBy("createdAt", "desc"),
                startAfter(lastVisiblePost), // Start after the last fetched doc
                limit(FEED_PAGE_SIZE)
            );
            const documentSnapshots = await getDocs(nextQuery);
            const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setFeedPosts(prevPosts => [...prevPosts, ...newPosts]); // Append new posts
            setLastVisiblePost(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMorePosts(newPosts.length === FEED_PAGE_SIZE);

        } catch (err) {
            console.error("Error loading more feed posts:", err);
            setError("Failed to load more posts.");
        } finally {
            setLoadingFeed(false);
        }
    };

    // --- Render Logic ---
    if (loadingUser) { return (<div className="min-h-screen flex items-center justify-center">Loading...</div>); }
    if (!user) return null; // Should be redirected

    // Animation variants for the feed grid
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

    return (
        <DeveloperLayout>
            <Head><title>Feed - DevApps Developer</title></Head>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900 flex items-center">
                    <FiRss className="mr-3 text-nova-blue-500" /> Your Feed
                </h1>
                <p className="text-nova-gray-500 text-sm mt-2 sm:mt-0">Updates from developers you follow.</p>
            </div>

            {/* Error Display */}
            {error && (
                 <div className="mb-6 p-4 text-center text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center justify-center space-x-2">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
                </div>
             )}

            {/* Content Area */}
            <div>
                {/* Initial Loading State */}
                {loadingFeed && feedPosts.length === 0 && (
                    <div className="flex justify-center items-center py-10">
                         {/* <FiLoader className="animate-spin text-nova-blue-500 text-3xl" /> */}
                         <p className="ml-3 text-nova-gray-500">Loading feed...</p>
                    </div>
                )}

                {/* Empty State (Not Following Anyone) */}
                 {!loadingFeed && !error && followingUids.length === 0 && (
                     <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                         <FiUsers size={48} className="mx-auto text-nova-gray-400 mb-4" />
                         <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">Your feed is empty!</h2>
                         <p className="text-nova-gray-500 mb-6">Follow some developers to see their latest posts and app updates here.</p>
                         <Button href="/developer/search" variant="primary" icon={FiSearch}>
                             Find Users to Follow
                         </Button>
                     </div>
                 )}

                 {/* Empty State (Following users, but no posts yet) */}
                 {!loadingFeed && !error && followingUids.length > 0 && feedPosts.length === 0 && (
                      <div className="text-center py-16 px-6 bg-white rounded-lg border border-nova-gray-100 shadow-sm">
                          <FiRss size={48} className="mx-auto text-nova-gray-400 mb-4" />
                          <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">No posts to show yet</h2>
                          <p className="text-nova-gray-500">The developers you follow haven't posted anything recently.</p>
                      </div>
                  )}

                {/* Feed Posts Grid */}
                {feedPosts.length > 0 && (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {feedPosts.map((post) => (
                            <BlogPostCard key={post.id} post={post} />
                        ))}
                    </motion.div>
                )}

                {/* Load More Button */}
                {!loadingFeed && hasMorePosts && feedPosts.length > 0 && (
                    <div className="text-center mt-10">
                        <Button onClick={handleLoadMore} variant="secondary" disabled={loadingFeed}>
                            {loadingFeed ? 'Loading...' : 'Load More Posts'}
                        </Button>
                    </div>
                )}

            </div>

        </DeveloperLayout>
    );
}