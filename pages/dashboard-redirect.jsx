// pages/dashboard-redirect.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// --- Firebase Imports ---
import { auth, db } from '../utils/firebaseClient'; // Import Firebase auth & db
import { onAuthStateChanged } from 'firebase/auth'; // Listener for auth state
import { doc, getDoc } from 'firebase/firestore'; // Firestore functions
// --- Optional: Spinner ---
// import { FiLoader } from 'react-icons/fi'; // Example spinner icon

export default function DashboardRedirect() {
  const router = useRouter();
  // Keep loading state for feedback, add error state
  const [status, setStatus] = useState('loading'); // 'loading', 'redirecting', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setStatus('loading'); // Initial status

    // Use onAuthStateChanged for reliable user status check after redirects
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in according to Firebase Auth.
        console.log("DashboardRedirect: User found UID:", user.uid);
        setStatus('redirecting'); // Update status

        // Now fetch their profile from Firestore to get the role.
        const profileDocRef = doc(db, "profiles", user.uid); // Reference to user's doc in 'profiles'

        try {
          const profileSnap = await getDoc(profileDocRef);

          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            const userRole = profileData.role;
            console.log("DashboardRedirect: Profile data found", profileData);

            // Redirect based on role
            if (userRole === 'developer') {
              console.log("Redirecting to Developer Dashboard");
              router.replace('/developer/dashboard'); // Use replace to avoid history entry
            } else if (userRole === 'tester') {
              console.log("Redirecting to Tester Dashboard");
              router.replace('/tester/dashboard');
            } else {
              // Profile exists but role is missing or invalid
              console.warn("User profile role missing or invalid:", profileData);
              // Ideal: Redirect to a profile completion page
              // router.replace('/complete-profile');
              // Fallback: Sign out and redirect to signin with error
              setStatus('error');
              setErrorMessage('Your profile setup is incomplete (missing role). Please sign in again or contact support.');
              await auth.signOut();
              setTimeout(() => router.replace('/signin'), 3000); // Delay before redirect
            }
          } else {
            // Profile document doesn't exist in Firestore
            // This commonly happens after first Google Sign-In
            console.warn("User profile document not found for UID:", user.uid);
            // Ideal: Redirect to a profile completion page where they set username/role
            // router.replace('/complete-profile');
            // Fallback: Sign out and redirect to signin with error
            setStatus('error');
            setErrorMessage('Profile setup required. Please sign in again or complete registration.');
            await auth.signOut();
            setTimeout(() => router.replace('/signin'), 3000); // Delay before redirect
          }
        } catch (profileError) {
          // Error fetching the profile document
          console.error("Error fetching Firestore profile:", profileError);
          setStatus('error');
          setErrorMessage('Could not load your profile data. Please try again.');
          await auth.signOut(); // Sign out if profile fetch fails
          setTimeout(() => router.replace('/signin'), 3000);
        }
      } else {
        // User is not signed in (or session expired during check)
        console.log("DashboardRedirect: No user found, redirecting to signin");
        // No need to set status, just redirect immediately
        router.replace('/signin');
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();

  }, [router]); // Dependency: router

  // Display loading/error feedback
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-nova-gray-50 p-4 text-center">
       {/* Optional Spinner */}
       {/* {status === 'loading' && <FiLoader className="animate-spin text-nova-blue-500 text-4xl mb-4" />} */}

       <p className="text-lg text-nova-gray-700">
        {status === 'loading' && 'Checking authentication...'}
        {status === 'redirecting' && 'Loading your dashboard...'}
        {status === 'error' && 'Something went wrong...'}
      </p>
      {errorMessage && (
        <p className="mt-2 text-sm text-nova-error-600 bg-nova-error-50 p-3 rounded-md">
          {errorMessage}
        </p>
      )}
       {/* Add a more visual spinner component here if desired */}
    </div>
  );
}