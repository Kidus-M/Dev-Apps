// components/ChatListSidebar.jsx
import { useEffect, useState } from "react"; // Added useState for modal
import { FiEdit, FiLoader } from "react-icons/fi";
import { motion } from "framer-motion";
// --- Firebase Imports ---
import { auth, rtdb } from "../utils/firebaseClient";
import { ref, onValue, off, query, orderByChild } from "firebase/database";
// --- Components ---
import ChatListItem from "./ChatListItem";
import Button from "./Button";
import NewChatModal from "./NewChatModal"; // <-- Import the modal

const ChatListSidebar = ({ onSelectChat, currentUserId, selectedChatId }) => {
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false); // <-- State for modal

  useEffect(() => {
    if (!currentUserId) {
      setChats([]); // Clear chats if no user
      setLoadingChats(false);
      return;
    }

    setLoadingChats(true);
    setError(null);
    console.log("Setting up RTDB listener for userChats:", currentUserId);

    const userChatsRef = query(
      ref(rtdb, `users/${currentUserId}/userChats`),
      orderByChild("lastMessageTimestamp")
    );

    const listener = onValue(
      userChatsRef,
      (snapshot) => {
        console.log("RTDB userChats snapshot received");
        const chatListData = snapshot.val();
        if (chatListData) {
          const chatArray = Object.entries(chatListData)
            .map(([chatId, chatData]) => ({ id: chatId, ...chatData }))
            .sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
          setChats(chatArray);
          console.log("Processed chat list:", chatArray);
        } else {
          setChats([]);
          console.log("No chats found for user.");
        }
        setLoadingChats(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching chat list:", err);
        setError("Failed to load chat list.");
        setLoadingChats(false);
      }
    );

    return () => {
      console.log("Detaching RTDB listener for userChats:", currentUserId);
      off(userChatsRef, "value", listener);
    };
  }, [currentUserId]);

  const handleStartNewChat = () => {
    setIsNewChatModalOpen(true); // <-- Open the modal
  };

  const handleChatStarted = (chatId) => {
    setIsNewChatModalOpen(false); // Close modal
    onSelectChat(chatId);      // Select the new/existing chat
  };

  return (
    <> {/* Use Fragment to wrap sidebar and modal */}
      <div className="h-full w-full bg-white dark:bg-nova-gray-900 border-r border-nova-gray-200 dark:border-nova-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-nova-gray-200 dark:border-nova-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-nova-gray-800 dark:text-white">Messages</h2>
          <Button
            onClick={handleStartNewChat}
            variant="secondary"
            className="!p-2 !rounded-md dark:bg-nova-gray-700 dark:hover:bg-nova-gray-600 dark:text-nova-gray-200"
            title="Start new chat"
          >
            <FiEdit className="w-4 h-4" />
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-grow overflow-y-auto">
          {loadingChats && (
            <div className="p-6 text-center text-nova-gray-500 dark:text-nova-gray-400 flex items-center justify-center">
              <FiLoader className="animate-spin w-5 h-5 mr-2" /> Loading Chats...
            </div>
          )}
          {!loadingChats && error && (
            <div className="p-4 text-center text-nova-error-600 dark:text-nova-error-400">{error}</div>
          )}
          {!loadingChats && !error && chats.length === 0 && (
            <div className="p-6 text-center text-nova-gray-500 dark:text-nova-gray-400 text-sm">
              No conversations yet. Start a new chat!
            </div>
          )}
          {!loadingChats && !error && chats.length > 0 && (
            <ul className="p-2 space-y-1">
              {chats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chatInfo={chat}
                  currentUserId={currentUserId}
                  onClick={() => onSelectChat(chat.id)}
                  isSelected={selectedChatId === chat.id}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        currentUserId={currentUserId}
        onChatStarted={handleChatStarted}
      />
    </>
  );
};

export default ChatListSidebar;