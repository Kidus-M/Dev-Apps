// components/Navbar.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Button from './Button';
import { FiLogIn, FiUserPlus, FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  // Scroll detection
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
      setIsMenuOpen(false);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  // Body scroll lock
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    console.log('Toggling menu. Current state:', isMenuOpen, 'New state:', !isMenuOpen); // <-- DEBUG LOG
    setIsMenuOpen(!isMenuOpen);
  };

  const navbarVariants = {
    visible: { y: 0, opacity: 1 },
    hidden: { y: '-100%', opacity: 0 }
  };

  // Revised menu variants for fixed positioning dropdown
  const menuVariants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      y: -10, // Start slightly above its final position
      transition: { duration: 0.15, ease: "easeOut" },
      transitionEnd: { display: 'none' }
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      display: 'block',
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };

  const overlayVariants = {
    closed: { opacity: 0, transitionEnd: { display: 'none' } },
    open: { opacity: 1, display: 'block' }
  };

  // Define navbar heights for positioning the dropdown
  const navHeightMobile = 'h-16'; // Corresponds to h-16 class
  const navHeightDesktop = 'sm:h-20'; // Corresponds to sm:h-20 class
  const dropdownTopMargin = 'mt-2'; // Space between nav and dropdown

  return (
    <>
      {/* --- NAVBAR --- */}
      {/* Lowered Navbar z-index slightly to ensure menu is above */}
      <motion.nav
        variants={navbarVariants}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-40 ${navHeightMobile} ${navHeightDesktop} transition-colors duration-300 ${
          scrolled || isMenuOpen ? 'bg-white/95 backdrop-blur-lg shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Use h-full to ensure content vertically centers within the defined nav height */}
          <div className="flex justify-between items-center h-full">
            {/* Logo */}
            <Link href="/" passHref legacyBehavior>
              <motion.a
                className="text-2xl sm:text-3xl font-bold text-nova-gray-900 transition-colors"
                whileHover={{ scale: 1.03, color: 'var(--color-nova-blue-500)' }}
                style={{ '--color-nova-blue-500': '#4F9FFF' }}
                onClick={() => setIsMenuOpen(false)}
              >
                DevApps
              </motion.a>
            </Link>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button href="/signin" variant="secondary" icon={FiLogIn} iconPosition="left">
                Sign In
              </Button>
              <Button href="/signup" variant="primary" icon={FiUserPlus} iconPosition="left">
                Sign Up
              </Button>
            </div>

            {/* Hamburger Menu Button - Ensure it's clickable */}
            <div className="md:hidden relative z-50"> {/* Added z-index here too */}
              <motion.button
                onClick={toggleMenu}
                className="p-2 rounded-md text-nova-gray-700 hover:text-nova-blue-500 hover:bg-nova-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-nova-blue-500"
                whileTap={{ scale: 0.9 }}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* --- MOBILE MENU & OVERLAY --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={toggleMenu}
              className="fixed inset-0 bg-black/30 z-30 md:hidden" // Lower z-index than menu
            />

            {/* Fixed Dropdown Menu Panel */}
            <motion.div
              key="mobile-menu"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              // --- POSITIONING: Fixed, below navbar height, right aligned ---
              // We combine the heights and margin using calc() for the top offset
              style={{ top: `calc(theme(height.${navHeightMobile.split('-')[1]}) + theme(space.${dropdownTopMargin.split('-')[1]}))` }}
              // Apply responsive top margin for larger small screens if nav height changes
              // This style approach might need refinement based on exact Tailwind theme setup
              // Alternatively, use fixed pixel values if calc() is problematic: top: 'calc(4rem + 0.5rem)' /* 64px + 8px */
              className={`fixed right-4 w-64 /* Fixed, right aligned */
                         origin-top-right mt-16                 /* Animation origin */
                         bg-white rounded-lg shadow-xl ring-1 ring-nova-blue-700 ring-opacity-5 /* Styling */
                         z-50 md:hidden                   /* Highest z-index, hide on desktop */
                        `}
              // Note: The 'top' style might need adjustment if using non-default spacing/heights
              // A simple fixed value might be more reliable: top-[72px] sm:top-[88px]
            >
              <div className="p-4 flex flex-col space-y-3">
                {/* Menu items */}
                <Button href="/signin" variant="secondary" icon={FiLogIn} iconPosition="left" className="w-full justify-center">
                  Sign In
                </Button>
                <Button href="/signup" variant="primary" icon={FiUserPlus} iconPosition="left" className="w-full justify-center">
                  Sign Up
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;