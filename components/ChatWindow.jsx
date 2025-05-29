// components/ChatWindow.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLoader, FiInfo, FiUser } from 'react-icons/fi';
// --- Firebase ---
import { rtdb, db } from '../utils/firebaseClient'; // db for Firestore profiles
import { ref, query, orderByChild, limitToLast, onChildAdded, off, get } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore'; // For fetching other user's profile
// --- Components ---
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';

const MESSAGES_TO_LOAD = 25; // Number of messages to load initially/more

const ChatWindow = ({ chatId, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [chatMetadata, setChatMetadata] = useState(null); // For chat name, other participants
    const [otherParticipantInfo, setOtherParticipantInfo] = useState(null); // For 1-on-1 chat header
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null); // To scroll to bottom

    // Scroll to bottom when new messages arrive or chat changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch Chat Metadata and Initial Messages
    useEffect(() => {
        if (!chatId || !currentUser) return;

        setLoadingMessages(true);
        setMessages([]); // Clear previous messages
        setError(null);
        setChatMetadata(null);
        setOtherParticipantInfo(null);

        // 1. Fetch Chat Metadata
        const metaRef = ref(rtdb, `chats/${chatId}/metadata`);
        get(metaRef).then(async (snapshot) => {
            if (snapshot.exists()) {
                const meta = snapshot.val();
                setChatMetadata(meta);

                // If 1-on-1 chat, determine other user and fetch their profile for header
                if (!meta.isGroup && meta.members) {
                    const memberIds = Object.keys(meta.members);
                    const otherUserId = memberIds.find(id => id !== currentUser.uid);
                    if (otherUserId) {
                        const profileRef = doc(db, 'profiles', otherUserId);
                        const profileSnap = await getDoc(profileRef);
                        if (profileSnap.exists()) {
                            setOtherParticipantInfo({
                                uid: otherUserId,
                                username: profileSnap.data().username || `User ${otherUserId.substring(0,4)}`,
                                avatarUrl: profileSnap.data().avatarUrl
                            });
                        } else {
                            setOtherParticipantInfo({ uid: otherUserId, username: `User ${otherUserId.substring(0,4)}`, avatarUrl: null });
                        }
                    }
                }
            } else {
                setError("Chat not found or metadata missing.");
            }
        }).catch(err => {
            console.error("Error fetching chat metadata:", err);
            setError("Could not load chat details.");
        });


        // 2. Listen for new messages & load initial batch
        const messagesQuery = query(
            ref(rtdb, `chats/${chatId}/messages`),
            orderByChild('timestamp'), // Ensure messages are ordered by timestamp
            limitToLast(MESSAGES_TO_LOAD) // Load last N messages
        );

        const handleNewMessage = (snapshot) => {
            const newMessage = { id: snapshot.key, ...snapshot.val() };
            setMessages((prevMessages) => {
                 // Prevent duplicates if re-listening or on initial load
                if (prevMessages.find(msg => msg.id === newMessage.id)) {
                    return prevMessages;
                }
                // Sort messages by timestamp on client side just in case RTDB limitToLast doesn't perfectly guarantee order initially
                // for the first batch. Subsequent onChildAdded should be in order.
                const updatedMessages = [...prevMessages, newMessage];
                updatedMessages.sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0));
                return updatedMessages;
            });
            setLoadingMessages(false); // Stop loading once first message(s) arrive
        };

        const listener = onChildAdded(messagesQuery, handleNewMessage, (err) => {
            console.error("Error listening for messages:", err);
            setError("Failed to load messages.");
            setLoadingMessages(false);
        });

        // Check if there are any messages after a short delay, if not, stop loading.
        // This handles empty chats.
        const timer = setTimeout(() => {
            if (messages.length === 0) {
                setLoadingMessages(false);
            }
        }, 3000);


        return () => {
            console.log("Detaching message listener for chat:", chatId);
            off(messagesQuery, 'child_added', listener);
            clearTimeout(timer);
        };
    }, [chatId, currentUser]); // Rerun if chatId or user changes

    // TODO: Implement 'Load More Messages' functionality (older messages)

    const chatHeaderName = chatMetadata?.isGroup
        ? chatMetadata.groupName
        : otherParticipantInfo?.username || 'Chat';

    const otherUserIdsForInput = chatMetadata?.members ? Object.keys(chatMetadata.members).filter(id => id !== currentUser.uid) : [];


    if (error) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center p-4 text-center text-nova-error-600">
                <FiAlertCircle size={32} className="mb-2" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-nova-gray-50 dark:bg-nova-gray-900">
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-nova-gray-200 dark:border-nova-gray-700 bg-white dark:bg-nova-gray-800 flex items-center space-x-3 flex-shrink-0">
                {otherParticipantInfo?.avatarUrl ? (
                    <img src={otherParticipantInfo.avatarUrl} alt={chatHeaderName} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
                ) : !chatMetadata?.isGroup && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-nova-gray-300 flex items-center justify-center">
                        <FiUser className="w-4/5 h-4/5 text-nova-gray-500 p-1" />
                    </div>
                )}
                 {chatMetadata?.isGroup && ( /* Placeholder for group icon */
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-nova-purple-500 flex items-center justify-center text-white">
                        <FiUsers className="w-4/5 h-4/5 p-1" /> {/* Assuming FiUsers exists */}
                    </div>
                 )}
                <h2 className="text-md sm:text-lg font-semibold text-nova-gray-900 dark:text-white truncate">
                    {chatHeaderName}
                </h2>
                {/* Placeholder for online status or more actions */}
                {/* <FiInfo size={18} className="text-nova-gray-400 hover:text-nova-blue-500 cursor-pointer ml-auto" /> */}
            </div>

            {/* Messages Area */}
            <div className="flex-grow p-3 sm:p-4 space-y-2 overflow-y-auto">
                {loadingMessages && messages.length === 0 && (
                     <div className="flex justify-center items-center h-full">
                         <FiLoader className="animate-spin text-nova-blue-500 text-2xl" />
                     </div>
                 )}
                {!loadingMessages && messages.length === 0 && !error && (
                    <div className="flex justify-center items-center h-full text-nova-gray-500 dark:text-nova-gray-400 text-sm">
                        No messages yet. Start the conversation!
                    </div>
                )}

                <AnimatePresence>
                    {messages.map(msg => (
                        <ChatMessage key={msg.id} message={msg} currentUserId={currentUser.uid} />
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} /> {/* Anchor to scroll to */}
            </div>

            {/* Message Input Area */}
            {chatId && currentUser && (
                 <MessageInput chatId={chatId} currentUserId={currentUser.uid} otherUserIds={otherUserIdsForInput} />
             )}
        </div>
    );
};

export default ChatWindow;