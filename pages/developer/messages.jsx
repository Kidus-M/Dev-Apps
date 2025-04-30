import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
// --- Firebase ---
import { auth, db } from "../../utils/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
// --- Layout & Components ---
import DeveloperLayout from "../../components/DeveloperLayout";
import ChatListSidebar from "../../components/ChatListSidebar"; // Import the sidebar
import { FiMessageSquare, FiAlertCircle, FiLoader } from "react-icons/fi";

export default function MessagesPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null); // State to hold selected chat
  const router = useRouter();

  // --- Auth Check ---
  useEffect(() => {
    setLoadingUser(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Role check is handled by DeveloperLayout, just ensure user exists
        setError(null);
      } else {
        setUser(null);
        router.replace("/signin");
        return;
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSelectChat = (chatId) => {
    console.log("Selected chat ID:", chatId);
    setSelectedChatId(chatId);
    // TODO: Fetch messages for this chatId in the ChatWindow component
  };

  // --- Render Logic ---
  if (loadingUser) {
    return (
      <DeveloperLayout>
        <div className="flex justify-center items-center h-full">
          <FiLoader className="animate-spin text-nova-blue-500 text-3xl" />
        </div>
      </DeveloperLayout>
    );
  }
  if (!user) return null; // Should be redirected

  return (
    <DeveloperLayout>
      <Head>
        <title>Messages - DevApps Developer</title>
      </Head>

      <div className="flex h-[calc(100vh-theme(space.20))]">
        {" "}
        {/* Adjust calc based on actual DeveloperLayout header/padding */}
        {/* Chat List Sidebar */}
        <div className="w-full md:w-1/4 lg:w-1/5 h-full flex-shrink-0">
          {" "}
          {/* Adjust width as needed */}
          <ChatListSidebar
            onSelectChat={handleSelectChat}
            currentUserId={user.uid}
            selectedChatId={selectedChatId}
          />
        </div>
        {/* Chat Window Area */}
        <div className="flex-1 h-full bg-nova-gray-50 flex items-center justify-center">
          {selectedChatId ? (
            <div>
              <h2 className="text-xl text-nova-gray-700">
                Chat Window for {selectedChatId}
              </h2>
              <p className="text-nova-gray-500">
                {" "}
                (TODO: Build ChatWindow Component){" "}
              </p>
              {/* TODO: <ChatWindow chatId={selectedChatId} currentUser={user} /> */}
            </div>
          ) : (
            <div className="text-center text-nova-gray-500">
              <FiMessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging.</p>
            </div>
          )}
        </div>
      </div>
      {/* Remove fixed height potentially conflicting with layout */}
      {
        <style jsx>{`
          .main-chat-area {
            height: calc(
              100vh - YYYpx
            ); /* Adjust YYY based on header/padding */
          }
        `}</style>
      }
    </DeveloperLayout>
  );
}
