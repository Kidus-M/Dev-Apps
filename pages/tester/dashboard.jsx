// pages/tester/dashboard.jsx
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

export default function TesterDashboard() {
  const [user, setUser] = useState(null); // Firebase Auth user object
  const [profile, setProfile] = useState(null); // Firestore profile data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
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
            // --- Role Check ---
            if (profileData.role !== 'tester') {
              console.warn("Role mismatch: User is not a tester. Redirecting...");
              router.replace('/developer/dashboard'); // Redirect developers away
              return;
            }
            console.log("Tester profile loaded:", profileData);
          } else {
            console.error("Tester profile not found in Firestore for UID:", currentUser.uid);
            setError("Profile data not found. Please try signing in again or contact support.");
            await signOut(auth);
            router.replace('/signin');
            return;
          }
        } catch (profileError) {
          console.error("Error fetching tester profile:", profileError);
          setError("Failed to load profile data.");
          // Optionally sign out
          // await signOut(auth);
          // router.replace('/signin');
          // return;
        }
      } else {
        setUser(null);
        setProfile(null);
        console.log("No user found, redirecting to signin from tester dashboard.");
        router.replace('/signin');
        return;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
      router.push('/signin');
    } catch (err) {
      console.error("Sign out error:", err);
      setError("Failed to sign out. Please try again.");
      setLoading(false);
    }
  };

  // Display Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nova-gray-50">
        {/* <FiLoader className="animate-spin text-nova-blue-500 text-4xl" /> */}
        <p className="ml-3 text-nova-gray-600">Loading Tester Dashboard...</p>
      </div>
    );
  }

   if (!user || !profile) return null; // Should be redirected

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
      <Head><title>Tester Dashboard - DevApps</title></Head>
       <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 p-6 bg-white rounded-lg shadow-md border border-nova-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-nova-gray-900 mb-1">Tester Dashboard</h1>
             <p className="text-nova-gray-600 flex items-center">
               <FiUser className="mr-2" /> Welcome, {profile.username || user.email}!
             </p>
             <p className="text-xs text-nova-gray-400 mt-1">UID: {user.uid}</p>
          </div>
          <Button onClick={handleSignOut} variant="secondary" icon={FiLogOut} className="mt-4 sm:mt-0">
            Sign Out
          </Button>
        </div>

        {/* Tester Specific Content Area */}
        <div className="bg-white p-6 rounded-lg shadow border border-nova-gray-100">
          <h2 className="text-xl font-semibold text-nova-gray-800 mb-4">Available Apps for Testing</h2>
          {/* TODO: Add component to list apps available for testers */}
          <p className="text-nova-gray-500">Applications ready for your feedback will appear here.</p>
           {/* Example Action */}
           <Button href="/tester/browse-apps" variant="primary" className="mt-6">
             Browse Apps
           </Button>
        </div>

         {/* Add more sections/components as needed */}

      </div>
    </div>
  );
}