// components/ChatListItem.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseClient'; // Adjust path

const ChatListItem = ({ chatInfo, currentUserId, onClick, isSelected }) => {
    const [otherUserInfo, setOtherUserInfo] = useState({ username: 'Loading...', avatarUrl: null });
    const [loading, setLoading] = useState(true);

    // Determine the other user's ID (assuming 1-on-1 chat for now)
    const otherUserId = chatInfo?.otherUserId; // Expecting this field from userChats index

    useEffect(() => {
        const fetchOtherUser = async () => {
            if (!otherUserId) {
                 setOtherUserInfo({ username: 'Unknown Chat', avatarUrl: null});
                 setLoading(false);
                 return;
            };
            setLoading(true);
            const profileRef = doc(db, 'profiles', otherUserId);
            try {
                const docSnap = await getDoc(profileRef);
                if (docSnap.exists()) {
                    setOtherUserInfo({
                        username: docSnap.data().username || `User ${otherUserId.substring(0, 4)}`,
                        avatarUrl: docSnap.data().avatarUrl
                    });
                } else {
                     setOtherUserInfo({ username: `User ${otherUserId.substring(0, 4)}`, avatarUrl: null});
                }
            } catch (error) {
                console.error("Error fetching other user profile:", error);
                 setOtherUserInfo({ username: 'Error loading', avatarUrl: null});
            } finally {
                setLoading(false);
            }
        };
        fetchOtherUser();
    }, [otherUserId]);

    // Format timestamp (basic example)
    const formatTimestamp = (timestamp) => {
         if (!timestamp) return '';
         const date = new Date(timestamp);
         // Very basic time formatting
         return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <motion.li
            onClick={onClick}
            className={`flex items-center px-3 py-3 rounded-lg cursor-pointer transition-colors duration-150 ${
                isSelected
                    ? 'bg-nova-blue-100'
                    : 'hover:bg-nova-gray-100'
            }`}
            whileHover={{ backgroundColor: isSelected ? '#E0EFFF' /* Slightly different blue */ : '#F1F5F9' }} // Use actual hex if needed
        >
             {/* Avatar */}
             <div className="flex-shrink-0 mr-3">
                 <div className={`w-10 h-10 rounded-full overflow-hidden bg-nova-gray-200 flex items-center justify-center ring-1 ${isSelected ? 'ring-nova-blue-300' : 'ring-transparent'}`}>
                    {otherUserInfo.avatarUrl ? (
                        <img src={otherUserInfo.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <FiUser className="w-5 h-5 text-nova-gray-400" />
                    )}
                </div>
             </div>

             {/* Info */}
             <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center">
                     <p className={`text-sm font-semibold truncate ${isSelected ? 'text-nova-blue-800' : 'text-nova-gray-800'}`}>
                         {loading ? 'Loading...' : otherUserInfo.username}
                     </p>
                     <p className={`text-xs flex-shrink-0 ml-2 ${isSelected ? 'text-nova-blue-600' : 'text-nova-gray-400'}`}>
                         {formatTimestamp(chatInfo?.lastMessageTimestamp)}
                     </p>
                 </div>
                 <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-nova-blue-700' : 'text-nova-gray-500'}`}>
                    {chatInfo?.lastMessageSnippet || 'No messages yet'} {/* Expecting these in userChats index */}
                 </p>
             </div>
        </motion.li>
    );
};

export default ChatListItem;