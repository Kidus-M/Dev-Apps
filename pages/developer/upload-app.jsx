// pages/developer/upload-app.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // For linking back maybe
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient'; // Adjusted path
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
// --- Supabase Storage Imports ---
import { supabase } from '../../utils/supabaseClient'; // Use the same client for storage
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout';
import { FiUploadCloud, FiXCircle, FiCheckCircle, FiLoader, FiInfo, FiTag, FiFileText, FiType, FiBox } from 'react-icons/fi';
// --- UUID for filenames ---
import { v4 as uuidv4 } from 'uuid';

export default function UploadAppPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // Form State
    const [appName, setAppName] = useState('');
    const [appType, setAppType] = useState(''); // e.g., 'Web', 'Mobile - Android', 'Desktop - Windows'
    const [version, setVersion] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null); // The actual file object
    const [fileName, setFileName] = useState(''); // To display selected file name

    // Operation State
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    // const [uploadProgress, setUploadProgress] = useState(0); // Progress tracking is complex with fetch-based client

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
                        setError(null); // Clear error if profile found
                    } else {
                        setError("Access denied. Developer profile not found or invalid role.");
                        setProfile(null); // Ensure profile is nullified
                        router.replace('/signin'); // Redirect if not a valid developer
                        return;
                    }
                } catch (err) {
                    setError("Failed to load profile data.");
                    console.error("Profile fetch error:", err);
                }
            } else {
                setUser(null);
                setProfile(null);
                router.replace('/signin'); // Redirect if not logged in
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
             // Basic client-side validation (example: limit to 100MB)
            const maxSize = 100 * 1024 * 1024; // 100 MB in bytes
            if (selectedFile.size > maxSize) {
                setError("File size exceeds 100MB limit.");
                setFile(null);
                setFileName('');
                e.target.value = null; // Reset file input
                return;
            }
            // Add file type checks if needed (e.g., specific extensions)
            // if (!['.apk', '.ipa', '.zip', '.exe'].some(ext => selectedFile.name.toLowerCase().endsWith(ext))) { ... }

            setError(null); // Clear previous errors
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

        if (!file) {
            setError("Please select an application file to upload.");
            return;
        }
        if (!user || !profile || profile.role !== 'developer') {
            setError("Authentication error. Please sign in as a developer.");
            return;
        }
         if (!appName.trim() || !appType.trim() || !version.trim()) {
            setError("Please fill in App Name, App Type, and Version.");
            return;
        }


        setIsUploading(true);
        setIsSaving(false); // Ensure saving state is reset

        // --- 1. Upload to Supabase Storage ---
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        // Structure: public/apps/{userId}/{uuid}.{ext} - Ensure policies match!
        const filePath = `public/apps/${user.uid}/${uniqueFileName}`;
        let uploadedFilePath = null;
        let publicUrl = null;

        try {
            console.log(`Uploading to Supabase Storage: ${filePath}`);
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('app-files') // Your bucket name
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false, // Don't replace existing file with same name (uuid makes this unlikely anyway)
                    contentType: file.type // Pass file MIME type
                });

            if (uploadError) {
                throw uploadError; // Throw error to be caught below
            }

            uploadedFilePath = uploadData?.path; // Path within the bucket
            console.log('Supabase upload successful:', uploadData);

            // --- 2. Get Public URL (if bucket is public) ---
            if (uploadedFilePath) {
                 const { data: urlData } = supabase.storage
                    .from('app-files')
                    .getPublicUrl(uploadedFilePath);

                 if (urlData?.publicUrl) {
                    publicUrl = urlData.publicUrl;
                    console.log('Supabase Public URL:', publicUrl);
                 } else {
                    console.warn("Could not get public URL. Check bucket settings/policies or file path.");
                    // Decide how to handle this - maybe proceed without URL or show warning?
                    // For now, we'll proceed but log a warning.
                 }

            } else {
                 throw new Error("Upload succeeded but file path was not returned.");
            }


            // --- 3. Save Metadata to Firestore ---
            setIsUploading(false); // Upload finished
            setIsSaving(true); // Now saving metadata
            console.log('Saving metadata to Firestore...');

            const appData = {
                developerUid: user.uid,
                appName: appName.trim(),
                appType: appType.trim(),
                version: version.trim(),
                description: description.trim(),
                status: 'beta', // Default status? Or add a form field
                // storagePath: uploadedFilePath, // Store the internal path
                uploadUrl: publicUrl, // Store the public download URL (if available)
                fileName: file.name, // Original filename
                fileSize: file.size,
                fileType: file.type,
                // Add other fields as needed: tags, iconUrl (needs another upload process), etc.
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(), // Set initially, update logic needed elsewhere
            };

            const docRef = await addDoc(collection(db, "apps"), appData);
            console.log("Firestore document written with ID: ", docRef.id);

            // --- Success ---
            setIsSaving(false);
            setSuccessMessage(`"${appName}" uploaded successfully!`);
            // Reset form
            setAppName(''); setAppType(''); setVersion(''); setDescription(''); setFile(null); setFileName('');
            // Optionally redirect
            // setTimeout(() => router.push('/developer/my-apps'), 2000);

        } catch (err) {
            console.error("Upload or save process failed:", err);
            let friendlyError = `Operation failed: ${err.message}`;
            if (err.message.includes('Storage')) { // Basic check if it's a storage error
                 friendlyError = `File upload failed: ${err.message}. Check storage policies or connection.`;
            } else if (err.message.includes('Firestore')) { // Basic check for Firestore
                 friendlyError = `Failed to save app details: ${err.message}. Check Firestore rules.`;
            }
            setError(friendlyError);
            setIsUploading(false);
            setIsSaving(false);
            // TODO: Consider deleting the uploaded Supabase file if Firestore save fails (cleanup)
        }
    };


    if (loadingUser) {
        return ( <div className="min-h-screen flex items-center justify-center">Loading...</div> );
    }

     if (!user || !profile) {
        // This case should ideally be handled by the redirect in useEffect,
        // but adding a check here prevents rendering the form if state is inconsistent.
         return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500">{error || "Authentication required."}</p>
            </div>
         );
     }


    return (
        <DeveloperLayout>
            <Head><title>Upload New App - DevApps Developer</title></Head>

             {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900">Upload New Application</h1>
                 {/* Optional: Link back to My Apps */}
                 <Link href="/developer/my-apps" className="text-sm text-nova-blue-600 hover:underline mt-2 sm:mt-0">
                      &larr; Back to My Apps
                 </Link>
            </div>

            {/* Form Area */}
            <div className="bg-white p-6 md:p-8 rounded-lg shadow border border-nova-gray-100">
                 {/* Display Status/Error Messages */}
                {successMessage && (
                    <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="mb-4 p-4 text-sm text-nova-success-700 bg-nova-success-50 rounded-lg border border-nova-success-200 flex items-center space-x-2">
                        <FiCheckCircle className="w-5 h-5"/><span>{successMessage}</span>
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="mb-4 p-4 text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center space-x-2">
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
                            className="w-full px-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150"
                            placeholder="My Awesome Application"
                            disabled={isUploading || isSaving}
                        />
                    </div>

                     {/* App Type & Version (Inline) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="appType" className="block text-sm font-medium text-nova-gray-700 mb-1">
                               <FiType className="inline-block mr-1 mb-0.5 w-4 h-4"/> App Type <span className="text-red-500">*</span>
                            </label>
                            {/* Use Select or Input with datalist */}
                             <select
                                name="appType" id="appType" required value={appType}
                                onChange={(e) => setAppType(e.target.value)}
                                className="w-full px-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150 bg-white"
                                disabled={isUploading || isSaving}
                             >
                                 <option value="" disabled>Select type...</option>
                                 <option value="Mobile - Android">Mobile - Android (.apk)</option>
                                 <option value="Mobile - iOS">Mobile - iOS (.ipa)</option>
                                 <option value="Web">Web Application (Link/Zip)</option>
                                 <option value="Desktop - Windows">Desktop - Windows (.exe/.msi/.zip)</option>
                                  <option value="Desktop - macOS">Desktop - macOS (.dmg/.zip)</option>
                                   <option value="Desktop - Linux">Desktop - Linux (.deb/.appimage/.zip)</option>
                                 <option value="Other">Other</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="version" className="block text-sm font-medium text-nova-gray-700 mb-1">
                                <FiTag className="inline-block mr-1 mb-0.5 w-4 h-4"/> Version <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text" name="version" id="version" required maxLength={20}
                                value={version} onChange={(e) => setVersion(e.target.value)}
                                className="w-full px-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150"
                                placeholder="e.g., 1.0.0-beta"
                                disabled={isUploading || isSaving}
                            />
                        </div>
                    </div>

                     {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-nova-gray-700 mb-1">
                           <FiFileText className="inline-block mr-1 mb-0.5 w-4 h-4"/> Description
                        </label>
                        <textarea
                            id="description" name="description" rows="4"
                             value={description} onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-nova-gray-300 rounded-lg focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150"
                            placeholder="Briefly describe your application, its purpose, and what testers should focus on."
                            disabled={isUploading || isSaving}
                        ></textarea>
                    </div>

                     {/* File Input */}
                    <div>
                        <label className="block text-sm font-medium text-nova-gray-700 mb-1">
                            Application File <span className="text-red-500">*</span> <span className="text-xs">(Max 100MB)</span>
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-nova-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <FiUploadCloud className="mx-auto h-12 w-12 text-nova-gray-400" />
                                <div className="flex text-sm text-nova-gray-600">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer bg-white rounded-md font-medium text-nova-blue-600 hover:text-nova-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-nova-blue-500"
                                >
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" required className="sr-only" onChange={handleFileChange} disabled={isUploading || isSaving} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                                </div>
                                 {fileName ? (
                                    <p className="text-xs text-nova-gray-500 font-medium mt-2">{fileName}</p>
                                 ) : (
                                    <p className="text-xs text-nova-gray-500">APK, IPA, ZIP, EXE, etc. up to 100MB</p>
                                 )}
                            </div>
                        </div>
                    </div>

                     {/* Loading/Progress Indicator */}
                    {(isUploading || isSaving) && (
                         <div className="flex items-center space-x-2 text-sm text-nova-blue-600">
                             <FiLoader className="animate-spin w-4 h-4" />
                             <span>{isUploading ? 'Uploading file to secure storage...' : 'Saving application details...'}</span>
                             {/* Add progress bar here if possible later */}
                         </div>
                    )}

                    {/* Submit Button */}
                     <div className="pt-4 flex justify-end">
                         <Button
                            type="submit"
                            variant="primary"
                            disabled={isUploading || isSaving || !file || !appName || !appType || !version} // Disable if operating or missing required fields
                            icon={ isUploading || isSaving ? null : FiUploadCloud}
                        >
                            {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Upload & Save App'}
                        </Button>
                    </div>
                </form>
            </div>

        </DeveloperLayout>
    );
}