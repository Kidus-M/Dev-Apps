// components/UserCard.jsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiUser, FiTool, FiUsers, FiPlus, FiCheck } from 'react-icons/fi';
import Button from './Button'; // Assuming your Button component handles disabled state

const UserCard = ({ profile, isFollowing, onFollow, onUnfollow, isUpdatingFollow, currentUserId }) => {
    if (!profile || !profile.uid) return null; // Need profile and UID

    // Don't show follow button for the current user's own card
    const isCurrentUser = profile.uid === currentUserId;

    const cardVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    const handleFollow = (e) => {
        e.preventDefault(); // Prevent link navigation if card is wrapped in Link
        if (!isUpdatingFollow) onFollow(profile.uid);
    };

    const handleUnfollow = (e) => {
        e.preventDefault();
        if (!isUpdatingFollow) onUnfollow(profile.uid);
    };

    return (
        <motion.div
            variants={cardVariants}
            className="bg-white rounded-lg shadow border border-nova-gray-100 p-4 flex flex-col items-center text-center transition-shadow hover:shadow-md"
        >
            {/* Avatar Placeholder */}
            <Link href={`/users/${profile.uid}`} passHref legacyBehavior>
                <a className="block mb-3">
                     <div className="w-20 h-20 rounded-full overflow-hidden bg-nova-gray-200 ring-2 ring-offset-2 ring-nova-blue-100 flex items-center justify-center mx-auto mb-3">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={`${profile.username || 'User'}'s avatar`} className="w-full h-full object-cover" />
                        ) : (
                            <FiUser className="w-10 h-10 text-nova-gray-400" />
                        )}
                     </div>
                </a>
            </Link>

            {/* Username & Role */}
             <Link href={`/users/${profile.uid}`} passHref legacyBehavior>
                <a className="block">
                    <h3 className="text-md font-semibold text-nova-gray-800 hover:text-nova-blue-600 truncate w-full" title={profile.username}>
                        {profile.username || 'Unnamed User'}
                    </h3>
                </a>
             </Link>
            <p className="text-xs capitalize text-nova-gray-500 mb-3 flex items-center justify-center">
                {profile.role === 'developer' ? <FiTool className="w-3 h-3 mr-1"/> : <FiUsers className="w-3 h-3 mr-1"/>}
                {profile.role || 'Member'}
            </p>

            {/* Placeholder for Tagline or Skills */}
            {/* <p className="text-xs text-nova-gray-500 mb-4 line-clamp-2">
                {profile.tagline || 'No tagline yet.'}
            </p> */}

            {/* Follow/Unfollow Button */}
            {!isCurrentUser && ( // Only show if not the logged-in user
                 <div className="mt-auto w-full">
                     {isFollowing ? (
                         <Button
                             onClick={handleUnfollow}
                             variant="secondary"
                             className="w-full !text-xs !px-3 !py-1.5 !border-nova-gray-300 !text-nova-gray-600 hover:!bg-nova-error-50 hover:!border-nova-error-500 hover:!text-nova-error-600"
                             icon={isUpdatingFollow ? FiLoader : FiCheck}
                             disabled={isUpdatingFollow}
                         >
                             {isUpdatingFollow ? '...' : 'Following'}
                         </Button>
                     ) : (
                          <Button
                             onClick={handleFollow}
                             variant="primary"
                             className="w-full !text-xs !px-3 !py-1.5"
                             icon={isUpdatingFollow ? FiLoader : FiPlus}
                             disabled={isUpdatingFollow}
                          >
                             {isUpdatingFollow ? '...' : 'Follow'}
                         </Button>
                     )}
                 </div>
            )}
        </motion.div>
    );
};

export default UserCard;