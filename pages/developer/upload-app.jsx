// pages/developer/upload-app.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient'; // Adjusted path
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
// --- Supabase Storage Imports ---
import { supabase } from '../../utils/supabaseClient'; // Use the same client for storage
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout';
import { FiUploadCloud, FiXCircle, FiCheckCircle, FiLoader, FiInfo, FiTag, FiFileText, FiType, FiBox, FiLink, FiAlertCircle, FiPlusSquare } from 'react-icons/fi'; // Added necessary icons
// --- UUID for filenames ---
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion'; // For animations
export default function UploadAppPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // Form State
    const [appName, setAppName] = useState('');
    const [appType, setAppType] = useState(''); // e.g., 'Web', 'Mobile - Android', etc.
    const [version, setVersion] = useState('');
    const [description, setDescription] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState(''); // State for website URL
    const [file, setFile] = useState(null); // The actual file object
    const [fileName, setFileName] = useState(''); // To display selected file name

    // Operation State
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const router = useRouter();

    // --- Auth & Profile Check ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const profileDocRef = doc(db, "profiles", currentUser.uid);
                try {
                    const profileSnap = await getDoc(profileDocRef);
                    if (profileSnap.exists() && profileSnap.data().role === 'developer') {
                        setProfile(profileSnap.data());
                        setError(null);
                    } else {
                        setError("Access denied. Developer profile not found or invalid role.");
                        setProfile(null);
                        router.replace('/signin');
                        return;
                    }
                } catch (err) {
                    setError("Failed to load profile data.");
                    console.error("Profile fetch error:", err);
                }
            } else {
                setUser(null);
                setProfile(null);
                router.replace('/signin');
                return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]);

    // --- File Selection Handler ---
    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const maxSize = 100 * 1024 * 1024; // 100 MB in bytes
            if (selectedFile.size > maxSize) {
                setError("File size exceeds 100MB limit.");
                setFile(null);
                setFileName('');
                e.target.value = null; // Reset file input
                return;
            }
            // Add specific file type checks here if needed based on selected appType
            // Example: if (appType === 'Mobile - Android' && !selectedFile.name.toLowerCase().endsWith('.apk')) { ... }

            setError(null);
            setFile(selectedFile);
            setFileName(selectedFile.name);
            console.log("File selected:", selectedFile);
        } else {
            setFile(null);
            setFileName('');
        }
    };

    // --- Form Submission Handler ---
    const handleUploadAndSave = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        // --- Input Validation Based on App Type ---
        const isWebType = appType === 'Web';
        if (!user || !profile || profile.role !== 'developer') { setError("Authentication error."); return; }
        if (!appName.trim() || !appType.trim() || !version.trim()) { setError("Please fill in App Name, App Type, and Version."); return; }

        if (isWebType) {
            if (!websiteUrl.trim()) { setError("Website URL is required for Web applications."); return; }
            // Basic URL format check
            if (!/^https?:\/\/.+/.test(websiteUrl.trim())) { setError("Please enter a valid Website URL (starting with http:// or https://)."); return; }
        } else { // For Mobile/Desktop types
            if (!file) { setError("An application file is required for Mobile/Desktop types."); return; }
            // Add specific file type validation based on appType if desired here
        }
        // --- End Validation ---

        setIsUploading(!isWebType && file); // Only true if uploading a file
        setIsSaving(false);

        let uploadedFilePath = null;
        let publicUrl = null;

        try {
            // --- 1. Upload to Supabase Storage (Conditional) ---
            if (!isWebType && file) {
                setIsUploading(true);
                const fileExtension = file.name.split('.').pop();
                const uniqueFileName = `${uuidv4()}.${fileExtension}`;
                const filePath = `public/apps/${user.uid}/${uniqueFileName}`;

                console.log(`Uploading to Supabase Storage: ${filePath}`);
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('app-files') // Your bucket name
                    .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });

                if (uploadError) throw uploadError; // Throw error to be caught below

                uploadedFilePath = uploadData?.path;
                console.log('Supabase upload successful:', uploadData);

                // --- 2. Get Public URL (Conditional) ---
                if (uploadedFilePath) {
                    const { data: urlData } = supabase.storage.from('app-files').getPublicUrl(uploadedFilePath);
                    publicUrl = urlData?.publicUrl;
                    if (publicUrl) console.log('Supabase Public URL:', publicUrl);
                    else console.warn("Could not get public URL. Check bucket settings/policies or file path.");
                } else {
                    throw new Error("Upload succeeded but file path was not returned.");
                }
                setIsUploading(false); // Upload finished
            }
            // If it's a Web type, publicUrl remains null

            // --- 3. Save Metadata to Firestore ---
            setIsSaving(true);
            console.log('Saving metadata to Firestore...');

            const appData = {
                developerUid: user.uid,
                appName: appName.trim(),
                appType: appType.trim(),
                version: version.trim(),
                description: description.trim(),
                status: 'beta', // Default status
                // Conditionally add URL fields
                websiteUrl: isWebType ? websiteUrl.trim() : null,
                uploadUrl: !isWebType && publicUrl ? publicUrl : null, // Download URL for non-web apps
                storagePath: !isWebType && uploadedFilePath ? uploadedFilePath : null, // Internal path for non-web apps
                // Conditionally add file info
                ...( !isWebType && file && {
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                 }),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, "apps"), appData);
            console.log("Firestore document written with ID: ", docRef.id);

            // --- Success ---
            setIsSaving(false);
            setSuccessMessage(`"${appName}" details saved successfully! You can view it in 'My Apps'.`);
            // Reset form
            setAppName(''); setAppType(''); setVersion(''); setDescription(''); setWebsiteUrl(''); setFile(null); setFileName('');
            // Optionally redirect after a delay
            // setTimeout(() => router.push('/developer/my-apps'), 2500);

        } catch (err) {
             console.error("Upload or save process failed:", err);
            let friendlyError = `Operation failed: ${err.message}`;
            if (err?.message?.includes('Storage') || err?.details?.includes('bucket_id')) { // More specific error checks
                 friendlyError = `File upload failed: ${err.message}. Check storage policies, bucket name ('app-files'), or connection.`;
            } else if (err?.message?.includes('firestore')) {
                 friendlyError = `Failed to save app details: ${err.message}. Check Firestore rules.`;
            } else if (err instanceof Error){ // Fallback for generic errors
                 friendlyError = `An error occurred: ${err.message}`;
            } else {
                 friendlyError = `An unknown error occurred.`;
            }
            setError(friendlyError);
            setIsUploading(false);
            setIsSaving(false);
            // TODO: Consider deleting the uploaded Supabase file if Firestore save fails (requires storing uploadedFilePath earlier)
        }
    };


    // --- Loading/Auth Check ---
    if (loadingUser) {
        return ( <div className="min-h-screen flex items-center justify-center">Loading...</div> );
    }
     if (!user || !profile) {
         return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500">{error || "Authentication required."}</p>
            </div>
         );
     }


    const isWebTypeSelected = appType === 'Web';

    return (
        <DeveloperLayout>
            <Head><title>Upload New App - DevApps Developer</title></Head>

             {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900">Upload New Application</h1>
                 <Link href="/developer/my-apps" className="text-sm text-nova-blue-600 hover:underline mt-2 sm:mt-0">
                      &larr; Back to My Apps
                 </Link>
            </div>

            {/* Form Area */}
            <div className="bg-white p-6 md:p-8 rounded-lg shadow border border-nova-gray-100">
                 {/* Display Status/Error Messages */}
                {successMessage && (
                    <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="mb-6 p-4 text-sm text-nova-success-700 bg-nova-success-50 rounded-lg border border-nova-success-200 flex items-center space-x-2">
                        <FiCheckCircle className="w-5 h-5"/><span>{successMessage}</span>
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="mb-6 p-4 text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center space-x-2">
                        <FiAlertCircle className="w-5 h-5 flex-shrink-0"/> <span className="break-words">{error}</span>
                    </motion.div>
                )}

                <form onSubmit={handleUploadAndSave} className="space-y-6">
                    {/* App Name */}
                    <div>
                        <label htmlFor="appName" className="block text-sm font-medium text-nova-gray-700 mb-1">
                           <FiBox className="inline-block mr-1 mb-0.5 w-4 h-4"/> App Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" name="appName" id="appName" required maxLength={100}
                            value={appName} onChange={(e) => setAppName(e.target.value)}
                            className="w-full px-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150" placeholder="My Awesome Application"
                            disabled={isUploading || isSaving}
                        />
                    </div>

                     {/* App Type & Version (Inline) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="appType" className="block text-sm font-medium text-nova-gray-700 mb-1">
                               <FiType className="inline-block mr-1 mb-0.5 w-4 h-4"/> App Type <span className="text-red-500">*</span>
                            </label>
                             <select
                                name="appType" id="appType" required value={appType}
                                onChange={(e) => {
                                    setAppType(e.target.value);
                                    // Reset conditional fields when type changes
                                    setFile(null);
                                    setFileName('');
                                    setWebsiteUrl('');
                                    setError(null); // Clear validation errors
                                }}
                                className="w-full px-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150 bg-white"
                                disabled={isUploading || isSaving}
                             >
                                 <option value="" disabled>Select type...</option>
                                 <option value="Web">Web Application</option>
                                 <option value="Mobile - Android">Mobile - Android (.apk)</option>
                                 <option value="Mobile - iOS">Mobile - iOS (.ipa)</option>
                                 <option value="Desktop - Windows">Desktop - Windows</option>
                                 <option value="Desktop - macOS">Desktop - macOS</option>
                                 <option value="Desktop - Linux">Desktop - Linux</option>
                                 <option value="Other">Other</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="version" className="block text-sm font-medium text-nova-gray-700 mb-1">
                                <FiTag className="inline-block mr-1 mb-0.5 w-4 h-4"/> Version <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text" name="version" id="version" required maxLength={30} // Increased length slightly
                                value={version} onChange={(e) => setVersion(e.target.value)}
                                className="w-full px-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150" placeholder="e.g., 1.0.0-beta"
                                disabled={isUploading || isSaving}
                            />
                        </div>
                    </div>

                     {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-nova-gray-700 mb-1">
                           <FiFileText className="inline-block mr-1 mb-0.5 w-4 h-4"/> Description <span className="text-nova-gray-400 text-xs">(Optional)</span>
                        </label>
                        <textarea
                            id="description" name="description" rows="4"
                             value={description} onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150"
                            placeholder="Briefly describe your application, its purpose, and what testers should focus on."
                            disabled={isUploading || isSaving}
                        ></textarea>
                    </div>

                    {/* --- Conditional Input: Website URL (for Web type) --- */}
                    {appType === 'Web' && (
                         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="transition-all duration-300 ease-out">
                            <label htmlFor="websiteUrl" className="block text-sm font-medium text-nova-gray-700 mb-1">
                               <FiLink className="inline-block mr-1 mb-0.5 w-4 h-4"/> Website URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url" name="websiteUrl" id="websiteUrl" required={isWebTypeSelected}
                                value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                                className="w-full input-style" placeholder="https://yourapp.example.com"
                                disabled={isUploading || isSaving}
                            />
                         </motion.div>
                    )}

                    {/* --- Conditional Input: File Upload (for non-Web types) --- */}
                    {appType && appType !== 'Web' && (
                         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="transition-all duration-300 ease-out">
                            <label className="block text-sm font-medium text-nova-gray-700 mb-1">
                                Application File <span className="text-red-500">*</span> <span className="text-xs text-nova-gray-400">(Max 100MB)</span>
                            </label>
                            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-nova-gray-300 border-dashed rounded-md hover:border-nova-blue-400 transition-colors ${isUploading || isSaving ? 'bg-nova-gray-50 opacity-70' : 'bg-white'}`}>
                                <div className="space-y-1 text-center">
                                    <FiUploadCloud className={`mx-auto h-12 w-12 ${fileName ? 'text-nova-success-500' : 'text-nova-gray-400'}`} />
                                    <div className="flex text-sm text-nova-gray-600 justify-center">
                                    <label htmlFor="file-upload" className={`relative cursor-pointer rounded-md font-medium text-nova-blue-600 hover:text-nova-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-nova-blue-500 px-1 ${isUploading || isSaving ? 'pointer-events-none' : 'bg-white'}`}>
                                        <span>{fileName ? 'Change file' : 'Upload a file'}</span>
                                        <input id="file-upload" name="file-upload" type="file" required={!isWebTypeSelected} className="sr-only" onChange={handleFileChange} disabled={isUploading || isSaving} />
                                    </label>
                                    {/* <p className="pl-1">or drag and drop</p> */}
                                    </div>
                                    {fileName ? (
                                        <p className="text-xs text-nova-gray-500 font-medium mt-2 truncate px-2" title={fileName}>{fileName}</p>
                                    ) : (
                                        <p className="text-xs text-nova-gray-500">Select relevant file type (APK, IPA, ZIP, etc.)</p>
                                    )}
                                </div>
                            </div>
                         </motion.div>
                    )}

                     {/* Loading/Progress Indicator */}
                    {(isUploading || isSaving) && (
                         <div className="flex items-center space-x-2 text-sm text-nova-blue-600">
                             <FiLoader className="animate-spin w-4 h-4" />
                             <span>{isUploading ? 'Uploading file to secure storage...' : 'Saving application details...'}</span>
                         </div>
                    )}

                    {/* Submit Button */}
                     <div className="pt-4 flex justify-end">
                         <Button
                            type="submit"
                            variant="primary"
                            disabled={
                                isUploading || isSaving || !appName.trim() || !appType || !version.trim() ||
                                (isWebTypeSelected ? !websiteUrl.trim() : !file) // Check required field based on type
                             }
                            icon={ isUploading || isSaving ? null : FiUploadCloud}
                        >
                            {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save Application'}
                        </Button>
                    </div>
                </form>
            </div>
            {/* Helper for input style reuse */}
            <style jsx>{`
                .input-style {
                    @apply block w-full px-3 py-2 border border-nova-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150 ease-in-out sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed;
                }
            `}</style>
        </DeveloperLayout>
    );
}