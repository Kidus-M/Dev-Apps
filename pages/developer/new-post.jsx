// pages/developer/new-post.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout';
import { FiSave, FiSend, FiAlertCircle, FiLoader, FiType, FiTag, FiImage } from 'react-icons/fi';
// --- Markdown Preview (Optional but Recommended) ---
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NewPostPage() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); // Markdown content
    const [tags, setTags] = useState(''); // Comma-separated tags
    const [coverImageFile, setCoverImageFile] = useState(null); // Optional cover image file
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const router = useRouter();

     // --- Auth & Profile Check ---
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

    // --- Save Post Logic ---
    const handleSavePost = async (status = 'draft') => { // 'draft' or 'published'
        setError(null);
        if (!user) { setError("Authentication Error."); return; }
        if (!title.trim()) { setError("Post title cannot be empty."); return; }
        if (!content.trim()) { setError("Post content cannot be empty."); return; }

        if (status === 'published') setIsPublishing(true);
        else setIsSavingDraft(true);

        // TODO: Handle cover image upload to Supabase Storage if coverImageFile exists
        // let coverImageUrl = null;
        // if (coverImageFile) { /* ... upload logic ... */ }

        const postData = {
            authorUid: user.uid,
            title: title.trim(),
            // TODO: Generate slug from title (e.g., using a library or simple function)
            slug: title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            content: content.trim(), // Store raw Markdown
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag), // Store tags as an array
            status: status,
            // coverImageUrl: coverImageUrl, // Add if implemented
            likeCount: 0,
            commentCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        try {
            const docRef = await addDoc(collection(db, "blogPosts"), postData);
            console.log("Blog post saved with ID:", docRef.id);

            // Redirect after save/publish
            if (status === 'published') {
                // Redirect to the public view of the post (assuming /blog/[postId] route)
                router.push(`/blog/${docRef.id}`);
            } else {
                 // Redirect to the blog management page after saving draft
                router.push('/developer/blog');
            }

        } catch (err) {
            console.error("Error saving post:", err);
            setError(`Failed to save post: ${err.message}`);
             if (status === 'published') setIsPublishing(false);
             else setIsSavingDraft(false);
        }
        // No need to set loading false here due to redirect
    };


    // --- Loading/Auth Check ---
    if (loadingUser) { /* ... loading ... */ }
    if (!user) return null;

    const isLoading = isSavingDraft || isPublishing;

    return (
        <DeveloperLayout>
            <Head><title>Create New Blog Post - DevApps Developer</title></Head>

             {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900">Create New Blog Post</h1>
                 <Link href="/developer/blog" className="text-sm text-nova-blue-600 hover:underline mt-2 sm:mt-0">
                      &larr; Back to My Posts
                 </Link>
            </div>

             {/* Error Display */}
             {error && (
                 <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="mb-6 p-4 text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center space-x-2">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
                </motion.div>
             )}

             {/* Editor Form */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                 {/* --- Editor Area --- */}
                 <div className="lg:col-span-2 space-y-6">
                      {/* Title Input */}
                     <div>
                         <label htmlFor="postTitle" className="block text-sm font-medium text-nova-gray-700 mb-1">Title</label>
                         <input
                             type="text" id="postTitle" value={title} onChange={(e) => setTitle(e.target.value)}
                             className="w-full input-style text-lg" placeholder="Your Catchy Post Title"
                             required disabled={isLoading}
                         />
                     </div>

                      {/* Content Input (Markdown) */}
                     <div>
                         <label htmlFor="postContent" className="block text-sm font-medium text-nova-gray-700 mb-1">Content (Markdown)</label>
                         <textarea
                            id="postContent" value={content} onChange={(e) => setContent(e.target.value)}
                            rows="15" className="w-full input-style font-mono text-sm"
                            placeholder="Write your thoughts here... Supports Markdown formatting."
                            required disabled={isLoading}
                         ></textarea>
                     </div>
                 </div>

                 {/* --- Sidebar (Metadata & Actions) --- */}
                 <div className="lg:col-span-1 space-y-6">
                     {/* Actions Box */}
                     <div className="bg-white p-4 rounded-lg shadow border border-nova-gray-100 space-y-3">
                         <h2 className="text-lg font-semibold text-nova-gray-800 mb-2">Actions</h2>
                         <Button
                             variant="secondary" onClick={() => handleSavePost('draft')}
                             disabled={isLoading || !title || !content} icon={isSavingDraft ? null : FiSave}
                             className="w-full justify-center"
                         >
                            {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
                         </Button>
                          <Button
                             variant="primary" onClick={() => handleSavePost('published')}
                             disabled={isLoading || !title || !content} icon={isPublishing ? null : FiSend}
                             className="w-full justify-center"
                         >
                            {isPublishing ? 'Publishing...' : 'Publish Post'}
                         </Button>
                     </div>

                     {/* Metadata Box */}
                    <div className="bg-white p-4 rounded-lg shadow border border-nova-gray-100 space-y-4">
                         <h2 className="text-lg font-semibold text-nova-gray-800 mb-2">Details</h2>
                         {/* Tags Input */}
                         <div>
                            <label htmlFor="postTags" className="block text-sm font-medium text-nova-gray-700 mb-1">Tags</label>
                             <div className="relative">
                                 <FiTag className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="text" id="postTags" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full pl-10 input-style" placeholder="react, firebase, javascript" disabled={isLoading}/>
                            </div>
                            <p className="text-xs text-nova-gray-500 mt-1">Comma-separated tags.</p>
                        </div>
                         {/* Cover Image Input (Basic) */}
                         <div>
                             <label htmlFor="coverImage" className="block text-sm font-medium text-nova-gray-700 mb-1">Cover Image (Optional)</label>
                             <input type="file" id="coverImage" accept="image/*"
                                // onChange={(e) => setCoverImageFile(e.target.files[0])} // Add state and handler later
                                className="block w-full text-sm text-nova-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-nova-blue-50 file:text-nova-blue-700 hover:file:bg-nova-blue-100 disabled:opacity-50"
                                disabled={isLoading}
                             />
                             <p className="text-xs text-nova-gray-500 mt-1">Upload an image to display with your post.</p>
                         </div>
                    </div>

                     {/* Markdown Preview Box (Optional but helpful) */}
                     <div className="bg-white p-4 rounded-lg shadow border border-nova-gray-100">
                         <h2 className="text-lg font-semibold text-nova-gray-800 mb-2">Preview</h2>
                         <div className="prose prose-sm max-w-none h-64 overflow-y-auto border p-2 rounded">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content || "*Start writing to see a preview...*"}
                             </ReactMarkdown>
                         </div>
                     </div>

                 </div>

             </div>
             {/* Helper for input style reuse */}
             <style jsx>{`
                .input-style { @apply block w-full px-3 py-2 border border-nova-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150 ease-in-out sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed; }
                /* Basic prose styles for markdown preview */
                 .prose :where(h1,h2,h3,h4,h5,h6){@apply font-semibold mb-2 mt-4;} .prose :where(h1){@apply text-2xl;} .prose :where(h2){@apply text-xl;} .prose :where(h3){@apply text-lg;} .prose :where(p){@apply mb-4;} .prose :where(ul,ol){@apply list-inside list-disc pl-4 mb-4;} .prose :where(a){@apply text-nova-blue-600 hover:underline;} .prose :where(pre){@apply bg-nova-gray-100 p-2 rounded text-xs overflow-x-auto;} .prose :where(code):not(pre code){@apply bg-nova-gray-100 px-1 rounded text-xs;} .prose :where(blockquote){@apply border-l-4 border-nova-gray-300 pl-4 italic text-nova-gray-600 my-4;}
            `}</style>
        </DeveloperLayout>
    );
}