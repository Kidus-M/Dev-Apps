// pages/signup.jsx
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
// --- Firebase Imports ---
import { auth, db } from '../utils/firebaseClient'; // Import Firebase auth & db
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Firestore functions
// --- Icons ---
import { FiUser, FiUserPlus, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiUsers, FiTool } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import Button from '../components/Button';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  // --- Google Sign Up/In Handler ---
  // const handleGoogleSignUp = async () => {
  //   setGoogleLoading(true);
  //   setError(null);
  //   const provider = new GoogleAuthProvider();
  //   try {
  //     const result = await signInWithPopup(auth, provider);
  //     console.log("Google Sign Up/In successful, user:", result.user);
  //     // IMPORTANT: Profile creation for Google users needs separate handling.
  //     // Typically check in dashboard-redirect or force a profile setup step.
  //     // We don't collect username/role on this form for Google signup.
  //     router.push('/dashboard-redirect'); // Redirect to handler page
  //   } catch (err) {
  //     setError(`Google Sign Up failed: ${err.message}`);
  //     console.error("Google Sign Up error:", err);
  //     setGoogleLoading(false);
  //   }
  // };

  // --- Email/Password Sign Up Handler ---
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // --- Client-side Validation ---
    if (!role) { setError("Please select your role: Developer or Tester."); return; }
    if (!username || username.trim().length < 3) { setError("Please enter a username (minimum 3 characters)."); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Username can only contain letters, numbers, and underscores (_)."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters long."); return; }
    // --- End Validation ---

    setLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      console.log("Firebase Auth user created:", user);

      // 2. Create user profile document in Firestore
      const profileData = {
        uid: user.uid, // Link to auth user
        email: user.email,
        username: username.trim().toLowerCase(), // Store username consistently
        role: role,
        createdAt: serverTimestamp(), // Use server timestamp
        // Add placeholders for other fields maybe?
        // avatarUrl: null,
        // phone: null,
      };

      // Use user.uid as the document ID in 'profiles' collection
      await setDoc(doc(db, "profiles", user.uid), profileData);
      console.log("Firestore profile created for user:", user.uid);

      // --- Success ---
      // Firebase Auth doesn't require email verification by default.
      // You SHOULD enable it in Firebase console -> Auth -> Settings -> Email Enumeration Protection & Verification
      // If verification is enabled, the user object might have emailVerified = false.
      // For now, we assume success means logged in.
      setMessage('Account created successfully! Redirecting...');
      router.push('/dashboard-redirect'); // Redirect to handler page

    } catch (err) {
      // Handle specific errors
      let friendlyMessage = err.message;
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "This email is already registered. Try signing in.";
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = "Password is too weak (must be at least 6 characters).";
      } else if (err.message.includes('Firestore') || err.message.includes('setDoc')) {
          // This might happen if Firestore rules block writing, or other Firestore issue
          friendlyMessage = "Account created, but failed to save profile data. Please try completing profile later.";
          // We might want to log the user in anyway or handle this more gracefully
          console.error("Firestore profile creation error:", err)
          // Optionally redirect even on profile error: router.push('/dashboard-redirect');
      }
      setError(friendlyMessage);
      console.error("Sign up process error:", err);
    } finally {
      setLoading(false);
    }
  }; // --- End of handleSignUp function ---

  const pageVariants = { /* ... (same as before) ... */ };

  return (
    <>
      <Head><title>Sign Up - DevApps</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nova-gray-50 via-white to-nova-blue-50 px-4 py-12">
        <motion.div
          variants={pageVariants} initial="initial" animate="animate" exit="exit"
          className="w-full max-w-md p-8 space-y-5 bg-white rounded-xl shadow-lg border border-nova-gray-100"
        >
          <div className="text-center">
             {/* ... (Logo, Title - same as before) ... */}
             <Link href="/" passHref legacyBehavior><a className="inline-block text-3xl font-bold text-nova-gray-800 mb-2">DevApps</a></Link>
             <h2 className="text-2xl font-semibold text-nova-gray-700">Create your Account</h2>
             <p className="text-sm text-nova-gray-500 mt-1">Join as a Developer or Tester!</p>
          </div>

          {message }
          {error }

          {/* --- Google Sign Up Button --- */}
           {/* <Button
              href="#" onClick={(e) => {e.preventDefault(); handleGoogleSignUp();}}
              variant="secondary"
              className="w-full justify-center !border-nova-gray-300 !text-nova-gray-700 hover:!bg-nova-gray-100"
              icon={FcGoogle} iconPosition="left"
              disabled={loading || googleLoading || message}
            >
              {googleLoading ? 'Redirecting...' : 'Sign up with Google'}
          </Button> */}

           {/* --- Divider --- */}
           <div className="relative my-4">
              {/* ... (Divider styling) ... */}
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-nova-gray-200"></div></div>
              {/* <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-nova-gray-500">Or sign up with email</span></div> */}
           </div>

          {/* --- Email/Password Form --- */}
          <form onSubmit={handleSignUp} className="space-y-4">
             {/* Role Selection */}
             <fieldset className="pt-1">
               {/* ... (Role selection fieldset - same as before) ... */}
               <legend className="block text-sm font-medium text-nova-gray-700 mb-2">I want to sign up as a:</legend>
               <div className="grid grid-cols-2 gap-4">
                 {[ 'developer', 'tester'].map((roleOption) => (
                   <label key={roleOption} htmlFor={`role-${roleOption}`} className={`relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${ role === roleOption ? 'bg-nova-blue-50 border-nova-blue-500 ring-2 ring-nova-blue-300' : 'border-nova-gray-300 hover:border-nova-blue-400 hover:bg-nova-gray-50'} ${loading || googleLoading || message ? 'opacity-60 cursor-not-allowed' : ''}`}>
                     <input type="radio" id={`role-${roleOption}`} name="role" value={roleOption} checked={role === roleOption} onChange={(e) => setRole(e.target.value)} className="sr-only" aria-labelledby={`role-${roleOption}-label`} disabled={loading || googleLoading || message}/>
                     <div className="flex items-center text-sm">
                       <span className={`mr-2 ${role === roleOption ? 'text-nova-blue-600' : 'text-nova-gray-500'}`}>{roleOption === 'developer' ? <FiTool className="w-5 h-5"/> : <FiUsers className="w-5 h-5"/>}</span>
                       <span id={`role-${roleOption}-label`} className={`font-medium ${role === roleOption ? 'text-nova-blue-700' : 'text-nova-gray-700'}`}>{roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}</span>
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
              {/* ... (Username input - same as before) ... */}
              <label htmlFor="username" className="sr-only">Username</label>
              <FiUser className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
              <input id="username" name="username" type="text" required minLength="3" maxLength="30" pattern="^[a-zA-Z0-9_]+$" title="Only letters, numbers, and underscores allowed (min 3)." value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200" placeholder="Username" disabled={loading || googleLoading || message}/>
            </div>

            {/* Email Input */}
            <div className="relative">
              {/* ... (Email input - same as before) ... */}
              <label htmlFor="email" className="sr-only">Email</label>
              <FiMail className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200" placeholder="Email Address" disabled={loading || googleLoading || message}/>
            </div>

            {/* Password Input */}
            <div className="relative">
                 {/* ... (Password input - same as before) ... */}
                 <label htmlFor="password" className="sr-only">Password</label>
                 <FiLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                 <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200" placeholder="Password (min. 6 characters)" disabled={loading || googleLoading || message}/>
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 transform -translate-y-1/2 text-nova-gray-500 hover:text-nova-blue-500" aria-label={showPassword ? "Hide password" : "Show password"} disabled={loading || googleLoading || message}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit" variant="primary" className="w-full justify-center"
                disabled={loading || googleLoading || message}
                icon={loading ? null : FiUserPlus}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          {!message && (
             <p className="text-sm text-center text-nova-gray-500 pt-4">
               Already have an account?{' '}
               <Link href="/signin" className="font-medium text-nova-blue-600 hover:text-nova-blue-500">
                 Sign In
               </Link>
             </p>
           )}

           {/* Note about future profile steps */}
           {message && message.includes('Account created') && (
                 <p className="text-xs text-center text-nova-gray-500 pt-4">
                    You can complete your profile later with more details!
                 </p>
            )}

        </motion.div>
      </div>
    </>
  );
}