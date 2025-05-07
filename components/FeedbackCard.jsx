// components/FeedbackCard.jsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiClock, FiMessageSquare, FiEdit, FiTrash2, FiBox, FiExternalLink } from 'react-icons/fi';
import StarRating from './StarRating'; // Import star component

const FeedbackCard = ({ feedback, appInfo }) => {
    // feedback object: { id, appId, rating, comment, createdAt, testerUid }
    // appInfo object: { name, iconUrl, type } (fetched separately)

    if (!feedback) return null;

    const cardVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={cardVariants}
            className="bg-white rounded-lg shadow border border-nova-gray-100 p-5 transition-shadow hover:shadow-md"
        >
            {/* App Info Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-nova-gray-100">
                <div className="flex items-center min-w-0">
                     {/* App Icon */}
                     <div className="flex-shrink-0 mr-3 w-10 h-10 rounded-md bg-nova-gray-100 flex items-center justify-center overflow-hidden">
                         {appInfo?.iconUrl ? (
                            <img src={appInfo.iconUrl} alt={`${appInfo.name || 'App'} icon`} className="w-full h-full object-cover" />
                         ) : (
                             <FiBox className="w-5 h-5 text-nova-gray-400" />
                         )}
                     </div>
                     {/* App Name */}
                     <div className="min-w-0">
                         <p className="text-sm font-semibold text-nova-gray-800 truncate" title={appInfo?.name || 'Loading App...'}>
                             {appInfo?.name || 'Loading App...'}
                         </p>
                         <p className="text-xs text-nova-gray-500">Feedback Submitted</p>
                     </div>
                </div>
                 {/* Link to App */}
                 <Link href={`/apps/${feedback.appId}`} passHref legacyBehavior>
                     <a title="View App Details" className="flex-shrink-0 ml-2 p-1 text-nova-gray-400 hover:text-nova-blue-600 transition-colors">
                        <FiExternalLink size={16}/>
                     </a>
                 </Link>
            </div>

            {/* Rating and Date */}
            <div className="flex items-center justify-between mb-2 text-xs text-nova-gray-500">
                <StarRating rating={feedback.rating} />
                <span className="flex items-center">
                    <FiClock className="w-3 h-3 mr-1"/>
                    {feedback.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                </span>
            </div>

            {/* Comment */}
            <p className="text-sm text-nova-gray-700 mb-4 line-clamp-4">
                {feedback.comment || <span className="italic text-nova-gray-400">No comment provided.</span>}
            </p>

            {/* Actions (Edit/Delete - Placeholder) */}
             {/* <div className="flex justify-end space-x-2 pt-2 border-t border-nova-gray-100">
                 <button title="Edit Feedback" className="p-1 text-nova-gray-400 hover:text-nova-green-600"><FiEdit size={14}/></button>
                 <button title="Delete Feedback" className="p-1 text-nova-gray-400 hover:text-nova-error-600"><FiTrash2 size={14}/></button>
             </div> */}

        </motion.div>
    );
};

export default FeedbackCard;