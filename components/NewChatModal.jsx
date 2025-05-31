// components/NewChatModal.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiUserPlus, FiLoader, FiUser, FiAlertCircle } from 'react-icons/fi';
import Button from './Button';
// Firebase
import { db, rtdb, auth } from '../utils/firebaseClient'; // For Firestore profiles & RTDB
import {
    collection, query, where, getDocs, limit, doc, getDoc,
    // For RTDB chat creation
    ref as rtdbRef, get as rtdbGet, update as rtdbUpdate, serverTimestamp
} from 'firebase/firestore'; // getDoc and doc for Firestore
import { useDebounce } from 'use-debounce';

const NewChatModal = ({ isOpen, onClose, currentUserId, onChatStarted }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 400);
    const [searchResults, setSearchResults] = useState([]); // Profiles from Firestore
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
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
                // Handle error, perhaps disable chat creation
            }
        };
        fetchCurrentUserProfile();
    }, [currentUserId, isOpen]);


    // Search for users
    useEffect(() => {
        const performSearch = async () => {
            if (debouncedSearchTerm.trim().length < 2) {
                setSearchResults([]);
                setSearchError(null);
                return;
            }
            if (!currentUserId) { // Ensure current user is identified
                setSearchError("Cannot search without current user context.");
                return;
            }

            setLoadingSearch(true);
            setSearchError(null);
            try {
                const lowerCaseTerm = debouncedSearchTerm.toLowerCase();
                const profilesRef = collection(db, "profiles");
                const q = query(
                    profilesRef,
                    where('username_lowercase', '>=', lowerCaseTerm),
                    where('username_lowercase', '<', lowerCaseTerm + '\uf8ff'),
                    limit(10)
                );
                const querySnapshot = await getDocs(q);
                const results = querySnapshot.docs
                    .map(doc => ({ uid: doc.id, ...doc.data() }))
                    .filter(profile => profile.uid !== currentUserId); // Exclude self

                setSearchResults(results);
            } catch (err) {
                console.error("Error searching users:", err);
                setSearchError("Failed to search for users.");
            } finally {
                setLoadingSearch(false);
            }
        };

        if (isOpen) { // Only search if modal is open
            performSearch();
        }
    }, [debouncedSearchTerm, currentUserId, isOpen]);

    const handleSelectUser = async (selectedUser) => {
        if (!currentUserId || !selectedUser?.uid || !currentUserProfile?.username) {
            setSearchError("Cannot start chat. User data missing.");
            return;
        }
        if (isCreatingChat) return;

        setIsCreatingChat(true);
        setSearchError(null);

        const otherUserId = selectedUser.uid;

        // Create a consistent 1-on-1 chatId (sorted UIDs)
        const chatId = currentUserId < otherUserId
            ? `${currentUserId}_${otherUserId}`
            : `${otherUserId}_${currentUserId}`;

        const chatMetaRef = rtdbRef(rtdb, `chats/${chatId}/metadata`);

        try {
            // 1. Check if chat already exists
            const existingChatSnap = await rtdbGet(chatMetaRef);
            if (existingChatSnap.exists()) {
                console.log("Chat already exists:", chatId);
                onChatStarted(chatId); // Pass existing chat ID
                handleClose();
                return;
            }

            // 2. Create new chat if it doesn't exist
            console.log("Creating new chat:", chatId);
            const timestamp = serverTimestamp(); // Firestore server timestamp (use for RTDB via placeholder)
                                               // For RTDB direct: import { serverTimestamp as rtdbServerTimestamp } from 'firebase/database';

            const chatMetadata = {
                isGroup: false,
                members: {
                    [currentUserId]: true,
                    [otherUserId]: true,
                },
                createdAt: Date.now(), // Use client time for creation, or RTDB server time
                lastMessageTimestamp: Date.now(), // Initial timestamp
                lastMessageSnippet: "Chat created",
                lastMessageSenderUid: null, // No messages yet
            };

            const currentUserChatEntry = {
                otherUserId: otherUserId,
                otherUserName: selectedUser.username || `User ${otherUserId.substring(0,4)}`,
                otherUserAvatar: selectedUser.avatarUrl || null,
                lastMessageTimestamp: Date.now(),
                lastMessageSnippet: "Chat created",
            };

            const otherUserChatEntry = {
                otherUserId: currentUserId,
                otherUserName: currentUserProfile.username, // Use fetched current user profile
                otherUserAvatar: currentUserProfile.avatarUrl || null,
                lastMessageTimestamp: Date.now(),
                lastMessageSnippet: "Chat created",
            };

            // Multi-path update for atomicity
            const updates = {};
            updates[`/chats/${chatId}/metadata`] = chatMetadata;
            updates[`/users/${currentUserId}/userChats/${chatId}`] = currentUserChatEntry;
            updates[`/users/${otherUserId}/userChats/${chatId}`] = otherUserChatEntry;

            await rtdbUpdate(rtdbRef(rtdb), updates);
            console.log("New chat created successfully in RTDB.");
            onChatStarted(chatId); // Pass new chat ID
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
                    onClick={handleClose} // Close on overlay click
                >
                    <motion.div
                        variants={modalVariants}
                        className="bg-white dark:bg-nova-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative"
                        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
                    >
                        <button onClick={handleClose} className="absolute top-3 right-3 text-nova-gray-400 hover:text-nova-gray-600 dark:hover:text-nova-gray-200 transition-colors" title="Close">
                            <FiX size={20} />
                        </button>

                        <h2 className="text-xl font-semibold text-nova-gray-900 dark:text-white mb-4">Start a New Chat</h2>

                        {/* Search Input */}
                        <div className="relative mb-4">
                            <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400 pointer-events-none" size={18} />
                            <input
                                type="search"
                                placeholder="Search users by username..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-nova-gray-300 dark:border-nova-gray-600 rounded-lg focus:ring-2 focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150 bg-white dark:bg-nova-gray-700 text-nova-gray-900 dark:text-white"
                                autoFocus
                            />
                        </div>

                        {/* Search Results or Loading/Error */}
                        <div className="min-h-[200px] max-h-[300px] overflow-y-auto pr-1 space-y-2">
                            {loadingSearch && (
                                <div className="flex justify-center items-center py-8">
                                    <FiLoader className="animate-spin text-nova-blue-500 text-2xl" />
                                </div>
                            )}
                            {!loadingSearch && searchError && (
                                <div className="p-4 text-center text-sm text-nova-error-600 bg-nova-error-50 rounded-md">
                                    <FiAlertCircle className="inline w-5 h-5 mr-1 mb-0.5"/> {searchError}
                                </div>
                            )}
                            {!loadingSearch && !searchError && debouncedSearchTerm.length >=2 && searchResults.length === 0 && (
                                <p className="text-sm text-nova-gray-500 dark:text-nova-gray-400 text-center py-8">No users found matching "{debouncedSearchTerm}".</p>
                            )}
                             {!loadingSearch && !searchError && debouncedSearchTerm.length < 2 && (
                                <p className="text-sm text-nova-gray-500 dark:text-nova-gray-400 text-center py-8">Enter at least 2 characters to search.</p>
                            )}

                            {!loadingSearch && !searchError && searchResults.length > 0 && (
                                <ul className="divide-y divide-nova-gray-200 dark:divide-nova-gray-700">
                                    {searchResults.map(profile => (
                                        <li key={profile.uid} className="py-3 flex items-center justify-between hover:bg-nova-gray-50 dark:hover:bg-nova-gray-700/50 px-2 -mx-2 rounded-md transition-colors">
                                            <div className="flex items-center min-w-0">
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-nova-gray-200 mr-3 flex-shrink-0">
                                                    {profile.avatarUrl ? (
                                                        <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FiUser className="w-full h-full p-1.5 text-nova-gray-400" />
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
                                                disabled={isCreatingChat}
                                                icon={isCreatingChat ? FiLoader : FiUserPlus}
                                                iconClassName={isCreatingChat ? "animate-spin" : ""}
                                            >
                                                {isCreatingChat ? 'Starting...' : 'Chat'}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {isCreatingChat && <p className="text-xs text-center text-nova-blue-600 mt-3">Creating chat, please wait...</p>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NewChatModal;