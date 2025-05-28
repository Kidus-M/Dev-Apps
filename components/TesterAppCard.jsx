// components/TesterAppCard.jsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiBox, FiUser, FiTag, FiDownload, FiExternalLink, FiMessageCircle, FiShare2, FiGlobe, FiSmartphone } from 'react-icons/fi';
import Button from './Button';
import { useEffect, useState } from 'react';
import { db } from '../utils/firebaseClient'; // Adjust path if needed
import { doc, getDoc } from 'firebase/firestore';

// Function to get app type icon (can be shared or defined here)
const getAppTypeIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('android')) return <FiSmartphone className="w-full h-full text-nova-green-500" />;
    if (lowerType.includes('ios')) return <FiSmartphone className="w-full h-full text-nova-gray-500" />;
    if (lowerType.includes('web')) return <FiGlobe className="w-full h-full text-nova-blue-500" />;
    // Add more types as needed
    return <FiBox className="w-full h-full text-nova-purple-500" />;
};

const TesterAppCard = ({ app }) => {
    const [developerUsername, setDeveloperUsername] = useState('Loading dev...');
    const [loadingDev, setLoadingDev] = useState(false);

    useEffect(() => {
        const fetchDeveloper = async () => {
            if (app?.developerUid) {
                setLoadingDev(true);
                const profileRef = doc(db, 'profiles', app.developerUid);
                try {
                    const docSnap = await getDoc(profileRef);
                    if (docSnap.exists()) {
                        setDeveloperUsername(docSnap.data().username || `Dev-${app.developerUid.substring(0, 4)}`);
                    } else {
                        setDeveloperUsername(`Dev-${app.developerUid.substring(0, 4)}`);
                    }
                } catch (error) {
                    console.error("Error fetching developer profile for card:", error);
                    setDeveloperUsername('Unknown Dev');
                } finally {
                    setLoadingDev(false);
                }
            }
        };
        if (app?.developerUid) { // Check if app and developerUid exist before fetching
          fetchDeveloper();
        } else {
          setDeveloperUsername('N/A'); // Handle case where app or developerUid might be missing
        }
    }, [app?.developerUid]);

    if (!app) return null;

    const isWebApp = app.appType?.toLowerCase().includes('web');
    const primaryActionText = isWebApp ? "Visit Website" : "Download";
    const primaryActionIcon = isWebApp ? <FiExternalLink /> : <FiDownload />;

    const handlePrimaryAction = (e) => {
        // This button is not a NextLink, so stop propagation if card is wrapped in Link
        e.stopPropagation();
        if (isWebApp && app.websiteUrl) {
            window.open(app.websiteUrl, '_blank', 'noopener,noreferrer');
        } else if (!isWebApp && app.uploadUrl) {
            window.open(app.uploadUrl, '_blank'); // Let browser handle download
        } else {
            alert("App URL not available.");
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={cardVariants}
            className="bg-white rounded-xl shadow-lg border border-nova-gray-100 overflow-hidden flex flex-col h-full group transition-all duration-300 hover:shadow-xl"
        >
            {/* App Icon Placeholder/Image */}
            <div className="h-40 w-full bg-nova-gray-100 flex items-center justify-center overflow-hidden p-4">
                {app.iconUrl ? (
                    <img src={app.iconUrl} alt={`${app.appName} icon`} className="max-h-full max-w-full object-contain" />
                ) : (
                    <div className="w-16 h-16 opacity-50">{getAppTypeIcon(app.appType)}</div>
                )}
            </div>

            {/* App Info */}
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-nova-gray-900 truncate mb-1 group-hover:text-nova-blue-700 transition-colors" title={app.appName}>
                    {app.appName || 'Untitled App'}
                </h3>

                {/* Developer Info */}
                <p className="text-xs text-nova-gray-500 mb-3 flex items-center">
                    <FiUser className="w-3 h-3 mr-1.5 text-nova-gray-400"/>
                    {loadingDev ? '...' : (developerUsername || 'Unknown Developer')}
                </p>

                {/* Version/Type Badges */}
                <div className="flex items-center flex-wrap gap-2 text-xs mb-4">
                    {app.version && <span className="badge-outline"><FiTag className="badge-icon" /> v{app.version}</span>}
                    {app.appType && <span className="badge-outline capitalize">{app.appType}</span>}
                </div>

                {/* Placeholder for a short description or tagline if available */}
                {/* <p className="text-sm text-nova-gray-600 mb-4 line-clamp-2">{app.shortDescription || "No description."}</p> */}

                {/* Actions Area - Pushed to the bottom */}
                <div className="mt-auto space-y-2 pt-3">
                    <Button
                        onClick={handlePrimaryAction}
                        variant="primary"
                        className="w-full !font-medium"
                        icon={primaryActionIcon}
                        iconPosition="left"
                    >
                        {primaryActionText}
                    </Button>
                    <Button
                        href={`/apps/${app.id}`} // Link to the app detail page
                        variant="secondary"
                        className="w-full !font-medium"
                        icon={<FiMessageCircle />}
                        iconPosition="left"
                    >
                        View Details & Feedback
                    </Button>
                    {/* Optional Share Button Placeholder */}
                    {/* <Button variant="text" className="w-full !text-xs" icon={<FiShare2/>}>Share</Button> */}
                </div>
            </div>
            <style jsx>{`
                .badge-outline { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-nova-gray-300 text-nova-gray-600 bg-white; }
                .badge-icon { @apply w-3 h-3 mr-1; }
            `}</style>
        </motion.div>
    );
};

export default TesterAppCard;