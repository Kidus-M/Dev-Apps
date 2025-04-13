// pages/reset-password.jsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { createClient } from '../utils/supabase/client'; // Use client-side helper
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiKey } from 'react-icons/fi';
import Button from '../components/Button';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isValidLink, setIsValidLink] = useState(null); // null: checking, true: valid, false: invalid
  const router = useRouter();
  const supabase = createClient();

  // Check if the reset token in the URL seems valid by checking session status
  useEffect(() => {
    let timeoutId;
    let subscription;

    const checkSession = async () => {
      // Give Supabase client ~1s to process the hash and establish session
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session check error:", sessionError);
        setError(`Error verifying link: ${sessionError.message}`);
        setIsValidLink(false);
      } else if (!session) {
        // No session established after delay - likely invalid/expired link
        console.warn("No session found after delay. Link might be invalid/expired.");
        setError('This password reset link seems invalid or has expired. Please request a new one.');
        setIsValidLink(false);
        // Redirect after a delay
        timeoutId = setTimeout(() => router.push('/forgot-password'), 5000);
      } else {
        // Session exists, link is valid
        console.log("Valid reset session detected.");
        setIsValidLink(true);
        setError(null); // Clear any previous errors
      }
    };

    // Listen for explicit PASSWORD_RECOVERY event as well
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
       console.log('Auth Event on Reset Page:', event);
       if (event === 'PASSWORD_RECOVERY') {
          console.log('PASSWORD_RECOVERY event received.');
          setIsValidLink(true); // Mark as valid upon event
          setError(null);
       }
       // We might also get SIGNED_IN if the session was established
       else if (event === 'SIGNED_IN' && session) {
            console.log('SIGNED_IN event received.');
             setIsValidLink(true);
             setError(null);
       }
    });
    subscription = authListener?.subscription;

    // Check for explicit error in URL from Supabase redirect
    const params = new URLSearchParams(window.location.hash.substring(1));
    const errorDescription = params.get('error_description');
    if (errorDescription) {
      setError(`Error processing reset link: ${errorDescription}`);
      setIsValidLink(false);
    } else {
      // If no immediate error, proceed to check session
      checkSession();
    }

    return () => {
      // Cleanup
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [supabase, router]); // Dependencies


  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isValidLink) {
        setError("Cannot update password, the reset link appears invalid or expired.");
        return;
    }

    setLoading(true);

    // The user's session is automatically set by Supabase from the URL fragment,
    // so updateUser targets the correct logged-in user.
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(`Failed to update password: ${updateError.message}`);
      console.error("Password update error:", updateError.message);
    } else {
      setMessage('Password updated successfully! Redirecting to Sign In...');
      // Redirect to signin page after a short delay
      setTimeout(() => {
        router.push('/signin');
      }, 3000); // 3-second delay
    }

    setLoading(false);
  };

  const pageVariants = { /* ... (same as signin/signup) ... */ };

  // Show loading state while checking link validity
  if (isValidLink === null) {
     return (
         <div className="min-h-screen flex items-center justify-center bg-nova-gray-50">
           <p className="text-nova-gray-600">Verifying reset link...</p>
           {/* Add spinner */}
         </div>
     );
  }

  return (
    <>
      <Head>
        <title>Reset Password - DevApps</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nova-gray-50 via-white to-nova-blue-50 px-4 py-12">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-nova-gray-100"
        >
          <div className="text-center">
            <Link href="/" passHref legacyBehavior>
              <a className="inline-block text-3xl font-bold text-nova-gray-800 mb-2">DevApps</a>
            </Link>
            <h2 className="text-2xl font-semibold text-nova-gray-700">Set New Password</h2>
            <p className="text-sm text-nova-gray-500 mt-1">
              Enter and confirm your new password below.
            </p>
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

          {/* Show form only if link is valid and no success message */}
          {isValidLink && !message && (
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
                  href="#" onClick={(e) => { e.preventDefault(); handlePasswordUpdate(e); }}
                  type="submit" variant="primary" className="w-full justify-center"
                  disabled={loading}
                  icon={loading ? null : FiKey}
                >
                  {loading ? 'Updating Password...' : 'Set New Password'}
                </Button>
              </div>
            </form>
           )}

           {/* Link back to Sign In if showing error */}
           {error && (
                <p className="text-sm text-center text-nova-gray-500 pt-4">
                 Need help?{' '}
                 <Link href="/signin" passHref legacyBehavior>
                     <a className="font-medium text-nova-blue-600 hover:text-nova-blue-500">
                     Back to Sign In
                     </a>
                 </Link>
                 {' or '}
                 <Link href="/forgot-password" passHref legacyBehavior>
                     <a className="font-medium text-nova-blue-600 hover:text-nova-blue-500">
                     Request a new link
                     </a>
                 </Link>
                </p>
           )}

        </motion.div>
      </div>
    </>
  );
}