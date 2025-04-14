// pages/forgot-password.jsx
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
// --- Firebase Imports ---
import { auth } from '../utils/firebaseClient'; // Use Firebase auth instance
import { sendPasswordResetEmail } from 'firebase/auth';
// --- Icons ---
import { FiMail, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Button from '../components/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // --- Action Code Settings for Firebase ---
    // This tells Firebase where to redirect the user AFTER they click the link
    // in the email. This URL must handle the password reset confirmation.
    const actionCodeSettings = {
      url: `${window.location.origin}/signin?message=Password reset successful!`, // Redirect back to signin page after successful reset (on the reset page)
      // url: `${window.location.origin}/reset-password`, // You *could* use this if you want to land them on reset-password page first, but Firebase typically handles the code verification inline
      handleCodeInApp: true, // Recommended for web apps
    };

    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setMessage('Password reset email sent! Please check your inbox (and spam folder). Follow the instructions in the email.');
      // Optionally clear email field
      // setEmail('');
    } catch (err) {
      let friendlyMessage = err.message;
       if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        // Don't reveal if email exists or not for security, give generic message
        friendlyMessage = 'If an account exists for this email, a password reset link has been sent.';
        setMessage(friendlyMessage); // Show as message, not error
      } else {
        setError(`Failed to send reset email: ${err.message}`);
      }
      console.error("Password reset error:", err);
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = { /* ... (same as before) ... */ };

  return (
    <>
      <Head><title>Forgot Password - DevApps</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nova-gray-50 via-white to-nova-blue-50 px-4 py-12">
        <motion.div
          variants={pageVariants} initial="initial" animate="animate" exit="exit"
          className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-nova-gray-100"
        >
          <div className="text-center">
            <Link href="/" passHref legacyBehavior><a className="inline-block text-3xl font-bold text-nova-gray-800 mb-2">DevApps</a></Link>
            <h2 className="text-2xl font-semibold text-nova-gray-700">Reset Your Password</h2>
            <p className="text-sm text-nova-gray-500 mt-1">Enter your email to receive reset instructions.</p>
          </div>

          {/* Display Status/Error Messages */}
          {message && (
             <motion.div className="p-4 text-sm text-nova-success-700 bg-nova-success-50 rounded-lg border border-nova-success-200 flex items-center space-x-2">
                 <FiCheckCircle className="w-5 h-5"/><span>{message}</span>
             </motion.div>
           )}
           {error && (
              <motion.div className="p-4 text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center space-x-2">
                 <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
             </motion.div>
           )}

          {/* Show form only if no message sent yet */}
          {!message && (
             <form onSubmit={handlePasswordReset} className="space-y-4 pt-2">
               {/* Email Input */}
               <div className="relative">
                 <label htmlFor="email" className="sr-only">Email</label>
                 <FiMail className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                 <input
                   id="email" name="email" type="email" autoComplete="email" required
                   value={email} onChange={(e) => setEmail(e.target.value)}
                   className="w-full pl-10 pr-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200"
                   placeholder="you@example.com"
                   disabled={loading}
                 />
               </div>

               {/* Submit Button */}
               <div className="pt-2">
                 <Button
                   type="submit" variant="primary" className="w-full justify-center"
                   disabled={loading}
                 >
                   {loading ? 'Sending...' : 'Send Reset Instructions'}
                 </Button>
               </div>
             </form>
           )}

          <p className="text-sm text-center text-nova-gray-500 pt-4">
            Remembered your password?{' '}
            <Link href="/signin" className="font-medium text-nova-blue-600 hover:text-nova-blue-500">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}