// pages/developer/messages.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// --- Firebase ---
import { auth, db } from '../../utils/firebaseClient'; // Firestore for profile check
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
// --- Layout & Components ---
import DeveloperLayout from '../../components/DeveloperLayout';
import ChatListSidebar from '../../components/ChatListSidebar';
import ChatWindow from '../../components/ChatWindow'; // Import the ChatWindow
import { FiMessageSquare, FiLoader, FiAlertCircle } from 'react-icons/fi';

export default function DeveloperMessagesPage() {
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
                        if (profileData.role !== 'developer') {
                            console.warn("Developer Messages: User is not a developer. Redirecting.");
                            router.replace(profileData.role === 'tester' ? '/tester/dashboard' : '/');
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
                    console.error("Error fetching profile for developer messages:", err);
                    setError("Failed to verify user profile.");
                    await auth.signOut(); // Sign out on critical profile error
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
        console.log("Developer Messages: Selected chat ID:", chatId);
        setSelectedChatId(chatId);
    };

    // --- Render Logic ---
    if (loadingUser) {
        return (
            <DeveloperLayout>
                <div className="flex justify-center items-center h-[calc(100vh-theme(space.20))]"> {/* Adjust calc for your header height */}
                    <FiLoader className="animate-spin text-nova-blue-500 text-3xl" />
                </div>
            </DeveloperLayout>
        );
    }

    if (error) {
        return (
            <DeveloperLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(space.20))] p-4">
                    <FiAlertCircle className="w-12 h-12 text-nova-error-500 mb-4" />
                    <h2 className="text-xl font-semibold text-nova-gray-700 mb-2">Access Denied</h2>
                    <p className="text-nova-gray-600 text-center">{error}</p>
                    <button onClick={() => router.push('/')} className="mt-6 px-4 py-2 bg-nova-blue-500 text-white rounded hover:bg-nova-blue-600">
                        Go to Homepage
                    </button>
                </div>
            </DeveloperLayout>
        );
    }

    if (!user || !profile) return null; // Should have been redirected by useEffect

    return (
        <DeveloperLayout>
            <Head><title>Messages - DevApps Developer</title></Head>

            <div className="flex h-[calc(100vh-var(--header-height,theme(space.20)))]"> {/* Adjust calc based on actual DeveloperLayout header/padding */}

                {/* Chat List Sidebar */}
                <div className="w-full md:w-80 lg:w-96 h-full flex-shrink-0"> {/* Responsive width */}
                    <ChatListSidebar
                        onSelectChat={handleSelectChat}
                        currentUserId={user.uid}
                        selectedChatId={selectedChatId}
                    />
                </div>

                {/* Chat Window Area */}
                <div className="flex-1 h-full border-l border-nova-gray-200 dark:border-nova-gray-700 overflow-hidden">
                    {selectedChatId && user ? (
                         <ChatWindow chatId={selectedChatId} currentUser={user} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-nova-gray-500 dark:text-nova-gray-400 p-4">
                            <FiMessageSquare size={48} className="mx-auto mb-4 opacity-40"/>
                            <p className="text-md">Select a conversation to start messaging.</p>
                            <p className="text-xs mt-1">Or, click the 'New Chat' icon in the sidebar.</p>
                        </div>
                     )}
                </div>
            </div>
        </DeveloperLayout>
    );
}