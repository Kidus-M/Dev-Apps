// components/DeveloperLayout.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from './DashboardSidebar';
import { FiMenu, FiX } from 'react-icons/fi';

const DeveloperLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar on route change (optional)
    // useEffect(() => {
    //     setSidebarOpen(false);
    // }, [router.pathname]);

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

    const sidebarVariants = {
        closed: { x: '-100%' },
        open: { x: 0 }
    };

    const overlayVariants = {
        closed: { opacity: 0, transitionEnd: { display: 'none' } },
        open: { opacity: 1, display: 'block' }
    };

    return (
        <div className="min-h-screen flex bg-nova-gray-100"> {/* Main background */}
            {/* --- Desktop Sidebar --- */}
            <div className="hidden md:flex md:w-64 md:flex-shrink-0">
                <div className="flex flex-col w-64 fixed inset-y-0"> {/* Fixed position */}
                    <DashboardSidebar />
                </div>
            </div>

            {/* --- Mobile Sidebar --- */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            key="overlay-dev"
                            variants={overlayVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 z-30 md:hidden"
                        />
                        {/* Sidebar Panel */}
                        <motion.div
                            key="sidebar-dev"
                            variants={sidebarVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 w-64 z-40 md:hidden" // Fixed position
                        >
                            <DashboardSidebar />
                            {/* Optional Close Button inside sidebar */}
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
            <div className="flex flex-col flex-1 w-full md:pl-64"> {/* Add left padding on desktop to offset fixed sidebar */}
                 {/* Mobile Top Bar */}
                <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-nova-gray-100">
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
                     {children}
                 </main>
            </div>
        </div>
    );
};

export default DeveloperLayout;