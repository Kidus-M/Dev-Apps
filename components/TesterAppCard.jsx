// components/TesterAppCard.jsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FiBox, FiUser, FiTag, FiDownload, FiExternalLink,
    FiMessageCircle, FiShare2, FiGlobe, FiSmartphone, FiPlusSquare // Added FiPlusSquare for consistency if needed
} from 'react-icons/fi';
import Button from './Button'; // Assuming Button component is in the same directory or correct path
import { useEffect, useState } from 'react';
import { db } from '../utils/firebaseClient'; // Adjust path if needed
import { doc, getDoc } from 'firebase/firestore';

// Function to get app type icon
const getAppTypeIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('android')) return <FiSmartphone className="w-full h-full text-nova-green-500" />;
    if (lowerType.includes('ios')) return <FiSmartphone className="w-full h-full text-nova-gray-500" />;
    if (lowerType.includes('web')) return <FiGlobe className="w-full h-full text-nova-blue-500" />;
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
        if (app?.developerUid) {
          fetchDeveloper();
        } else {
          setDeveloperUsername('N/A');
        }
    }, [app?.developerUid]);

    if (!app) return null;

    const isWebApp = app.appType?.toLowerCase().includes('web');
    const primaryActionText = isWebApp ? "Visit Website" : "Download";
    // --- CORRECTED: Assign the component type, not the JSX element ---
    const PrimaryIconComponent = isWebApp ? FiExternalLink : FiDownload;

    const handlePrimaryAction = (e) => {
        e.stopPropagation();
        if (isWebApp && app.websiteUrl) {
            window.open(app.websiteUrl, '_blank', 'noopener,noreferrer');
        } else if (!isWebApp && app.uploadUrl) {
            window.open(app.uploadUrl, '_blank');
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
            <div className="h-40 w-full bg-nova-gray-100 flex items-center justify-center overflow-hidden p-4">
                {app.iconUrl ? (
                    <img src={app.iconUrl} alt={`${app.appName} icon`} className="max-h-full max-w-full object-contain" />
                ) : (
                    <div className="w-16 h-16 opacity-50">{getAppTypeIcon(app.appType)}</div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-nova-gray-900 truncate mb-1 group-hover:text-nova-blue-700 transition-colors" title={app.appName}>
                    {app.appName || 'Untitled App'}
                </h3>

                <p className="text-xs text-nova-gray-500 mb-3 flex items-center">
                    <FiUser className="w-3 h-3 mr-1.5 text-nova-gray-400"/>
                    {loadingDev ? '...' : (developerUsername || 'Unknown Developer')}
                </p>

                <div className="flex items-center flex-wrap gap-2 text-xs mb-4">
                    {app.version && <span className="badge-outline"><FiTag className="badge-icon" /> v{app.version}</span>}
                    {app.appType && <span className="badge-outline capitalize">{app.appType}</span>}
                </div>

                <div className="mt-auto space-y-2 pt-3">
                    <Button
                        onClick={handlePrimaryAction}
                        variant="primary"
                        className="w-full !font-medium"
                        // --- CORRECTED: Pass the component type ---
                        icon={PrimaryIconComponent}
                        iconPosition="left"
                    >
                        {primaryActionText}
                    </Button>
                    <Button
                        href={`/apps/${app.id}`}
                        variant="secondary"
                        className="w-full !font-medium"
                        // --- CORRECTED: Pass the component type ---
                        icon={FiMessageCircle}
                        iconPosition="left"
                    >
                        View Details & Feedback
                    </Button>
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