// components/DeveloperLayout.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from './DashboardSidebar';
import { FiMenu, FiX } from 'react-icons/fi';

const DeveloperLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [sidebarOpen]);

    const sidebarVariants = { /* ... (same as before) ... */ };
    const overlayVariants = { /* ... (same as before) ... */ };

    return (
        // Use flex for the overall structure
        <div className="min-h-screen md:flex bg-nova-gray-100"> {/* Changed to md:flex */}

            {/* --- Desktop Sidebar (Sticky) --- */}
            {/* Hidden on mobile, becomes sticky on md+ */}
            {/* Added h-screen and top-0 for sticky positioning */}
            <div className="hidden md:block md:w-64 md:flex-shrink-0 h-screen sticky top-0">
                {/* Sidebar content itself doesn't need position fixed anymore */}
                <DashboardSidebar />
            </div>

            {/* --- Mobile Sidebar (Fixed - remains same) --- */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            key="overlay-dev" variants={overlayVariants} initial="closed"
                            animate="open" exit="closed" onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 z-30 md:hidden"
                        />
                        {/* Sidebar Panel */}
                        <motion.div
                            key="sidebar-dev" variants={sidebarVariants} initial="closed"
                            animate="open" exit="closed" transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 w-64 z-40 md:hidden" // Fixed position for mobile slide-in
                        >
                            <DashboardSidebar />
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="absolute top-4 right-4 text-nova-gray-300 hover:text-white md:hidden p-1 rounded-full bg-nova-gray-800/50 hover:bg-nova-gray-700"
                                aria-label="Close sidebar"
                            >
                                <FiX size={20}/>
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- Main Content Area --- */}
            {/* flex-1 makes it take remaining space. No more md:pl-64 needed */}
            {/* Added overflow-y-auto for independent scrolling if content exceeds viewport */}
            <div className="flex flex-col flex-1 w-full overflow-y-auto">
                 {/* Mobile Top Bar - Stays sticky */}
                <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-nova-gray-100/80 backdrop-blur-sm"> {/* Added some blur/opacity */}
                    <button
                        type="button"
                        className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-nova-gray-500 hover:text-nova-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-nova-blue-500"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open sidebar"
                    >
                        <FiMenu className="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>

                {/* Content passed from the page */}
                <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
                    {/* Still constrain the content width within the main area */}
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                 </main>
            </div>
        </div>
    );
};

export default DeveloperLayout;