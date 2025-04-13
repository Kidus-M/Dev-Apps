// pages/forgot-password.jsx
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient'; // Use default client helper
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

    // --- IMPORTANT: Set up Redirect URL ---
    // Supabase needs to know where to send the user AFTER they click the email link
    // to set their new password. This URL must be added to your allowed Redirect URLs
    // in Supabase Auth settings. Let's assume you'll create a page at /reset-password.
    const resetPasswordRedirectUrl = `${window.location.origin}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: resetPasswordRedirectUrl,
    });

    if (resetError) {
      setError(resetError.message);
      console.error("Password reset error:", resetError.message);
    } else {
      setMessage('Password reset email sent! Please check your inbox (and spam folder). Follow the instructions in the email.');
      // Optionally clear email field after success
      // setEmail('');
    }

    setLoading(false);
  };

  const pageVariants = { /* ... (same as signin/signup) ... */ };


  return (
    <>
      <Head>
        <title>Forgot Password - DevApps</title>
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
              <a className="inline-block text-3xl font-bold text-nova-gray-800 mb-2">
                DevApps
              </a>
            </Link>
            <h2 className="text-2xl font-semibold text-nova-gray-700">Reset Your Password</h2>
            <p className="text-sm text-nova-gray-500 mt-1">
              Enter your email to receive reset instructions.
            </p>
          </div>

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
                disabled={loading || message} // Disable after sending email
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                href="#" onClick={(e) => { e.preventDefault(); handlePasswordReset(e); }}
                type="submit" variant="primary" className="w-full justify-center"
                disabled={loading || message}
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
            </div>
          </form>

          {!message && ( // Hide links if message shown
            <p className="text-sm text-center text-nova-gray-500 pt-4">
              Remembered your password?{' '}
              <Link href="/signin" passHref legacyBehavior>
                <a className="font-medium text-nova-blue-600 hover:text-nova-blue-500">
                  Sign In
                </a>
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </>
  );
}