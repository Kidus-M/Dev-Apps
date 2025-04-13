// components/Navbar.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import Button from './Button'; // Import the NEW Button component
import { FiLogIn, FiUserPlus } from 'react-icons/fi'; // Icons for buttons

const Navbar = () => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  // Detect scroll direction for hiding navbar
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) { // Hide when scrolling down past 150px
        setHidden(true);
    } else { // Show when scrolling up or near top
        setHidden(false);
    }
    // Add background blur when scrolled past a small threshold
    setScrolled(latest > 50);
  });

  const navbarVariants = {
    visible: { y: 0, opacity: 1 },
    hidden: { y: '-100%', opacity: 0 }
  };

  return (
    <motion.nav
      variants={navbarVariants}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8"> {/* Increased padding */}
        <div className="flex justify-between items-center h-20"> {/* Increased height */}
          {/* Logo */}
          <Link href="/" passHref legacyBehavior>
            <motion.a
              className="text-2xl font-bold text-nova-gray-900 transition-colors"
              whileHover={{ scale: 1.03, color: 'var(--color-nova-blue-500)' }} // Use CSS variable if defined, else fallback
              style={{ '--color-nova-blue-500': '#4F9FFF' }} // Provide fallback for style prop
            >
              DevApps
            </motion.a>
          </Link>

          {/* Buttons */}
          <div className="flex items-center space-x-3"> {/* Slightly reduced space */}
            <Button href="/signin" variant="secondary" icon={FiLogIn} iconPosition="left">
              Sign In
            </Button>
            <Button href="/signup" variant="primary" icon={FiUserPlus} iconPosition="left">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;