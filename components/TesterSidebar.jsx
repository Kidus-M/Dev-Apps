// components/TesterSidebar.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiGrid, FiCompass, FiClipboard, FiMessageSquare, FiUser, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';

// Simple NavLink Helper (not collapsible for now)
const NavLink = ({ href, icon: Icon, children, exact = false }) => {
    const router = useRouter();
    const isActive = exact ? router.pathname === href : router.pathname.startsWith(href);

    return (
        <Link href={href} passHref legacyBehavior>
            <motion.a
                className={`flex items-center px-4 py-2.5 rounded-lg transition-colors duration-150 group ${
                    isActive
                        ? 'bg-nova-mint-600 text-white font-semibold shadow-md' // Use Mint theme color for testers?
                        : 'text-nova-gray-300 hover:bg-nova-gray-700/50 hover:text-white'
                }`}
                whileHover={{ x: isActive ? 0 : 3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-nova-gray-400 group-hover:text-white'}`} />
                <span className="text-sm font-medium">{children}</span>
            </motion.a>
        </Link>
    );
};

// Tester Sidebar Component
const TesterSidebar = ({ onSignOut }) => {
    return (
        <div className="h-full w-full bg-gradient-to-b from-nova-gray-900 to-nova-gray-950 text-white flex flex-col overflow-y-auto">
            {/* Logo/Brand */}
             <div className="h-16 sm:h-20 flex items-center justify-start px-6 flex-shrink-0">
                 <Link href="/" passHref legacyBehavior>
                    <a className="text-2xl font-bold text-white hover:opacity-80 transition-opacity">DevApps</a>
                </Link>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 px-4 py-4 space-y-2">
                <NavLink href="/tester/dashboard" icon={FiGrid} exact={true}>Dashboard</NavLink>
                <NavLink href="/tester/explore-apps" icon={FiCompass}>Explore Apps</NavLink> {/* Link to shared explore page */}
                <NavLink href="/tester/my-feedback" icon={FiClipboard}>My Feedback</NavLink>
                <NavLink href="/tester/messages" icon={FiMessageSquare}>Messages</NavLink>
                <NavLink href="/tester/account" icon={FiUser}>Account</NavLink>
            </nav>

            {/* Sign Out */}
            <div className="px-4 pb-4 pt-4 border-t border-nova-gray-700/50 mt-auto flex-shrink-0">
                 <button
                     onClick={onSignOut}
                     className="flex items-center w-full px-4 py-2.5 rounded-lg text-nova-gray-300 hover:bg-nova-error-800/50 hover:text-nova-error-100 transition-colors duration-150 group"
                 >
                     <FiLogOut className="w-5 h-5 mr-3 text-nova-gray-400 group-hover:text-nova-error-100" />
                     <span className="text-sm font-medium">Sign Out</span>
                 </button>
            </div>
        </div>
    );
};

export default TesterSidebar;