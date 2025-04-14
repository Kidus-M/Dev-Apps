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
import { FiLogOut, FiUser } from 'react-icons/fi';
// import { FiLoader } from 'react-icons/fi'; // Optional spinner

export default function DeveloperDashboard() {
  const [user, setUser] = useState(null); // Firebase Auth user object
  const [profile, setProfile] = useState(null); // Firestore profile data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Store potential errors
  const router = useRouter();

  useEffect(() => {
    setError(null); // Clear errors on mount/rerender
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is signed in, fetch profile
        setUser(currentUser);
        const profileDocRef = doc(db, "profiles", currentUser.uid);
        try {
          const profileSnap = await getDoc(profileDocRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            setProfile(profileData);
            // --- Role Check ---
            if (profileData.role !== 'developer') {
              console.warn("Role mismatch: User is not a developer. Redirecting...");
              // Redirect to tester dashboard or a generic dashboard/error page
              router.replace('/tester/dashboard'); // Or '/unauthorized' or '/'
              return; // Stop further processing
            }
            console.log("Developer profile loaded:", profileData);
          } else {
            // Profile doesn't exist - should ideally not happen if signup worked
            console.error("Developer profile not found in Firestore for UID:", currentUser.uid);
            setError("Profile data not found. Please try signing in again or contact support.");
            await signOut(auth); // Sign out inconsistent user
            router.replace('/signin');
            return;
          }
        } catch (profileError) {
          console.error("Error fetching developer profile:", profileError);
          setError("Failed to load profile data.");
          // Optionally sign out on profile fetch error
          // await signOut(auth);
          // router.replace('/signin');
          // return;
        }
      } else {
        // User is signed out
        setUser(null);
        setProfile(null);
        console.log("No user found, redirecting to signin from developer dashboard.");
        router.replace('/signin'); // Redirect if not logged in
        return; // Stop further processing
      }
      setLoading(false); // Loading finished
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]); // Dependency: router

  const handleSignOut = async () => {
    setLoading(true); // Indicate activity
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
      router.push('/signin'); // Redirect to signin after logout
    } catch (err) {
      console.error("Sign out error:", err);
      setError("Failed to sign out. Please try again.");
      setLoading(false); // Reset loading state on error
    }
  };

  // Display Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nova-gray-50">
        {/* <FiLoader className="animate-spin text-nova-blue-500 text-4xl" /> */}
        <p className="ml-3 text-nova-gray-600">Loading Developer Dashboard...</p>
      </div>
    );
  }

  // Should not render if no user/profile, as useEffect redirects
  if (!user || !profile) return null;

  // Display Error State (Optional)
  if (error) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-nova-gray-50 p-4">
              <p className="text-lg text-nova-error-700 mb-4">{error}</p>
              <Button onClick={() => router.push('/signin')} variant="secondary">Go to Sign In</Button>
         </div>
      )
  }

  // Display Dashboard Content
  return (
    <div className="min-h-screen bg-nova-gray-100 p-6 md:p-8">
      <Head><title>Developer Dashboard - DevApps</title></Head>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 p-6 bg-white rounded-lg shadow-md border border-nova-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-nova-gray-900 mb-1">Developer Dashboard</h1>
            <p className="text-nova-gray-600 flex items-center">
              <FiUser className="mr-2" /> Welcome, {profile.username || user.email}! {/* Display username or email */}
            </p>
            <p className="text-xs text-nova-gray-400 mt-1">UID: {user.uid}</p>
          </div>
          <Button onClick={handleSignOut} variant="secondary" icon={FiLogOut} className="mt-4 sm:mt-0">
            Sign Out
          </Button>
        </div>

        {/* Developer Specific Content Area */}
        <div className="bg-white p-6 rounded-lg shadow border border-nova-gray-100">
          <h2 className="text-xl font-semibold text-nova-gray-800 mb-4">Your Apps</h2>
          {/* TODO: Add component to list/manage developer's apps */}
          <p className="text-nova-gray-500">Your uploaded applications will appear here.</p>
          {/* Example Action */}
          <Button href="/developer/upload-app" variant="primary" className="mt-6">
            Upload New App
          </Button>
        </div>

         {/* Add more sections/components as needed */}

      </div>
    </div>
  );
}