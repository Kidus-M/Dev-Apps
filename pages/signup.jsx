// pages/signup.jsx
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';
import { FiUser, FiUserPlus, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiUsers, FiTool } from 'react-icons/fi';
import Button from '../components/Button';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  // --- Added async keyword here ---
  // Inside export default function SignUp() { ... }

  // Enhanced handleSignUp with debugging
  const handleSignUp = async (e) => {
    e.preventDefault();
    console.log('handleSignUp called'); // <-- DEBUG 1: Is function firing?
    setError(null);
    setMessage(null);

    // --- Client-side Validation ---
    if (!role) {
      console.log('Validation failed: Role not selected'); // <-- DEBUG 2a
      setError("Please select your role: Developer or Tester.");
      return;
    }
    if (!username || username.trim().length < 3) {
      console.log('Validation failed: Username too short'); // <-- DEBUG 2b
      setError("Please enter a username (minimum 3 characters).");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      console.log('Validation failed: Username format invalid'); // <-- DEBUG 2c
      setError("Username can only contain letters, numbers, and underscores (_).");
      return;
    }
    if (password.length < 6) {
      console.log('Validation failed: Password too short'); // <-- DEBUG 2d
      setError("Password must be at least 6 characters long.");
      return;
    }
    // --- End Validation ---

    console.log('Validation passed. Setting loading...'); // <-- DEBUG 3
    setLoading(true);

    try {
      console.log('Attempting Supabase sign up...'); // <-- DEBUG 4
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim().toLowerCase(),
            role: role,
          },
          // emailRedirectTo: `${window.location.origin}/`,
        },
      });

      console.log('Supabase response:', { data, signUpError }); // <-- DEBUG 5: See the result

      if (signUpError) {
        console.log('Supabase returned an error:', signUpError.message); // <-- DEBUG 6a
        // Check for specific Supabase errors
         if (signUpError.message.toLowerCase().includes('unique constraint') && signUpError.message.includes('username')) {
            setError("Username already taken. Please choose another.");
         } else if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('user already exists')) {
            setError("An account with this email already exists. Try signing in.");
         } else if (signUpError.message.toLowerCase().includes('check constraint') && signUpError.message.includes('username_length')) {
            setError("Username must be at least 3 characters long.");
         }
         else {
            setError(`Sign up failed: ${signUpError.message}`);
         }
         console.error("Sign up error object:", signUpError); // Log the full error object

      } else if (data.user) {
        const needsConfirmation = data.session === null;
        if (needsConfirmation) {
          console.log('Sign up successful, confirmation needed.'); // <-- DEBUG 6b
          setMessage('Success! Please check your email to confirm your account.');
          setPassword('');
        } else {
          console.log('Sign up successful, auto-confirmed (or user existed), redirecting...'); // <-- DEBUG 6c
          setMessage('Account created successfully! Redirecting...');
          router.push('/dashboard-redirect');
        }
      } else {
         // This case might indicate an issue with the response structure
         console.warn('Supabase returned no user and no error.'); // <-- DEBUG 6d
         setError("An unexpected response was received during sign up. Please try again.");
      }

    } catch (err) {
      // Catch any unexpected JS errors during the process
      console.error("CRITICAL ERROR in handleSignUp:", err); // <-- DEBUG 7
      setError(`An unexpected critical error occurred: ${err.message}`);
    } finally {
      // This block runs regardless of success or error in the try block
      console.log('Setting loading to false.'); // <-- DEBUG 8
      setLoading(false);
    }
  }; // --- End of handleSignUp function ---

  // Add logs to see state values on render
  console.log('Current state:', { loading, error, message });

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } }
  };

  // --- Main component return statement ---
  return (
    <>
      <Head>
        <title>Sign Up - DevApps</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nova-gray-50 via-white to-nova-blue-50 px-4 py-12">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-md p-8 space-y-5 bg-white rounded-xl shadow-lg border border-nova-gray-100"
        >
          <div className="text-center">
             <Link href="/" passHref legacyBehavior>
               <a className="inline-block text-3xl font-bold text-nova-gray-800 mb-2">
                 DevApps
               </a>
             </Link>
            <h2 className="text-2xl font-semibold text-nova-gray-700">Create your Account</h2>
            <p className="text-sm text-nova-gray-500 mt-1">
              Join as a Developer or Tester!
            </p>
          </div>

          {/* Display Success/Error Messages */}
          {message && (
            <motion.div /* ... Success message styling ... */ className="p-4 text-sm text-nova-success-700 bg-nova-success-50 rounded-lg border border-nova-success-200 flex items-center space-x-2">
                <FiUserPlus className="w-5 h-5"/><span>{message}</span>
            </motion.div>
          )}
           {error && (
             <motion.div /* ... Error message styling ... */ className="p-4 text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center space-x-2">
                 <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
             </motion.div>
           )}

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Role Selection */}
            <fieldset className="pt-1">
              <legend className="block text-sm font-medium text-nova-gray-700 mb-2">I want to sign up as a:</legend>
              <div className="grid grid-cols-2 gap-4">
                {[ 'developer', 'tester'].map((roleOption) => (
                  <label
                    key={roleOption}
                    htmlFor={`role-${roleOption}`}
                    className={`relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      role === roleOption
                        ? 'bg-nova-blue-50 border-nova-blue-500 ring-2 ring-nova-blue-300'
                        : 'border-nova-gray-300 hover:border-nova-blue-400 hover:bg-nova-gray-50'
                    } ${loading || message ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio" id={`role-${roleOption}`} name="role" value={roleOption}
                      checked={role === roleOption} onChange={(e) => setRole(e.target.value)}
                      className="sr-only" aria-labelledby={`role-${roleOption}-label`}
                      disabled={loading || message}
                    />
                    <div className="flex items-center text-sm">
                       <span className={`mr-2 ${role === roleOption ? 'text-nova-blue-600' : 'text-nova-gray-500'}`}>
                          {roleOption === 'developer' ? <FiTool className="w-5 h-5"/> : <FiUsers className="w-5 h-5"/>}
                       </span>
                       <span id={`role-${roleOption}-label`} className={`font-medium ${role === roleOption ? 'text-nova-blue-700' : 'text-nova-gray-700'}`}>
                         {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                       </span>
                    </div>
                     <span className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-200 ${role === roleOption ? 'bg-nova-blue-500 border-white' : 'border-nova-gray-400 bg-white'}`}>
                        {role === roleOption && <span className="block w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

             {/* Username Input */}
            <div className="relative">
              <label htmlFor="username" className="sr-only">Username</label>
              <FiUser className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
              <input
                id="username" name="username" type="text"
                required minLength="3" maxLength="30"
                pattern="^[a-zA-Z0-9_]+$"
                title="Only letters, numbers, and underscores allowed (min 3)."
                value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200"
                placeholder="Username"
                disabled={loading || message}
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <label htmlFor="email" className="sr-only">Email</label>
              <FiMail className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
              <input
                id="email" name="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200"
                placeholder="Email Address"
                disabled={loading || message}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
                 <label htmlFor="password" className="sr-only">Password</label>
                 <FiLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                 <input
                    id="password" name="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password" required minLength="6"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200"
                    placeholder="Password (min. 6 characters)"
                    disabled={loading || message}
                 />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 transform -translate-y-1/2 text-nova-gray-500 hover:text-nova-blue-500" aria-label={showPassword ? "Hide password" : "Show password"} disabled={loading || message}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                 </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                href="#" onClick={(e) => { e.preventDefault(); handleSignUp(e); }}
                type="submit" variant="primary" className="w-full justify-center"
                disabled={loading || message}
                icon={loading ? null : FiUserPlus}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          {!message && (
            <p className="text-sm text-center text-nova-gray-500 pt-4">
              Already have an account?{' '}
              <Link href="/signin" passHref legacyBehavior>
                <a className="font-medium text-nova-blue-600 hover:text-nova-blue-500">
                  Sign In
                </a>
              </Link>
            </p>
          )}

           {/* Note about future profile steps */}
            {message && message.includes('confirm your account') && (
                 <p className="text-xs text-center text-nova-gray-500 pt-4">
                    After confirming, you can complete your profile with details like a bio and avatar!
                 </p>
            )}
        </motion.div>
      </div>
    </>
  );
} // --- End of SignUp component function ---