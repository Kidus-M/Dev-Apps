// pages/reset-password.jsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
// --- Firebase Imports ---
import { auth } from '../utils/firebaseClient';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
// --- Icons ---
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiKey } from 'react-icons/fi';
import Button from '../components/Button';

export default function ResetPassword() {
  const [oobCode, setOobCode] = useState(null); // Out Of Band code from URL
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true); // Start in verifying state
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  // Get oobCode from URL query parameters on mount
  useEffect(() => {
    // Ensure router is ready and query object is populated
    if (!router.isReady) return;

    const code = router.query.oobCode; // Firebase uses query param 'oobCode'

    if (!code) {
      setError("Invalid password reset link. No reset code found.");
      setVerifying(false);
      // Redirect after delay
      setTimeout(() => router.push('/forgot-password'), 4000);
      return;
    }

    setOobCode(code);

    // Verify the code immediately
    const verifyCode = async () => {
      setError(null); // Clear previous errors
      try {
        await verifyPasswordResetCode(auth, code);
        console.log("Password reset code verified successfully.");
        setVerifying(false); // Code is valid, stop verifying
      } catch (err) {
        console.error("Invalid oobCode:", err);
        let friendlyMessage = `Invalid or expired link (${err.code || 'unknown error'}).`;
        // if (err.code === 'auth/invalid-action-code') friendlyMessage = 'Invalid or expired password reset link.';
        // if (err.code === 'auth/expired-action-code') friendlyMessage = 'The password reset link has expired.';
        setError(friendlyMessage + " Please request a new one.");
        setVerifying(false);
         // Redirect after delay
        setTimeout(() => router.push('/forgot-password'), 5000);
      }
    };

    verifyCode();

  }, [router.isReady, router.query]); // Rerun when router is ready or query changes

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (verifying || !oobCode) {
        setError("Cannot update password yet. Code verification pending or failed.");
        return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage('Password updated successfully! Redirecting to Sign In...');
      // Redirect to signin page after a short delay
      setTimeout(() => {
        router.push('/signin');
      }, 3000); // 3-second delay

    } catch (err) {
       let friendlyMessage = `Failed to update password: ${err.message}`;
       if (err.code === 'auth/expired-action-code') {
            friendlyMessage = 'The password reset link has expired. Please request a new one.';
            // Redirect back to forgot password page?
             setTimeout(() => router.push('/forgot-password'), 4000);
       } else if (err.code === 'auth/invalid-action-code') {
            friendlyMessage = 'The password reset link is invalid. Please request a new one.';
             setTimeout(() => router.push('/forgot-password'), 4000);
       } else if (err.code === 'auth/weak-password') {
           friendlyMessage = 'Password is too weak (must be at least 6 characters).';
       }
       setError(friendlyMessage);
       console.error("Password update error:", err);
    } finally {
       setLoading(false);
    }
  };

  const pageVariants = { /* ... (same as before) ... */ };

  // Show verifying state
  if (verifying) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-nova-gray-50">
          <p className="text-nova-gray-600">Verifying reset link...</p>
          {/* Add spinner */}
        </div>
    );
  }

  return (
    <>
      <Head><title>Reset Password - DevApps</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nova-gray-50 via-white to-nova-blue-50 px-4 py-12">
        <motion.div
          variants={pageVariants} initial="initial" animate="animate" exit="exit"
          className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-nova-gray-100"
        >
          <div className="text-center">
            <Link href="/" passHref legacyBehavior><a className="inline-block text-3xl font-bold text-nova-gray-800 mb-2">DevApps</a></Link>
            <h2 className="text-2xl font-semibold text-nova-gray-700">Set New Password</h2>
            {/* Conditionally show prompt based on error/message state */}
            {!error && !message && <p className="text-sm text-nova-gray-500 mt-1">Enter and confirm your new password below.</p>}
          </div>

          {message}
          {error }

          {/* Show form only if code was valid and no success message */}
          {oobCode && !verifying && !error && !message && (
            <form onSubmit={handlePasswordUpdate} className="space-y-4 pt-2">
              {/* New Password Input */}
              <div className="relative">
                  <label htmlFor="new-password" className="sr-only">New Password</label>
                  <FiLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                  <input
                      id="new-password" name="newPassword" type={showPassword ? 'text' : 'password'}
                      required minLength="6"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200"
                      placeholder="New Password (min. 6 characters)"
                      disabled={loading}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 transform -translate-y-1/2 text-nova-gray-500 hover:text-nova-blue-500" aria-label={showPassword ? "Hide password" : "Show password"} disabled={loading}>
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
              </div>

               {/* Confirm New Password Input */}
              <div className="relative">
                   <label htmlFor="confirm-password" className="sr-only">Confirm New Password</label>
                   <FiLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                   <input
                      id="confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                      required minLength="6"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200"
                      placeholder="Confirm New Password"
                      disabled={loading}
                   />
                   <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute top-1/2 right-3 transform -translate-y-1/2 text-nova-gray-500 hover:text-nova-blue-500" aria-label={showConfirmPassword ? "Hide password" : "Show password"} disabled={loading}>
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                   </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit" variant="primary" className="w-full justify-center"
                  disabled={loading} icon={loading ? null : FiKey}
                >
                  {loading ? 'Updating Password...' : 'Set New Password'}
                </Button>
              </div>
            </form>
           )}

           {/* Link back to Sign In if showing error or message */}
           {(error || message) && (
                <p className="text-sm text-center text-nova-gray-500 pt-4">
                 <Link href="/signin" className="font-medium text-nova-blue-600 hover:text-nova-blue-500">
                     Back to Sign In
                 </Link>
                 {error && !error.includes("expired") && !error.includes("invalid") && ' or ' }
                 {error && !error.includes("expired") && !error.includes("invalid") &&
                     <Link href="/forgot-password" className="font-medium text-nova-blue-600 hover:text-nova-blue-500">
                         Request a new link
                     </Link>
                 }
                </p>
           )}

        </motion.div>
      </div>
    </>
  );
}