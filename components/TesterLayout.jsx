// components/TesterLayout.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TesterSidebar from './TesterSidebar';
import { FiMenu, FiX } from 'react-icons/fi';
import { auth } from '../utils/firebaseClient'; // Adjust path if needed
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/router';

const TesterLayout = ({ children }) => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const router = useRouter();

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (mobileSidebarOpen) { document.body.style.overflow = 'hidden'; }
        else { document.body.style.overflow = 'unset'; }
        return () => { document.body.style.overflow = 'unset'; };
    }, [mobileSidebarOpen]);

    const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

    // Sign Out Logic
     const handleSignOut = async () => {
        try { await signOut(auth); router.push('/signin'); }
        catch (err) { console.error("Sign out error:", err); }
    };

    const mobileSidebarVariants = { closed: { x: '-100%' }, open: { x: 0 } };
    const overlayVariants = { closed: { opacity: 0, transitionEnd: { display: 'none' } }, open: { opacity: 1, display: 'block' } };

    const desktopSidebarWidth = 'md:w-64'; // Fixed width

    return (
        // --- ADDED: Outer container to center the layout on large screens ---
        // Adjust max-w-screen-2xl if needed (e.g., screen-xl)
        <div className="min-h-screen bg-nova-gray-100">
             {/* --- Mobile Sidebar (Fixed - remains same) --- */}
             <AnimatePresence>
                {mobileSidebarOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            key="overlay-test" variants={overlayVariants} initial="closed"
                            animate="open" exit="closed" onClick={toggleMobileSidebar}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden" /* z-index above content, below panel */
                        />
                        {/* Sidebar Panel */}
                        <motion.div
                            key="sidebar-test" variants={mobileSidebarVariants} initial="closed"
                            animate="open" exit="closed" transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 w-64 z-50 md:hidden" /* Highest z-index */
                        >
                            <TesterSidebar onSignOut={handleSignOut} />
                             <button onClick={toggleMobileSidebar} className="absolute top-4 right-4 text-nova-gray-300 hover:text-white md:hidden p-1 rounded-full bg-nova-gray-800/50 hover:bg-nova-gray-700 z-50" aria-label="Close sidebar">
                                 <FiX size={20}/>
                             </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- Centered Layout Container (for medium screens and up) --- */}
             {/* This centers the entire Sidebar + Content structure */}
             <div className="max-w-screen-2xl mx-auto md:flex"> {/* Use flex here */}

                {/* --- Desktop Sidebar (Sticky within centered container) --- */}
                <div className={`hidden ${desktopSidebarWidth} md:flex flex-shrink-0 h-screen sticky top-0`}>
                    <TesterSidebar onSignOut={handleSignOut} />
                </div>

                {/* --- Main Content Area --- */}
                {/* flex-1 makes it take remaining space WITHIN the centered container */}
                {/* No padding offset needed */}
                <div className="flex flex-col flex-1 w-full min-w-0 overflow-y-auto"> {/* Added min-w-0 for flex */}
                    {/* Mobile Top Bar - Stays sticky */}
                    <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-nova-gray-100/80 backdrop-blur-sm">
                         <button type="button" className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-nova-gray-500 hover:text-nova-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-nova-blue-500" onClick={toggleMobileSidebar} aria-label="Open sidebar">
                             <FiMenu className="h-6 w-6" aria-hidden="true" />
                         </button>
                    </div>

                    {/* Content passed from the page */}
                    <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
                        {/* Still constrain the content's internal width */}
                        <div className="max-w-7xl mx-auto"> {/* Can adjust this internal max-w if needed */}
                            {children}
                        </div>
                    </main>
                 </div>
            </div> {/* End of Centered Layout Container */}
        </div> /* End of Outer Container */
    );
};

export default TesterLayout;