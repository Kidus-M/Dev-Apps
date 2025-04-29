// components/AppCard.jsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiBox, FiTag, FiTerminal, FiEdit, FiEye, FiSmartphone, FiGlobe, FiUser } from 'react-icons/fi';
import Button from './Button';
// --- Firebase Imports (needed for fetching profile) ---
import { useEffect, useState } from 'react';
import { db } from '../utils/firebaseClient'; // Adjust path if needed
import { doc, getDoc } from 'firebase/firestore';
// Function to get a placeholder icon based on app type (simple example)
const getAppTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
        case 'mobile - android':
        case 'mobile - ios':
        case 'mobile':
            return <FiSmartphone className="w-full h-full text-nova-gray-400" />;
        case 'web':
            return <FiGlobe className="w-full h-full text-nova-gray-400" />;
        case 'desktop':
             return <FiTerminal className="w-full h-full text-nova-gray-400" />;
        default:
            return <FiBox className="w-full h-full text-nova-gray-400" />;
    }
};

const AppCard = ({ app, showDevActions = false }) => {
    // app object structure expected (adjust based on your Firestore model):
    // { id: 'firestore-doc-id', appName: '...', version: '...', status: '...', type: '...', iconUrl: '...', developerUid: '...' }
    const [developerUsername, setDeveloperUsername] = useState('');
    const [loadingDev, setLoadingDev] = useState(false);

    useEffect(() => {
        const fetchDeveloper = async () => {
            if (app?.developerUid) {
                setLoadingDev(true);
                const profileRef = doc(db, 'profiles', app.developerUid);
                try {
                    const docSnap = await getDoc(profileRef);
                    if (docSnap.exists()) {
                        setDeveloperUsername(docSnap.data().username || `Dev-${app.developerUid.substring(0,4)}`);
                    } else {
                         setDeveloperUsername(`Dev-${app.developerUid.substring(0,4)}`); // Fallback
                    }
                } catch (error) {
                    console.error("Error fetching developer profile for card:", error);
                    setDeveloperUsername('Unknown Dev'); // Error state
                } finally {
                    setLoadingDev(false);
                }
            }
        };
        fetchDeveloper();
    }, [app?.developerUid]); 

    if (!app) return null;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const hoverVariants = {
        hover: { scale: 1.03, transition: { duration: 0.2 } }
    };
    const cardLink = showDevActions ? `/developer/apps/${app.id}/edit` : `/apps/${app.id}`;
    return (
        <Link href={cardLink} passHref legacyBehavior>
             <motion.a
                variants={cardVariants}
                whileHover={showDevActions ? "hover" : { scale: 1.02 }} // Slightly different hover for browse?
                className="block bg-white rounded-lg shadow border border-nova-gray-100 overflow-hidden h-full group transition-shadow hover:shadow-md" // Removed flex, added block/h-full
             >
            {/* App Icon Placeholder/Image */}
            <div className="h-32 w-full bg-nova-gray-100 flex items-center justify-center overflow-hidden">
                {app.iconUrl ? (
                    <img src={app.iconUrl} alt={`${app.appName} icon`} className="object-cover h-full w-full" />
                ) : (
                    <div className="w-16 h-16 opacity-50">
                         {getAppTypeIcon(app.type)}
                     </div>
                )}
            </div>

            {/* App Info */}
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-nova-gray-800 truncate mb-1" title={app.appName}>
                    {app.appName || 'Untitled App'}
                </h3>
                <div className="flex items-center text-xs text-nova-gray-500 mb-3 space-x-2">
                    {app.version && (
                        <span className="flex items-center bg-nova-gray-100 px-1.5 py-0.5 rounded">
                            <FiTag className="w-3 h-3 mr-1" /> v{app.version}
                        </span>
                    )}
                     {app.type && (
                         <span className="flex items-center bg-nova-gray-100 px-1.5 py-0.5 rounded capitalize">
                           {/* Use a simple icon here too? */}
                           {app.type}
                        </span>
                    )}
                     {app.status && (
                         <span className={`px-1.5 py-0.5 rounded capitalize ${
                            app.status === 'active' ? 'bg-nova-success-100 text-nova-success-800' :
                            app.status === 'inactive' ? 'bg-nova-gray-200 text-nova-gray-600' :
                            'bg-nova-warning-100 text-nova-warning-800' // Default/beta etc.
                         }`}>
                           {app.status}
                        </span>
                    )}
                </div>

                {/* Placeholder for description or stats */}
                {/* <p className="text-sm text-nova-gray-600 mb-4 line-clamp-2">
                    {app.description || 'No description yet.'}
                </p> */}

                {/* Actions - push content down */}
                <div className="mt-auto pt-3 flex justify-end space-x-2 border-t border-nova-gray-100">
                    {/* Links will go to future detail/edit pages */}
                    {/* Update hrefs when those pages are ready */}
                    <Button
                        href={`/developer/apps/${app.id}/edit`} // Use Firestore doc ID
                        variant="secondary"
                        className="!text-xs !px-3 !py-1" // Make buttons smaller
                        icon={FiEdit}
                    >
                        Edit
                    </Button>
                     <Button
                        href={`/apps/${app.id}`} // Public app view page
                        variant="primary"
                        className="!text-xs !px-3 !py-1" // Make buttons smaller
                        icon={FiEye}
                     >
                        View
                    </Button>
                    {/* Delete button would need confirmation logic */}
                    {/* <Button variant="danger" className="!text-xs !px-3 !py-1" icon={FiTrash}>Delete</Button> */}
                </div>
            </div>
            </motion.a>
            </Link>
    );
};

export default AppCard;