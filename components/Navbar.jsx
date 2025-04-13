// components/Navbar.jsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import Button from './Button'; // Import the Button component

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md" // Semi-transparent background
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Placeholder */}
          <Link href="/" passHref legacyBehavior>
            <a className="text-2xl font-bold text-nova-gray-800 hover:text-nova-blue-500 transition-colors">
              NovaTest {/* Or your app name/logo */}
            </a>
          </Link>

          {/* Navigation Links / Buttons */}
          <div className="flex items-center space-x-4">
            <Button href="/signin" variant="secondary">Sign In</Button>
            <Button href="/signup" variant="primary">Sign Up</Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;