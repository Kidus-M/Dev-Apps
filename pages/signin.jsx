// pages/signin.jsx
import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabaseClient";
import {
  FiLogIn,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
} from "react-icons/fi";
// Removed FcGoogle import
import Button from "../components/Button";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Removed handleGoogleSignIn

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: email,
        password: password,
      }
    );

    if (signInError) {
      setError(signInError.message); // Common errors: "Invalid login credentials", "Email not confirmed"
      console.error("Sign in error:", signInError.message);
    } else if (data.user) {
      console.log("Sign in successful, redirecting to dashboard handler...");
      // --- UPDATED REDIRECT ---
      // Redirect to the page that handles role-based dashboard routing
      router.push("/dashboard-redirect");
      // Middleware would also catch a redirect to '/', but this is more explicit.
    } else {
      setError("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  const pageVariants = {
    /* ... (same as before) ... */
  };

  return (
    <>
      <Head>
        <title>Sign In - DevApps</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nova-gray-50 via-white to-nova-mint-50 px-4 py-12">
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
            <h2 className="text-2xl font-semibold text-nova-gray-700">
              Welcome Back!
            </h2>
            <p className="text-sm text-nova-gray-500 mt-1">
              Sign in to continue.
            </p>
          </div>

          {error}

          {/* Removed Google Button and Divider */}

          <form onSubmit={handleSignIn} className="space-y-4 pt-2">
            {" "}
            {/* Added padding */}
            {/* Email Input */}
            <div className="relative">
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <FiMail className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            {/* Password Input w/ Forgot Link */}
            <div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <FiLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-200"
                  placeholder="Password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-nova-gray-500 hover:text-nova-blue-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div className="text-right mt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-nova-blue-600 hover:text-nova-blue-500"
                >
                  {/* The text is now the direct child */}
                  Forgot password?
                </Link>
              </div>
            </div>
            {/* Submit Button */}
            <div className="pt-2">
              <Button
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSignIn(e);
                }}
                type="submit"
                variant="primary"
                className="w-full justify-center"
                disabled={loading}
                icon={loading ? null : FiLogIn}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </div>
          </form>

          <p className="text-sm text-center text-nova-gray-500 pt-4">
            {" "}
            {/* Added padding */}
            Don't have an account?{" "}
            <Link href="/signup" passHref legacyBehavior>
              <a className="font-medium text-nova-blue-600 hover:text-nova-blue-500">
                Sign Up
              </a>
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
