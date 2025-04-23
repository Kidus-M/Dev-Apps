// pages/developer/dashboard.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout'; // Import the layout
import { FiLogOut, FiUser, FiBarChart2, FiPlusSquare, FiEdit } from 'react-icons/fi'; // Added icons

export default function DeveloperDashboard() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // --- Authentication & Profile Fetching Logic (Same as before) ---
        setError(null);
        setLoading(true);
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
                            router.replace('/tester/dashboard'); // Redirect non-devs
                            return;
                        }
                    } else {
                        setError("Profile data not found.");
                        await signOut(auth);
                        router.replace('/signin');
                        return;
                    }
                } catch (profileError) {
                    console.error("Error fetching developer profile:", profileError);
                    setError("Failed to load profile data.");
                }
            } else {
                setUser(null); setProfile(null);
                router.replace('/signin');
                return;
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleSignOut = async () => {
        // --- Sign Out Logic (Same as before) ---
        setLoading(true);
        try {
            await signOut(auth);
            router.push('/signin');
        } catch (err) {
            console.error("Sign out error:", err);
            setError("Failed to sign out.");
            setLoading(false);
        }
    };

    // Display Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-nova-gray-100">
                <p className="text-nova-gray-600">Loading Developer Dashboard...</p>
                 {/* Add spinner here */}
            </div>
        );
    }

     if (!user || !profile) return null; // Should be redirected if null

     // Display Error State
    if (error) {
       return (
          <DeveloperLayout>
            <div className="p-6 bg-white rounded-lg shadow border border-red-200 text-center">
                 <p className="text-lg text-nova-error-700 mb-4">{error}</p>
                 <Button onClick={() => router.push('/signin')} variant="secondary">Go to Sign In</Button>
            </div>
          </DeveloperLayout>
       )
    }

    // --- Display Dashboard Content within the Layout ---
    return (
        <DeveloperLayout> {/* Wrap content in the layout */}
            <Head><title>Dashboard - DevApps Developer</title></Head>

            {/* Header within the main content area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                 <div>
                    {/* Use profile.username if available, fallback to email */}
                    <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900 mb-1">
                        Welcome, {profile.username || user.email}!
                    </h1>
                    <p className="text-nova-gray-600 flex items-center text-sm">
                       <FiUser className="mr-1.5" /> Developer Account Overview
                    </p>
                 </div>
                 <Button onClick={handleSignOut} variant="secondary" icon={FiLogOut} className="mt-4 sm:mt-0 text-sm !px-4 !py-2"> {/* Smaller sign out button */}
                     Sign Out
                 </Button>
            </div>

            {/* --- Overview / Quick Stats Section --- */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Placeholder Stat Cards - Replace with real data later */}
                <div className="p-4 rounded-lg bg-white border border-nova-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-nova-gray-500 mb-1">Apps Uploaded</h3>
                    <p className="text-2xl font-bold text-nova-blue-600">0</p>
                </div>
                 <div className="p-4 rounded-lg bg-white border border-nova-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-nova-gray-500 mb-1">Total Feedback</h3>
                    <p className="text-2xl font-bold text-nova-blue-600">0</p>
                </div>
                 <div className="p-4 rounded-lg bg-white border border-nova-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-nova-gray-500 mb-1">Followers</h3>
                    <p className="text-2xl font-bold text-nova-blue-600">0</p>
                </div>
            </div>

            {/* --- Quick Actions Section --- */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-nova-gray-800 mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                     <Button href="/developer/upload-app" variant="primary" icon={FiPlusSquare}>
                        Upload New App
                     </Button>
                     <Button href="/developer/new-post" variant="secondary" icon={FiEdit}>
                         Write New Blog Post
                     </Button>
                      <Button href="/developer/my-apps" variant="secondary">
                         Manage My Apps
                     </Button>
                </div>
            </div>

             {/* --- Placeholder for Recent Activity or Other Widgets --- */}
            <div className="bg-white p-6 rounded-lg shadow border border-nova-gray-100">
                <h2 className="text-xl font-semibold text-nova-gray-800 mb-4 flex items-center">
                   <FiBarChart2 className="mr-3 text-nova-mint-600" /> Recent Activity
                </h2>
                <p className="text-nova-gray-500">
                    Recent feedback, followers, or app updates will show here. (Coming Soon!)
                </p>
            </div>

        </DeveloperLayout>
    );
}