// pages/developer/account.jsx
import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image'; // For optimized avatar display
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
// --- Supabase Storage Imports ---
import { supabase } from '../../utils/supabaseClient'; // Storage client
// --- Components & Icons ---
import Button from '../../components/Button';
import DeveloperLayout from '../../components/DeveloperLayout';
import { FiUser, FiMail, FiBriefcase, FiLink, FiLinkedin, FiGithub, FiTwitter, FiMapPin, FiEdit2, FiImage, FiSave, FiKey, FiLogOut, FiAlertCircle, FiCheckCircle, FiLoader, FiInfo } from 'react-icons/fi';
// --- UUID ---
import { v4 as uuidv4 } from 'uuid';

export default function AccountSettingsPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null); // Store the fetched profile
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Form States
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState(''); // Comma-separated for simplicity
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [location, setLocation] = useState('');
    const [socialLinks, setSocialLinks] = useState({ github: '', linkedin: '', twitter: '' });
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Avatar States
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null); // Ref for the file input

    const router = useRouter();

    // --- Fetch User and Profile Data ---
    useEffect(() => {
        setLoadingUser(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const profileDocRef = doc(db, "profiles", currentUser.uid);
                try {
                    const profileSnap = await getDoc(profileDocRef);
                    if (profileSnap.exists()) {
                        const profileData = profileSnap.data();
                        setProfile(profileData);
                        // Initialize form state with fetched data
                        setUsername(profileData.username || '');
                        setBio(profileData.bio || '');
                        setSkills(profileData.skills || ''); // Assuming skills stored as string
                        setPortfolioUrl(profileData.portfolioUrl || '');
                        setLocation(profileData.location || '');
                        setSocialLinks(profileData.socialLinks || { github: '', linkedin: '', twitter: '' });
                        setAvatarPreview(profileData.avatarUrl || null); // Set initial avatar preview
                        setError(null);

                        // Role check (optional reinforcement)
                        if (profileData.role !== 'developer') {
                            router.replace('/tester/dashboard'); // Redirect non-devs
                            return;
                        }
                    } else {
                        setError("Profile data not found. Please sign in again.");
                        await signOut(auth);
                        router.replace('/signin');
                        return;
                    }
                } catch (err) {
                    setError("Failed to load profile data.");
                    console.error("Profile fetch error:", err);
                }
            } else {
                setUser(null); setProfile(null);
                router.replace('/signin');
                return;
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, [router]); // Only depends on router

    // --- Avatar Handling ---
    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
             // Basic size check (e.g., 2MB)
             const maxSize = 2 * 1024 * 1024;
             if (file.size > maxSize) {
                 setError("Avatar image must be less than 2MB.");
                 setAvatarFile(null);
                 setAvatarPreview(profile?.avatarUrl || null); // Revert preview
                 e.target.value = null;
                 return;
             }
             setError(null);
            setAvatarFile(file);
            // Create a preview URL
            setAvatarPreview(URL.createObjectURL(file));
        } else {
            setError("Please select a valid image file (jpg, png, gif).");
            setAvatarFile(null);
            setAvatarPreview(profile?.avatarUrl || null); // Revert preview
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile || !user) {
            setError("No new avatar selected or user not found.");
            return;
        }
        setError(null);
        setSuccessMessage(null);
        setIsUploadingAvatar(true);

        const fileExtension = avatarFile.name.split('.').pop();
        // Overwrite the file at user's path for simplicity
        const filePath = `public/avatars/${user.uid}/avatar.${fileExtension}`;
        // const filePath = `public/avatars/${user.uid}/${uuidv4()}.${fileExtension}`; // Alternative: unique names

        try {
             console.log("Uploading avatar to Supabase:", filePath);
            // Upload/Overwrite file in Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars') // Assuming you have an 'avatars' bucket
                .upload(filePath, avatarFile, {
                    cacheControl: '3600',
                    upsert: true, // Set to true to overwrite existing file at the path
                });

            if (uploadError) throw uploadError;

            console.log("Avatar upload successful:", uploadData);
            const uploadedPath = uploadData?.path;

            // Get public URL
             let newAvatarUrl = null;
             if(uploadedPath){
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadedPath);
                // Add timestamp query param to break browser cache after upload
                newAvatarUrl = urlData?.publicUrl ? `${urlData.publicUrl}?t=${new Date().getTime()}` : null;
             }


            if (!newAvatarUrl) {
                throw new Error("Could not get public URL for uploaded avatar.");
            }

            console.log("New avatar URL:", newAvatarUrl);

            // Update Firestore profile document with the new URL
            const profileDocRef = doc(db, "profiles", user.uid);
            await updateDoc(profileDocRef, {
                avatarUrl: newAvatarUrl,
                updatedAt: serverTimestamp()
            });

            setSuccessMessage("Avatar updated successfully!");
            setProfile(prev => ({ ...prev, avatarUrl: newAvatarUrl })); // Update local profile state
            setAvatarFile(null); // Clear selected file
            // Keep the preview as the new URL

        } catch (err) {
            console.error("Avatar upload/update failed:", err);
            let friendlyError = `Avatar update failed: ${err.message}`;
            if (err?.message?.includes('Storage') || err?.details?.includes('bucket_id')) friendlyError = `File upload failed: ${err.message}. Check storage policies ('avatars' bucket) or connection.`;
            else if (err?.message?.includes('firestore')) friendlyError = `Failed to save avatar URL: ${err.message}.`;
            setError(friendlyError);
            // Revert preview if upload failed
            setAvatarPreview(profile?.avatarUrl || null);
            setAvatarFile(null);
            if (fileInputRef.current) fileInputRef.current.value = null; // Clear file input UI

        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // --- Profile Update Handling ---
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!user) {
            setError("Not authenticated.");
            return;
        }
         if (username.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
             setError("Username must be at least 3 characters and contain only letters, numbers, or underscores.");
             return;
        }

        setError(null);
        setSuccessMessage(null);
        setIsSavingProfile(true);

        const profileDocRef = doc(db, "profiles", user.uid);
        const updatedData = {
            username: username.trim().toLowerCase(),
            bio: bio.trim(),
            skills: skills.trim(),
            portfolioUrl: portfolioUrl.trim(),
            location: location.trim(),
            socialLinks: {
                github: socialLinks.github?.trim() || '',
                linkedin: socialLinks.linkedin?.trim() || '',
                twitter: socialLinks.twitter?.trim() || '',
            },
            updatedAt: serverTimestamp()
        };

        try {
            await updateDoc(profileDocRef, updatedData);
            setSuccessMessage("Profile updated successfully!");
            setProfile(prev => ({ ...prev, ...updatedData, updatedAt: new Date() })); // Update local state optimistically
        } catch (err) {
            console.error("Profile update error:", err);
            // Handle potential unique username constraint error from Firestore rules/triggers (if implemented)
             if (err.code === 'failed-precondition' || err.message.toLowerCase().includes('unique constraint')) { // Example check
                setError("Failed to update profile. The username might already be taken.");
            } else {
                 setError(`Failed to update profile: ${err.message}`);
            }
        } finally {
            setIsSavingProfile(false);
        }
    };

     // --- Password Reset Handling ---
      const handlePasswordResetClick = async () => {
        if (!user?.email) {
             setError("Cannot send reset email. User email not found.");
             return;
        }
        setError(null);
        setSuccessMessage(null);

        try {
            await sendPasswordResetEmail(auth, user.email);
            setSuccessMessage(`Password reset email sent to ${user.email}. Please check your inbox.`);
        } catch (err) {
             console.error("Password reset email error:", err);
             setError(`Failed to send reset email: ${err.message}`);
        }
    };


    // --- Render Logic ---
    if (loadingUser) { /* ... loading ... */ }
    if (!user || !profile) return null; // Auth check

    // Helper for social link inputs
    const handleSocialLinkChange = (platform, value) => {
        setSocialLinks(prev => ({ ...prev, [platform]: value }));
    };


    return (
        <DeveloperLayout>
            <Head><title>Account Settings - DevApps Developer</title></Head>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900">Account Settings</h1>
                 {/* Sign Out Button can also go here if preferred */}
            </div>

            {/* Display General Success/Error Messages */}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- Profile Information Section --- */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleProfileUpdate} className="bg-white p-6 rounded-lg shadow border border-nova-gray-100 space-y-6">
                         <h2 className="text-xl font-semibold text-nova-gray-800 border-b pb-3 mb-4">Profile Information</h2>

                         {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-nova-gray-700 mb-1">Username</label>
                            <div className="relative">
                                 <FiUser className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength="3" maxLength="30" pattern="^[a-zA-Z0-9_]+$" title="Letters, numbers, underscores only (min 3)." className="w-full pl-10 input-style" disabled={isSavingProfile}/>
                            </div>
                            <p className="text-xs text-nova-gray-500 mt-1">Your unique handle on DevApps.</p>
                        </div>

                         {/* Email (Read Only) */}
                         <div>
                            <label htmlFor="email" className="block text-sm font-medium text-nova-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <FiMail className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="email" id="email" value={user.email || ''} className="w-full pl-10 input-style bg-nova-gray-100" disabled readOnly/>
                            </div>
                             <p className="text-xs text-nova-gray-500 mt-1">Cannot be changed here. Contact support if needed.</p>
                         </div>

                          {/* Role (Read Only) */}
                         <div>
                            <label htmlFor="role" className="block text-sm font-medium text-nova-gray-700 mb-1">Role</label>
                             <div className="relative">
                                 <FiBriefcase className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="text" id="role" value={profile.role || 'N/A'} className="w-full pl-10 input-style bg-nova-gray-100 capitalize" disabled readOnly/>
                             </div>
                         </div>

                         {/* Bio */}
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-nova-gray-700 mb-1">Bio</label>
                            <textarea id="bio" rows="4" value={bio} onChange={(e) => setBio(e.target.value)} className="w-full input-style" placeholder="Tell others a bit about yourself..." disabled={isSavingProfile}></textarea>
                        </div>

                        {/* Skills */}
                        <div>
                            <label htmlFor="skills" className="block text-sm font-medium text-nova-gray-700 mb-1">Skills</label>
                            <textarea id="skills" rows="3" value={skills} onChange={(e) => setSkills(e.target.value)} className="w-full input-style" placeholder="Comma-separated, e.g., React, Node.js, UI/UX Design, Swift" disabled={isSavingProfile}></textarea>
                             <p className="text-xs text-nova-gray-500 mt-1">List your key skills, separated by commas.</p>
                        </div>

                         {/* Portfolio URL */}
                        <div>
                            <label htmlFor="portfolioUrl" className="block text-sm font-medium text-nova-gray-700 mb-1">Portfolio/Website URL</label>
                             <div className="relative">
                                 <FiLink className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="url" id="portfolioUrl" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className="w-full pl-10 input-style" placeholder="https://your-portfolio.com" disabled={isSavingProfile}/>
                             </div>
                        </div>

                         {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-nova-gray-700 mb-1">Location</label>
                             <div className="relative">
                                 <FiMapPin className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-10 input-style" placeholder="City, Country" disabled={isSavingProfile}/>
                             </div>
                        </div>

                         {/* --- Social Links Section --- */}
                         <div className="pt-4 space-y-4">
                             <h3 className="text-md font-medium text-nova-gray-700">Social Links</h3>
                             {/* GitHub */}
                              <div className="relative">
                                 <label htmlFor="github" className="sr-only">GitHub URL</label>
                                 <FiGithub className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="url" id="github" value={socialLinks.github || ''} onChange={(e) => handleSocialLinkChange('github', e.target.value)} className="w-full pl-10 input-style" placeholder="https://github.com/yourusername" disabled={isSavingProfile}/>
                             </div>
                             {/* LinkedIn */}
                             <div className="relative">
                                 <label htmlFor="linkedin" className="sr-only">LinkedIn URL</label>
                                 <FiLinkedin className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="url" id="linkedin" value={socialLinks.linkedin || ''} onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)} className="w-full pl-10 input-style" placeholder="https://linkedin.com/in/yourprofile" disabled={isSavingProfile}/>
                             </div>
                              {/* Twitter/X */}
                              <div className="relative">
                                 <label htmlFor="twitter" className="sr-only">Twitter/X URL</label>
                                 <FiTwitter className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="url" id="twitter" value={socialLinks.twitter || ''} onChange={(e) => handleSocialLinkChange('twitter', e.target.value)} className="w-full pl-10 input-style" placeholder="https://twitter.com/yourhandle" disabled={isSavingProfile}/>
                             </div>
                         </div>


                         {/* Save Button */}
                        <div className="pt-4 flex justify-end">
                            <Button type="submit" variant="primary" disabled={isSavingProfile} icon={isSavingProfile ? null : FiSave}>
                                {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* --- Right Column (Avatar + Account Security) --- */}
                <div className="space-y-8">
                    {/* Avatar Section */}
                    <div className="bg-white p-6 rounded-lg shadow border border-nova-gray-100">
                        <h2 className="text-xl font-semibold text-nova-gray-800 mb-4">Profile Picture</h2>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-nova-gray-200 ring-2 ring-offset-2 ring-nova-blue-200 flex items-center justify-center">
                                {avatarPreview ? (
                                     // Use next/image for optimization if possible, otherwise standard img
                                     <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                     // <Image src={avatarPreview} alt="Avatar Preview" width={128} height={128} className="object-cover"/>
                                ) : (
                                    <FiUser className="w-16 h-16 text-nova-gray-400" />
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handleAvatarChange}
                                ref={fileInputRef} // Assign ref
                                className="hidden" // Hide default input
                                id="avatar-upload"
                                disabled={isUploadingAvatar}
                            />
                            {/* Custom Button to trigger file input */}
                            <div className="flex space-x-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => fileInputRef.current?.click()} // Trigger click on hidden input
                                    disabled={isUploadingAvatar}
                                    icon={FiEdit2}
                                    className="!text-sm !px-3 !py-1.5"
                                >
                                    Change
                                </Button>
                                {/* Show Upload button only if a new file is selected */}
                                {avatarFile && (
                                    <Button
                                        variant="primary"
                                        onClick={handleAvatarUpload}
                                        disabled={isUploadingAvatar}
                                        icon={isUploadingAvatar ? null : FiUploadCloud}
                                        className="!text-sm !px-3 !py-1.5"
                                    >
                                        {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                                    </Button>
                                )}
                            </div>
                              {isUploadingAvatar && <p className="text-xs text-nova-blue-600">Uploading avatar...</p>}
                        </div>
                    </div>

                    {/* Account Security Section */}
                    <div className="bg-white p-6 rounded-lg shadow border border-nova-gray-100 space-y-4">
                         <h2 className="text-xl font-semibold text-nova-gray-800 mb-4">Account Security</h2>
                         <div>
                             <h3 className="text-sm font-medium text-nova-gray-700 mb-1">Change Password</h3>
                             <p className="text-xs text-nova-gray-500 mb-2">An email will be sent to {user.email} with instructions.</p>
                             <Button
                                variant="secondary"
                                onClick={handlePasswordResetClick}
                                icon={FiKey}
                                className="!text-sm !px-3 !py-1.5"
                             >
                                Send Password Reset Email
                            </Button>
                         </div>
                          {/* Add Email Change or Delete Account sections here later if needed */}
                    </div>
                </div>

            </div>
            {/* Helper for input style reuse */}
             <style jsx>{`
                .input-style {
                    @apply block w-full px-3 py-2 border border-nova-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150 ease-in-out sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed;
                }
            `}</style>
        </DeveloperLayout>
    );
}