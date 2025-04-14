// pages/signin.jsx
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
// --- Firebase Imports ---
import { auth } from '@/utils/firebaseClient'; // Import Firebase auth instance
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
// --- Icons ---
import { FiLogIn, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import Button from '@/components/Button';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // --- Google Sign In Handler ---
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider(); // Create Google provider instance
    try {
      const result = await signInWithPopup(auth, provider);
      // Signed in successfully
      console.log("Google Sign in successful, user:", result.user);
      // Profile check/creation should happen after redirect or in dashboard
      router.push('/dashboard-redirect'); // Redirect to handler page
    } catch (err) {
      setError(`Google Sign In failed: ${err.message}`);
      console.error("Google Sign In error:", err);
      setGoogleLoading(false);
    }
    // setLoading will remain true until redirect or if error occurs
  };

  // --- Email/Password Sign In Handler ---
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Signed in
      console.log("Email Sign in successful, user:", userCredential.user);
      router.push('/dashboard-redirect'); // Redirect to handler page
    } catch (err) {
      // Handle specific errors
      let friendlyMessage = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setError(friendlyMessage);
      console.error("Email Sign in error:", err);
      setLoading(false); // Stop loading only on error
    }
  };

  const pageVariants = { /* ... (same as before) ... */ };

  return (
    <>
      <Head><title>Sign In - DevApps</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nova-gray-50 via-white to-nova-mint-50 px-4 py-12">
        <motion.div
          variants={pageVariants} initial="initial" animate="animate" exit="exit"
          className="w-full max-w-md p-8 space-y-5 bg-white rounded-xl shadow-lg border border-nova-gray-100"
        >
          <div className="text-center">
             <Link href="/" passHref legacyBehavior>
               <a className="inline-block text-3xl font-bold text-nova-gray-800 mb-2">DevApps</a>
             </Link>
            <h2 className="text-2xl font-semibold text-nova-gray-700">Welcome Back!</h2>
            <p className="text-sm text-nova-gray-500 mt-1">Sign in to continue.</p>
          </div>

          {error && (
             <motion.div className="p-4 text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center space-x-2">
                <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
            </motion.div>
          )}

          {/* --- Google Sign In Button --- */}
          <Button
              href="#" onClick={(e) => {e.preventDefault(); handleGoogleSignIn();}}
              variant="secondary"
              className="w-full justify-center !border-nova-gray-300 !text-nova-gray-700 hover:!bg-nova-gray-100"
              icon={FcGoogle} iconPosition="left"
              disabled={loading || googleLoading}
            >
              {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
          </Button>

           {/* --- Divider --- */}
           <div className="relative my-4">
             {/* ... (Divider styling) ... */}
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-nova-gray-200"></div></div>
             <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-nova-gray-500">Or sign in with email</span></div>
           </div>

          {/* --- Email/Password Form --- */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email Input */}
            <div className="relative">
                <label htmlFor="email" className="sr-only">Email</label>
                <FiMail className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200" placeholder="you@example.com" disabled={loading || googleLoading}/>
            </div>

            {/* Password Input w/ Forgot Link */}
            <div>
                <div className="relative">
                    <label htmlFor="password" className="sr-only">Password</label>
                    <FiLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200" placeholder="Password" disabled={loading || googleLoading}/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 transform -translate-y-1/2 text-nova-gray-500 hover:text-nova-blue-500" aria-label={showPassword ? "Hide password" : "Show password"} disabled={loading || googleLoading}>
                       {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                </div>
                 <div className="text-right mt-1">
                    <Link href="/forgot-password" className="text-xs font-medium text-nova-blue-600 hover:text-nova-blue-500">
                      Forgot password?
                    </Link>
                 </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit" variant="primary" className="w-full justify-center"
                disabled={loading || googleLoading} icon={loading ? null : FiLogIn}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <p className="text-sm text-center text-nova-gray-500 pt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-nova-blue-600 hover:text-nova-blue-500">
              Sign Up
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}