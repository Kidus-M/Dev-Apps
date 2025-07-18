// components/NewChatModal.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiUserPlus, FiLoader, FiUser, FiAlertCircle } from 'react-icons/fi';
import Button from './Button';
// Firebase
import { db, rtdb } from '../utils/firebaseClient'; // For Firestore profiles & RTDB
import {
    collection, query, where, getDocs, limit, doc, getDoc, orderBy
} from 'firebase/firestore';
import {
    ref as rtdbRef, get as rtdbGet, update as rtdbUpdate, serverTimestamp as rtdbServerTimestamp
} from 'firebase/database';
import { useDebounce } from 'use-debounce';

const NewChatModal = ({ isOpen, onClose, currentUserId, onChatStarted }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 400);
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [isCreatingChat, setIsCreatingChat] = useState(false); // This state controls the loading for chat creation
    const [currentUserProfile, setCurrentUserProfile] = useState(null);

    // Fetch current user's profile once for denormalization
    useEffect(() => {
        if (!currentUserId || !isOpen) return;
        const fetchCurrentUserProfile = async () => {
            const profileRef = doc(db, "profiles", currentUserId);
            const docSnap = await getDoc(profileRef);
            if (docSnap.exists()) {
                setCurrentUserProfile({ uid: currentUserId, ...docSnap.data() });
            } else {
                console.error("Current user profile not found for chat creation.");
                setSearchError("Your profile data couldn't be loaded. Please try again.");
            }
        };
        fetchCurrentUserProfile();
    }, [currentUserId, isOpen]);


    // Search for users
    useEffect(() => {
        const performSearch = async () => {
            if (debouncedSearchTerm.trim().length < 2) {
                setSearchResults([]);
                setSearchError(null); // Clear error if search term is too short
                return;
            }
            if (!currentUserId) {
                setSearchError("Cannot search: Current user context is missing.");
                return;
            }

            setLoadingSearch(true);
            setSearchError(null);
            try {
                const searchTermVal = debouncedSearchTerm.trim();
                const profilesRef = collection(db, "profiles");
                const q = query(
                    profilesRef,
                    where('username', '>=', searchTermVal),
                    where('username', '<', searchTermVal + '\uf8ff'),
                    orderBy('username'),
                    limit(10)
                );
                const querySnapshot = await getDocs(q);
                const results = querySnapshot.docs
                    .map(docData => ({ uid: docData.id, ...docData.data() }))
                    .filter(profile => profile.uid !== currentUserId);

                setSearchResults(results);
                if (results.length === 0 && searchTermVal.length >= 2) { // Only show "no users found" if search was actually performed
                    setSearchError(`No users found starting with "${searchTermVal}".`);
                }
            } catch (err) {
                console.error("Error searching users:", err);
                if (err.code === 'failed-precondition' && err.message.includes('index')) {
                    setSearchError("Search requires a database index. Please contact support or check console.");
                } else {
                    setSearchError("Failed to search for users. Please try again.");
                }
            } finally {
                setLoadingSearch(false);
            }
        };

        if (isOpen && currentUserId) {
            performSearch();
        }
    }, [debouncedSearchTerm, currentUserId, isOpen]);

    const handleSelectUser = async (selectedUser) => {
        if (!currentUserId || !selectedUser?.uid || !currentUserProfile?.username) {
            setSearchError("Cannot start chat. Required user data is missing.");
            return;
        }
        if (isCreatingChat) return;

        setIsCreatingChat(true);
        setSearchError(null); // Clear previous search errors

        const otherUserId = selectedUser.uid;
        const chatTimestamp = rtdbServerTimestamp();

        const chatId = currentUserId < otherUserId
            ? `${currentUserId}_${otherUserId}`
            : `${otherUserId}_${currentUserId}`;

        const chatMetaRef = rtdbRef(rtdb, `chats/${chatId}/metadata`);

        try {
            const existingChatSnap = await rtdbGet(chatMetaRef);
            if (existingChatSnap.exists()) {
                onChatStarted(chatId);
                handleClose();
                return;
            }

            const chatMetadata = {
                isGroup: false,
                members: { [currentUserId]: true, [otherUserId]: true },
                createdAt: chatTimestamp,
                lastMessageTimestamp: chatTimestamp,
                lastMessageSnippet: "Chat created",
                lastMessageSenderUid: null, // No messages yet, so no sender for the "last message"
            };

            const currentUserChatEntry = {
                otherUserId: otherUserId,
                otherUserName: selectedUser.username || `User ${otherUserId.substring(0,4)}`,
                otherUserAvatar: selectedUser.avatarUrl || null,
                lastMessageTimestamp: chatTimestamp,
                lastMessageSnippet: "Chat created",
                lastMessageSenderUid: null,
            };

            const otherUserChatEntry = {
                otherUserId: currentUserId,
                otherUserName: currentUserProfile.username,
                otherUserAvatar: currentUserProfile.avatarUrl || null,
                lastMessageTimestamp: chatTimestamp,
                lastMessageSnippet: "Chat created",
                lastMessageSenderUid: null,
            };

            const updates = {};
            updates[`/chats/${chatId}/metadata`] = chatMetadata;
            updates[`/users/${currentUserId}/userChats/${chatId}`] = currentUserChatEntry;
            updates[`/users/${otherUserId}/userChats/${chatId}`] = otherUserChatEntry;

            await rtdbUpdate(rtdbRef(rtdb), updates);
            onChatStarted(chatId);
            handleClose();

        } catch (err) {
            console.error("Error creating or checking chat:", err);
            setSearchError(`Failed to start chat: ${err.message}`);
        } finally {
            setIsCreatingChat(false);
        }
    };

    const handleClose = () => {
        setSearchTerm('');
        setSearchResults([]);
        setSearchError(null);
        setLoadingSearch(false);
        setIsCreatingChat(false);
        onClose();
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };


    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    initial="hidden" animate="visible" exit="exit"
                    onClick={handleClose}
                >
                    <motion.div
                        variants={modalVariants}
                        className="bg-white dark:bg-nova-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={handleClose} className="absolute top-4 right-4 text-nova-gray-400 hover:text-nova-gray-600 dark:hover:text-nova-gray-200 transition-colors" title="Close">
                            <FiX size={22} />
                        </button>

                        <h2 className="text-xl font-semibold text-nova-gray-900 dark:text-white mb-5">Start a New Chat</h2>

                        <div className="relative mb-4">
                            <FiSearch className="absolute top-1/2 left-3.5 transform -translate-y-1/2 text-nova-gray-400 dark:text-nova-gray-500 pointer-events-none" size={18} />
                            <input
                                type="search"
                                placeholder="Search users by username..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-nova-gray-300 dark:border-nova-gray-600 rounded-lg focus:ring-2 focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150 bg-white dark:bg-nova-gray-700 text-nova-gray-900 dark:text-white placeholder-nova-gray-400 dark:placeholder-nova-gray-500"
                                autoFocus
                            />
                        </div>

                        <div className="min-h-[200px] max-h-[calc(60vh-150px)] sm:max-h-[300px] overflow-y-auto pr-1 space-y-1">
                            {loadingSearch && (
                                <div className="flex justify-center items-center py-8">
                                    <FiLoader className="animate-spin text-nova-blue-500 text-2xl" />
                                </div>
                            )}
                            {!loadingSearch && searchError && !isCreatingChat && (
                                <div className="p-3 text-center text-sm text-nova-error-600 dark:text-nova-error-400 bg-nova-error-50 dark:bg-nova-error-800/30 rounded-md flex items-center justify-center">
                                    <FiAlertCircle className="inline w-5 h-5 mr-2 flex-shrink-0"/> {searchError}
                                </div>
                            )}
                            {!loadingSearch && !searchError && debouncedSearchTerm.length >=2 && searchResults.length === 0 && (
                                <p className="text-sm text-nova-gray-500 dark:text-nova-gray-400 text-center py-8">No users found matching "{debouncedSearchTerm}".</p>
                            )}
                             {!loadingSearch && !searchError && debouncedSearchTerm.length < 2 && searchResults.length === 0 && (
                                <p className="text-sm text-nova-gray-500 dark:text-nova-gray-400 text-center py-8">Enter at least 2 characters to search users.</p>
                            )}

                            {!loadingSearch && !searchError && searchResults.length > 0 && (
                                <ul className="divide-y divide-nova-gray-100 dark:divide-nova-gray-700">
                                    {searchResults.map(profile => (
                                        <li key={profile.uid} className="py-3 flex items-center justify-between hover:bg-nova-gray-50 dark:hover:bg-nova-gray-700/60 px-2 -mx-2 rounded-md transition-colors">
                                            <div className="flex items-center min-w-0">
                                                <div className="w-9 h-9 rounded-full overflow-hidden bg-nova-gray-200 dark:bg-nova-gray-600 mr-3 flex-shrink-0">
                                                    {profile.avatarUrl ? (
                                                        <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FiUser className="w-full h-full p-2 text-nova-gray-400 dark:text-nova-gray-300" />
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-nova-gray-800 dark:text-nova-gray-100 truncate" title={profile.username}>
                                                    {profile.username}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleSelectUser(profile)}
                                                disabled={isCreatingChat} // Disable all chat buttons when one is being created
                                                // --- CORRECTED ---
                                                // The isLoading prop for the Button component should reflect the 'isCreatingChat' state.
                                                // If your Button component changes its appearance based on `isLoading` (e.g., shows a spinner),
                                                // this is how you'd use it. The `icon` prop will also change.
                                                isLoading={isCreatingChat}
                                                icon={isCreatingChat ? FiLoader : FiUserPlus}
                                                className="dark:bg-nova-gray-600 dark:hover:bg-nova-gray-500 dark:text-nova-gray-100 dark:border-nova-gray-500"
                                                // iconClassName prop is often used if the Button component doesn't handle the spinner logic itself
                                                // For example, if isLoading just disables and you need to animate the icon:
                                                // iconClassName={isCreatingChat ? "animate-spin" : ""}
                                            >
                                                {isCreatingChat ? 'Starting...' : 'Chat'}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {isCreatingChat && (
                            <p className="text-xs text-center text-nova-blue-600 dark:text-nova-blue-400 mt-3 flex items-center justify-center">
                                <FiLoader className="animate-spin w-3 h-3 mr-1.5"/> Starting chat...
                            </p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NewChatModal;