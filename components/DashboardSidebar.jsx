// components/DashboardSidebar.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiGrid, FiPackage, FiUpload, FiEdit3, FiSearch, FiUser, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion'; // Import motion for potential hover effects

// Helper function to determine if a link is active
const NavLink = ({ href, icon: Icon, children }) => {
    const router = useRouter();
    const isActive = router.pathname === href;

    return (
        <Link href={href} passHref legacyBehavior>
            <motion.a
                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                        ? 'bg-nova-blue-500 text-white shadow-lg'
                        : 'text-nova-gray-300 hover:bg-nova-gray-700 hover:text-white'
                }`}
                whileHover={{ x: isActive ? 0 : 5 }} // Slight indent on hover for non-active items
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-nova-gray-400 group-hover:text-white'}`} />
                <span className="text-sm font-medium">{children}</span>
            </motion.a>
        </Link>
    );
};


const DashboardSidebar = ({ onSignOut }) => {
    // Add onSignOut prop if sign out button is here
    // Or handle sign out in the top bar / main content area instead

    return (
        <div className="h-full w-full bg-nova-gray-900 text-white flex flex-col p-4 space-y-2 overflow-y-auto">
            {/* Logo/Brand Placeholder - Placed above links */}
             <div className="mb-6 px-2 py-4">
                 <Link href="/" passHref legacyBehavior>
                    <a className="text-2xl font-bold text-white hover:text-nova-blue-300 transition-colors">
                        DevApps
                    </a>
                </Link>
            </div>

            <nav className="flex-grow">
                {/* Navigation Links */}
                <NavLink href="/developer/dashboard" icon={FiGrid}>Dashboard</NavLink>
                <NavLink href="/developer/my-apps" icon={FiPackage}>My Apps</NavLink>
                <NavLink href="/developer/upload-app" icon={FiUpload}>Upload App</NavLink>
                <NavLink href="/developer/blog" icon={FiEdit3}>Blog Posts</NavLink>
                <NavLink href="/developer/search" icon={FiSearch}>Search Users</NavLink>
                 <NavLink href="/developer/account" icon={FiUser}>Account Settings</NavLink>
            </nav>

            {/* Optional: Sign Out button can live here or in the main content header */}
            {/* <div className="mt-auto pt-4 border-t border-nova-gray-700">
                 <button
                     onClick={onSignOut}
                     className="flex items-center w-full px-4 py-3 rounded-lg text-nova-gray-300 hover:bg-nova-gray-700 hover:text-white transition-colors duration-200"
                 >
                     <FiLogOut className="w-5 h-5 mr-3 text-nova-gray-400" />
                     <span className="text-sm font-medium">Sign Out</span>
                 </button>
             </div> */}
        </div>
    );
};

export default DashboardSidebar;