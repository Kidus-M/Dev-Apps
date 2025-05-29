// components/ChatMessage.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseClient'; // Adjust path if needed
import { format, isToday, isYesterday, parseISO } from 'date-fns'; // For formatting timestamps

const ChatMessage = ({ message, currentUserId }) => {
    const [senderInfo, setSenderInfo] = useState({ username: 'User', avatarUrl: null });
    const isCurrentUser = message.senderUid === currentUserId;

    useEffect(() => {
        const fetchSenderInfo = async () => {
            if (!message.senderUid) return;
            const profileRef = doc(db, 'profiles', message.senderUid);
            try {
                const docSnap = await getDoc(profileRef);
                if (docSnap.exists()) {
                    setSenderInfo({
                        username: docSnap.data().username || `User ${message.senderUid.substring(0, 4)}`,
                        avatarUrl: docSnap.data().avatarUrl,
                    });
                } else {
                    setSenderInfo({ username: `User ${message.senderUid.substring(0, 4)}`, avatarUrl: null });
                }
            } catch (error) {
                console.error("Error fetching sender profile:", error);
                setSenderInfo({ username: 'User', avatarUrl: null });
            }
        };
        fetchSenderInfo();
    }, [message.senderUid]);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (isToday(date)) {
            return format(date, 'p'); // e.g., 2:30 PM
        }
        if (isYesterday(date)) {
            return `Yesterday ${format(date, 'p')}`; // e.g., Yesterday 2:30 PM
        }
        return format(date, 'MMM d, p'); // e.g., May 29, 2:30 PM
    };

    const messageVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
    };

    return (
        <motion.div
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            className={`flex items-end gap-2.5 my-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
        >
            {!isCurrentUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-nova-gray-200">
                    {senderInfo.avatarUrl ? (
                        <img src={senderInfo.avatarUrl} alt={senderInfo.username} className="w-full h-full object-cover" />
                    ) : (
                        <FiUser className="w-full h-full p-1.5 text-nova-gray-400" />
                    )}
                </div>
            )}
            <div
                className={`flex flex-col w-full max-w-[70%] md:max-w-[60%] leading-1.5 p-3 border-nova-gray-200 ${
                    isCurrentUser
                        ? 'rounded-s-xl rounded-se-xl bg-nova-blue-500 text-white'
                        : 'rounded-e-xl rounded-es-xl bg-white dark:bg-nova-gray-700'
                }`}
            >
                {!isCurrentUser && (
                    <p className={`text-xs font-semibold mb-1 ${isCurrentUser ? 'text-nova-blue-100' : 'text-nova-gray-900 dark:text-white'}`}>
                        {senderInfo.username}
                    </p>
                )}
                <p className={`text-sm font-normal ${isCurrentUser ? 'text-white' : 'text-nova-gray-900 dark:text-white'}`}>
                    {message.text}
                </p>
                <span className={`text-xs mt-1.5 ${isCurrentUser ? 'text-nova-blue-100 opacity-80 self-end' : 'text-nova-gray-500 dark:text-nova-gray-400 self-start'}`}>
                    {formatTimestamp(message.timestamp)}
                </span>
            </div>
            {isCurrentUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-nova-gray-200">
                    {senderInfo.avatarUrl ? (
                        <img src={senderInfo.avatarUrl} alt={senderInfo.username} className="w-full h-full object-cover" />
                    ) : (
                        <FiUser className="w-full h-full p-1.5 text-nova-gray-400" />
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default ChatMessage;