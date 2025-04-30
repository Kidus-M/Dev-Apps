import { useEffect, useState } from "react";
import { FiEdit, FiLoader } from "react-icons/fi";
import { motion } from "framer-motion";
// --- Firebase Imports ---
import { auth, rtdb } from "../utils/firebaseClient"; // Use rtdb
import { ref, onValue, off, query, orderByChild } from "firebase/database";
// --- Components ---
import ChatListItem from "./ChatListItem";
import Button from "./Button";

const ChatListSidebar = ({ onSelectChat, currentUserId, selectedChatId }) => {
  const [chats, setChats] = useState([]); // Array of chat info objects
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUserId) return;

    setLoadingChats(true);
    setError(null);
    console.log("Setting up RTDB listener for userChats:", currentUserId);

    // Reference to the current user's chat index, order by last message timestamp
    const userChatsRef = query(
      ref(rtdb, `users/${currentUserId}/userChats`),
      orderByChild("lastMessageTimestamp") // Order descending (newest first) - RTDB sorts numerically ascending
    );

    // Listen for changes in the user's chat list
    const listener = onValue(
      userChatsRef,
      (snapshot) => {
        console.log("RTDB userChats snapshot received");
        const chatListData = snapshot.val();
        if (chatListData) {
          // Convert the object into an array and sort descending manually
          const chatArray = Object.entries(chatListData)
            .map(([chatId, chatData]) => ({ id: chatId, ...chatData }))
            // Sort descending by timestamp (newest first)
            .sort(
              (a, b) =>
                (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)
            );
          setChats(chatArray);
          console.log("Processed chat list:", chatArray);
        } else {
          setChats([]); // No chats found
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

    // Cleanup listener on unmount
    return () => {
      console.log("Detaching RTDB listener for userChats:", currentUserId);
      off(userChatsRef, "value", listener); // Detach the specific listener
    };
  }, [currentUserId]); // Rerun when user ID changes

  const handleStartNewChat = () => {
    // TODO: Implement logic to open a modal or navigate to search users to start chat
    console.log("Start new chat clicked");
    alert("Feature to start new chat not implemented yet.");
  };

  return (
    <div className="h-full w-full bg-white border-r border-nova-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-nova-gray-200 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-semibold text-nova-gray-800">Messages</h2>
        <Button
          onClick={handleStartNewChat}
          variant="secondary"
          className="!p-2 !rounded-md" // Smaller, square button
          title="Start new chat"
        >
          <FiEdit className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-grow overflow-y-auto">
        {loadingChats && (
          <div className="p-6 text-center text-nova-gray-500 flex items-center justify-center">
            <FiLoader className="animate-spin w-5 h-5 mr-2" /> Loading Chats...
          </div>
        )}
        {!loadingChats && error && (
          <div className="p-4 text-center text-nova-error-600">{error}</div>
        )}
        {!loadingChats && !error && chats.length === 0 && (
          <div className="p-6 text-center text-nova-gray-500 text-sm">
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
  );
};

export default ChatListSidebar;
