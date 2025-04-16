// pages/dashboard-redirect.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion'; // Import framer-motion for animations
import { FiLoader } from 'react-icons/fi'; // Spinner icon
// --- Firebase Imports ---
import { auth, db } from '../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function DashboardRedirect() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // 'loading', 'redirecting', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setStatus('loading');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setStatus('redirecting');
        const profileDocRef = doc(db, "profiles", user.uid);
        try {
          const profileSnap = await getDoc(profileDocRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            const userRole = profileData.role;
            if (userRole === 'developer') {
              router.replace('/developer/dashboard');
            } else if (userRole === 'tester') {
              router.replace('/tester/dashboard');
            } else {
              setStatus('error');
              setErrorMessage('Your profile setup is incomplete (missing role). Please sign in again or contact support.');
              await auth.signOut();
              setTimeout(() => router.replace('/signin'), 3000);
            }
          } else {
            setStatus('error');
            setErrorMessage('Profile setup required. Please sign in again or complete registration.');
            await auth.signOut();
            setTimeout(() => router.replace('/signin'), 3000);
          }
        } catch (profileError) {
          setStatus('error');
          setErrorMessage('Could not load your profile data. Please try again.');
          await auth.signOut();
          setTimeout(() => router.replace('/signin'), 3000);
        }
      } else {
        router.replace('/signin');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  const spinnerVariants = {
    spin: { rotate: 360 },
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-nova-gray-50 via-white to-nova-blue-50 p-4 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {status === 'loading' && (
        <motion.div
          className="flex flex-col items-center"
          animate="visible"
          initial="hidden"
        >
          <motion.div
            className="text-nova-blue-500 text-6xl mb-4"
            variants={spinnerVariants}
            animate="spin"
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <FiLoader />
          </motion.div>
          <p className="text-lg text-nova-gray-700">Checking authentication...</p>
        </motion.div>
      )}
      {status === 'redirecting' && (
        <motion.div
          className="flex flex-col items-center"
          animate="visible"
          initial="hidden"
        >
          <motion.div
            className="text-nova-blue-500 text-6xl mb-4"
            variants={spinnerVariants}
            animate="spin"
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <FiLoader />
          </motion.div>
          <p className="text-lg text-nova-gray-700">Loading your dashboard...</p>
        </motion.div>
      )}
      {status === 'error' && (
        <motion.div
          className="flex flex-col items-center"
          animate="visible"
          initial="hidden"
        >
          <p className="text-lg text-nova-error-700 mb-4">Something went wrong...</p>
          {errorMessage && (
            <p className="mt-2 text-sm text-nova-error-600 bg-nova-error-50 p-3 rounded-md">
              {errorMessage}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}