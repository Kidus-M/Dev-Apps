// pages/developer/blog.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout';
import { FiPlusSquare, FiEdit, FiTrash2, FiEye, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function DeveloperBlogPage() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Fetch user and their posts
    useEffect(() => {
        setLoading(true);
        setError(null);
        setPosts([]);

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Verify developer role (optional reinforcement)
                const profileDocRef = doc(db, "profiles", currentUser.uid);
                const profileSnap = await getDoc(profileDocRef);
                if (!profileSnap.exists() || profileSnap.data().role !== 'developer') {
                    router.replace('/signin'); // Or appropriate redirect
                    return;
                }

                // Fetch posts
                try {
                    console.log("Fetching blog posts for developer:", currentUser.uid);
                    const postsQuery = query(
                        collection(db, "blogPosts"),
                        where("authorUid", "==", currentUser.uid),
                        orderBy("createdAt", "desc")
                    );
                    const querySnapshot = await getDocs(postsQuery);
                    const fetchedPosts = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setPosts(fetchedPosts);
                    console.log("Fetched posts:", fetchedPosts);
                } catch (err) {
                    console.error("Error fetching blog posts:", err);
                    setError("Failed to load your blog posts.");
                } finally {
                    setLoading(false);
                }
            } else {
                setUser(null);
                router.replace('/signin');
                return;
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleDeletePost = async (postId, postTitle) => {
        if (!confirm(`Are you sure you want to delete the post "${postTitle || 'this post'}"? This cannot be undone.`)) {
            return;
        }
        setError(null);
        try {
            const postRef = doc(db, "blogPosts", postId);
            await deleteDoc(postRef);
            setPosts(prevPosts => prevPosts.filter(post => post.id !== postId)); // Update UI immediately
            console.log("Post deleted successfully:", postId);
        } catch (err) {
            console.error("Error deleting post:", err);
            setError(`Failed to delete post: ${err.message}`);
        }
    };

     // Animation variants
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

    return (
        <DeveloperLayout>
            <Head><title>My Blog Posts - DevApps Developer</title></Head>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900">My Blog Posts</h1>
                <Button href="/developer/new-post" variant="primary" icon={FiPlusSquare} className="mt-4 sm:mt-0">
                    Create New Post
                </Button>
            </div>

            {/* Loading State */}
            {loading && <div className="text-center py-10 text-nova-gray-500">Loading posts...</div>}

             {/* Error State */}
             {error && !loading && (
                 <div className="p-4 text-center text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center justify-center space-x-2">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
                </div>
             )}

            {/* Empty State */}
            {!loading && !error && posts.length === 0 && (
                <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-nova-gray-300">
                    <FiFileText size={48} className="mx-auto text-nova-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">No blog posts yet!</h2>
                    <p className="text-nova-gray-500 mb-6">Share your ideas, tutorials, or updates with the community.</p>
                    <Button href="/developer/new-post" variant="primary" icon={FiPlusSquare}>
                        Write Your First Post
                    </Button>
                </div>
            )}

            {/* Posts List/Table */}
            {!loading && !error && posts.length > 0 && (
                 <motion.div
                    className="bg-white rounded-lg shadow overflow-hidden border border-nova-gray-100"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                 >
                    <ul role="list" className="divide-y divide-nova-gray-200">
                        {posts.map((post) => (
                            <motion.li key={post.id} variants={itemVariants} className="px-4 py-4 sm:px-6 hover:bg-nova-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/developer/edit-post/${post.id}`} className="block">
                                             <p className="text-md font-semibold text-nova-blue-700 truncate hover:underline" title={post.title}>
                                                {post.title || 'Untitled Post'}
                                             </p>
                                        </Link>
                                        <div className="mt-1 flex items-center text-xs text-nova-gray-500 space-x-2">
                                            <span className={`capitalize px-1.5 py-0.5 rounded text-xs font-medium ${
                                                post.status === 'published' ? 'bg-nova-success-100 text-nova-success-800' : 'bg-nova-gray-100 text-nova-gray-600'
                                            }`}>
                                                {post.status || 'draft'}
                                            </span>
                                            <span>|</span>
                                             <span>
                                                 Created: {post.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                                             </span>
                                              <span>|</span>
                                              <span>Likes: {post.likeCount || 0}</span>
                                              <span>|</span>
                                              <span>Comments: {post.commentCount || 0}</span>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                                        {/* View Public Link (adjust href later based on public route) */}
                                        {post.status === 'published' && (
                                             <Link href={`/blog/${post.id}`} passHref legacyBehavior>
                                                <a title="View Public Post" className="p-1 text-nova-gray-400 hover:text-nova-blue-600"> <FiEye size={16}/> </a>
                                             </Link>
                                        )}
                                        <Link href={`/developer/edit-post/${post.id}`} passHref legacyBehavior>
                                            <a title="Edit Post" className="p-1 text-nova-gray-400 hover:text-nova-green-600"><FiEdit size={16}/></a>
                                        </Link>
                                        <button
                                            onClick={() => handleDeletePost(post.id, post.title)}
                                            title="Delete Post"
                                            className="p-1 text-nova-gray-400 hover:text-nova-error-600"
                                        >
                                            <FiTrash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
            )}

        </DeveloperLayout>
    );
}