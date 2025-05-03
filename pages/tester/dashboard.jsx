// pages/tester/dashboard.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// --- Firebase ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
// --- Layout & Components ---
import TesterLayout from '../../components/TesterLayout'; // Use Tester Layout
import Button from '../../components/Button';
import { FiUser, FiCompass, FiActivity, FiAlertCircle } from 'react-icons/fi';

export default function TesterDashboard() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    // --- Auth & Profile Check ---
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
                        // Role check: Redirect if NOT a tester
                        if (profileData.role !== 'tester') {
                            console.warn("User is not a tester. Redirecting...");
                            router.replace('/developer/dashboard'); // Or generic home '/'
                            return;
                        }
                        setError(null);
                    } else {
                        setError("Profile data not found.");
                        // Might need profile completion step for testers too
                        await auth.signOut();
                        router.replace('/signin'); return;
                    }
                } catch (err) {
                    setError("Failed to load profile data.");
                    console.error("Profile fetch error:", err);
                }
            } else {
                setUser(null); setProfile(null);
                router.replace('/signin'); return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]);

    if (loadingUser) { /* ... loading ... */ }
    if (!user || !profile) return null; // Should be redirected

    if (error) { /* ... error display wrapped in TesterLayout ... */ }

    return (
        <TesterLayout>
            <Head><title>Dashboard - DevApps Tester</title></Head>

             {/* Header */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                 <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900 mb-1">Tester Dashboard</h1>
                    <p className="text-nova-gray-600 flex items-center text-sm">
                       <FiUser className="mr-1.5" /> Welcome, {profile.username || user.email}!
                    </p>
                 </div>
                  {/* Sign out is handled in layout now */}
            </div>

            {/* Quick Actions / Info Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-lg bg-white border border-nova-gray-200 shadow-sm text-center">
                    <FiCompass className="w-10 h-10 text-nova-blue-500 mx-auto mb-3"/>
                    <h2 className="text-lg font-semibold text-nova-gray-800 mb-2">Explore New Apps</h2>
                    <p className="text-sm text-nova-gray-500 mb-4">Discover the latest apps available for testing.</p>
                     <Button href="/apps/explore" variant="primary">Browse Apps</Button>
                </div>
                 <div className="p-6 rounded-lg bg-white border border-nova-gray-200 shadow-sm text-center">
                    <FiActivity className="w-10 h-10 text-nova-mint-500 mx-auto mb-3"/>
                    <h2 className="text-lg font-semibold text-nova-gray-800 mb-2">Your Activity</h2>
                    <p className="text-sm text-nova-gray-500 mb-4">See the apps you've provided feedback on.</p>
                     <Button href="/tester/my-feedback" variant="secondary">View My Feedback</Button>
                </div>
            </div>

             {/* Placeholder for potentially "Featured Apps" or "Newest Apps" list */}
            <div className="bg-white p-6 rounded-lg shadow border border-nova-gray-100">
                <h2 className="text-xl font-semibold text-nova-gray-800 mb-4">Recently Added Apps</h2>
                <p className="text-nova-gray-500"> (App list component coming soon!) </p>
            </div>

        </TesterLayout>
    );
}