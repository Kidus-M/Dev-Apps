// pages/tester/messages.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// --- Firebase ---
import { auth, db } from '../../utils/firebaseClient'; // Firestore for profile check
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
// --- Layout & Components ---
import TesterLayout from '../../components/TesterLayout'; // Use TesterLayout
import ChatListSidebar from '../../components/ChatListSidebar';
import { FiMessageSquare, FiLoader, FiAlertCircle } from 'react-icons/fi';
// Placeholder for the actual chat window component
// import ChatWindow from '../../components/ChatWindow';

export default function TesterMessagesPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const router = useRouter();

    // --- Auth Check & Role Verification ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const profileDocRef = doc(db, "profiles", currentUser.uid);
                try {
                    const profileSnap = await getDoc(profileDocRef);
                    if (profileSnap.exists()) {
                        const profileData = profileSnap.data();
                        setProfile(profileData);
                        if (profileData.role !== 'tester') {
                            console.warn("Messages: User is not a tester. Redirecting.");
                            router.replace(profileData.role === 'developer' ? '/developer/dashboard' : '/');
                            return;
                        }
                        setError(null);
                    } else {
                        setError("Profile not found. Please complete your profile.");
                        await auth.signOut();
                        router.replace('/signin');
                        return;
                    }
                } catch (err) {
                    console.error("Error fetching profile for messages:", err);
                    setError("Failed to verify user profile.");
                    await auth.signOut();
                    router.replace('/signin');
                    return;
                }
            } else {
                setUser(null);
                setProfile(null);
                router.replace('/signin');
                return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleSelectChat = (chatId) => {
        console.log("Tester Messages: Selected chat ID:", chatId);
        setSelectedChatId(chatId);
        // When ChatWindow is built, selecting a chat will cause it to load messages for that chatId
    };

    // --- Render Logic ---
    if (loadingUser) {
        return (
            <TesterLayout>
                <div className="flex justify-center items-center h-[calc(100vh-theme(space.20))]">
                    <FiLoader className="animate-spin text-nova-blue-500 text-3xl" />
                </div>
            </TesterLayout>
        );
    }

    if (error) {
        return (
            <TesterLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(space.20))] p-4">
                    <FiAlertCircle className="w-12 h-12 text-nova-error-500 mb-4" />
                    <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">Access Denied</h2>
                    <p className="text-nova-gray-600 text-center">{error}</p>
                    <button onClick={() => router.push('/')} className="mt-6 px-4 py-2 bg-nova-blue-500 text-white rounded hover:bg-nova-blue-600">
                        Go to Homepage
                    </button>
                </div>
            </TesterLayout>
        );
    }

    if (!user || !profile) return null; // Should be redirected by useEffect

    return (
        <TesterLayout>
            <Head><title>Messages - DevApps Tester</title></Head>

            {/* Main two-pane chat layout */}
            <div className="flex h-[calc(100vh-var(--header-height,theme(space.20)))]"> {/* Adjust calc based on actual TesterLayout header/padding */}

                {/* Chat List Sidebar */}
                <div className="w-full md:w-80 lg:w-96 h-full flex-shrink-0"> {/* Responsive width */}
                    <ChatListSidebar
                        onSelectChat={handleSelectChat}
                        currentUserId={user.uid}
                        selectedChatId={selectedChatId}
                    />
                </div>

                {/* Chat Window Area (Placeholder) */}
                <div className="flex-1 h-full bg-nova-gray-50 flex items-center justify-center border-l border-nova-gray-200">
                    {selectedChatId ? (
                        <div className="text-center">
                            {/* Replace with <ChatWindow chatId={selectedChatId} currentUser={user} /> when ready */}
                            <FiMessageSquare size={32} className="mx-auto mb-2 text-nova-gray-400"/>
                            <h2 className="text-lg font-medium text-nova-gray-700">
                                Chat: <span className="font-semibold text-nova-blue-600">{selectedChatId.substring(0,10)}...</span>
                            </h2>
                            <p className="text-nova-gray-500 text-sm">
                                Chat window component coming soon!
                            </p>
                        </div>
                    ) : (
                        <div className="text-center text-nova-gray-500">
                            <FiMessageSquare size={48} className="mx-auto mb-4 opacity-50"/>
                            <p>Select a conversation from the sidebar to start messaging.</p>
                            <p className="text-xs mt-1">Or, click the 'New Chat' icon to find someone.</p>
                        </div>
                     )}
                </div>
            </div>
        </TesterLayout>
    );
}