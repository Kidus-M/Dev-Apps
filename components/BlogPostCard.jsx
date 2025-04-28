// update later to use the new path
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiHeart, FiClock, FiUser } from 'react-icons/fi';

// Basic function to create a snippet
const createSnippet = (content, length = 150) => {
    if (!content) return '';
    // Remove markdown images, headings, code blocks for snippet
    const strippedContent = content
        .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
        .replace(/#{1,6}\s.*$/gm, '')    // Remove headings
        .replace(/```[\s\S]*?```/g, '')  // Remove code blocks
        .replace(/[*_`~]/g, '');       // Remove basic markdown chars
    return strippedContent.length > length
        ? strippedContent.substring(0, length) + '...'
        : strippedContent;
};

const BlogPostCard = ({ post }) => {
    if (!post) return null;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    return (
        <motion.div
            variants={cardVariants}
            className="bg-white rounded-lg shadow border border-nova-gray-100 overflow-hidden transition-shadow hover:shadow-md"
        >
            {/* Optional Cover Image Placeholder */}
            {/* {post.coverImageUrl && <img src={post.coverImageUrl} alt="" className="h-40 w-full object-cover"/>} */}

            <div className="p-5">
                 {/* Author Placeholder - Fetch profile later */}
                <div className="flex items-center text-xs text-nova-gray-500 mb-2">
                    <FiUser className="w-3 h-3 mr-1.5"/>
                     <span>Author UID: {post.authorUid.substring(0, 6)}...</span> {/* Show truncated UID for now */}
                     <span className="mx-1.5">&middot;</span>
                    <FiClock className="w-3 h-3 mr-1"/>
                    <span>{post.createdAt?.toDate().toLocaleDateString() || 'N/A'}</span>
                </div>

                {/* Title */}
                <Link href={`/blog/${post.id}`} passHref legacyBehavior>
                    <a className="block mb-2">
                        <h3 className="text-lg font-semibold text-nova-gray-900 hover:text-nova-blue-600 transition-colors line-clamp-2" title={post.title}>
                            {post.title || 'Untitled Post'}
                        </h3>
                    </a>
                </Link>

                {/* Snippet */}
                <p className="text-sm text-nova-gray-600 mb-4 line-clamp-3">
                    {createSnippet(post.content)}
                </p>

                {/* Footer with Stats */}
                <div className="flex justify-between items-center text-xs text-nova-gray-500 pt-3 border-t border-nova-gray-100">
                     <div className="flex space-x-4">
                        <span className="flex items-center hover:text-nova-red-500"> {/* Like interaction later */}
                            <FiHeart className="w-3.5 h-3.5 mr-1"/> {post.likeCount || 0}
                        </span>
                         <span className="flex items-center hover:text-nova-blue-500"> {/* Comment interaction later */}
                             <FiMessageSquare className="w-3.5 h-3.5 mr-1"/> {post.commentCount || 0}
                         </span>
                     </div>
                     {/* Tags Placeholder */}
                     {/* <div className="flex space-x-1"> {post.tags?.map(tag => <span key={tag} className="bg-nova-gray-100 px-1.5 rounded text-nova-gray-600">{tag}</span>)}</div> */}
                </div>
            </div>
        </motion.div>
    );
};

export default BlogPostCard;