// components/DashboardSidebar.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    FiGrid,        // Dashboard
    FiPackage,     // My Apps
    FiUpload,      // Upload App
    FiEdit3,       // My Blog Posts
    FiRss,         // Feed (or FiHome)
    FiSearch,      // Search Users
    FiUserCheck,   // Following
    FiUsers,       // Followers
    FiCompass,     // Explore Apps
    FiMessageSquare,// Messages
    FiUser,        // Account Settings
    FiLogOut,
    FiPlusSquare       // Sign Out
} from 'react-icons/fi';
import { motion } from 'framer-motion';

// NavLink Helper (No changes needed from before, but included for context)
const NavLink = ({ href, icon: Icon, children, exact = false }) => {
    const router = useRouter();
    // Check for exact match or if the current path starts with the href (for parent routes)
    const isActive = exact ? router.pathname === href : router.pathname.startsWith(href);

    return (
        <Link href={href} passHref legacyBehavior>
            <motion.a
                className={`flex items-center px-4 py-2.5 rounded-lg transition-colors duration-150 group ${ // Slightly faster transition
                    isActive
                        ? 'bg-nova-blue-600 text-white font-semibold shadow-md' // Darker active state
                        : 'text-nova-gray-300 hover:bg-nova-gray-700/50 hover:text-white' // Subtle hover
                }`}
                whileHover={{ x: isActive ? 0 : 3 }} // Subtle indent
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-nova-gray-400 group-hover:text-white'}`} />
                <span className="text-sm font-medium">{children}</span>
            </motion.a>
        </Link>
    );
};

// Updated Sidebar Component
const DashboardSidebar = ({ onSignOut }) => { // Expect onSignOut prop for the button

    return (
        <div className="h-full w-full bg-gradient-to-b from-nova-gray-900 to-nova-gray-950 text-white flex flex-col overflow-y-auto"> {/* Added subtle gradient */}
            {/* Logo/Brand */}
             <div className="h-16 sm:h-20 flex items-center justify-start px-6 flex-shrink-0"> {/* Match Navbar height */}
                 <Link href="/" passHref legacyBehavior>
                    <a className="text-2xl font-bold text-white hover:opacity-80 transition-opacity">
                        DevApps
                    </a>
                </Link>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 px-4 py-4 space-y-4">

                 {/* Core & Content Section */}
                 <div className="space-y-1">
                      <h3 className="px-4 text-xs font-semibold text-nova-gray-500 uppercase tracking-wider mb-1">Overview</h3>
                      <NavLink href="/developer/dashboard" icon={FiGrid} exact={true}>Dashboard</NavLink>
                      <NavLink href="/developer/feed" icon={FiRss}>Feed</NavLink>
                      <NavLink href="/developer/my-apps" icon={FiPackage}>My Apps</NavLink>
                      <NavLink href="/developer/blog" icon={FiEdit3}>My Blog Posts</NavLink>
                 </div>

                 {/* Community Section */}
                  <div className="space-y-1 pt-2">
                     <h3 className="px-4 text-xs font-semibold text-nova-gray-500 uppercase tracking-wider mb-1">Community</h3>
                     <NavLink href="/developer/search" icon={FiSearch}>Search Users</NavLink>
                     <NavLink href="/developer/following" icon={FiUserCheck}>Following</NavLink>
                     <NavLink href="/developer/followers" icon={FiUsers}>Followers</NavLink>
                     <NavLink href="/apps/browse" icon={FiCompass}>Explore Apps</NavLink>
                     {/* <NavLink href="/blog/browse" icon={FiCompass}>Explore Posts</NavLink> */}
                 </div>

                 {/* Actions Section */}
                 <div className="space-y-1 pt-2">
                     <h3 className="px-4 text-xs font-semibold text-nova-gray-500 uppercase tracking-wider mb-1">Create</h3>
                     <NavLink href="/developer/upload-app" icon={FiUpload}>Upload App</NavLink>
                     <NavLink href="/developer/new-post" icon={FiPlusSquare}>Write Post</NavLink>
                 </div>


                  {/* Communication Placeholder */}
                  <div className="space-y-1 pt-2">
                       <h3 className="px-4 text-xs font-semibold text-nova-gray-500 uppercase tracking-wider mb-1">Connect</h3>
                       <NavLink href="/developer/messages" icon={FiMessageSquare}>Messages</NavLink>
                   </div>

            </nav>

            {/* Account & Sign Out at the bottom */}
            <div className="px-4 pb-4 pt-4 border-t border-nova-gray-700/50 space-y-1 mt-auto flex-shrink-0">
                <NavLink href="/developer/account" icon={FiUser}>Account Settings</NavLink>
                 <button
                     onClick={onSignOut} // Use the passed function
                     className="flex items-center w-full px-4 py-2.5 rounded-lg text-nova-gray-300 hover:bg-nova-error-800/50 hover:text-nova-error-100 transition-colors duration-150 group" // Error colors for signout hover
                 >
                     <FiLogOut className="w-5 h-5 mr-3 text-nova-gray-400 group-hover:text-nova-error-100" />
                     <span className="text-sm font-medium">Sign Out</span>
                 </button>
            </div>
        </div>
    );
};

export default DashboardSidebar;