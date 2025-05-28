// pages/tester/account.jsx
import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
// --- Firebase Imports ---
import { auth, db } from '../../utils/firebaseClient'; // Adjust path as needed
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
// --- Supabase Storage Imports ---
import { supabase } from '../../utils/supabaseClient'; // Adjust path as needed
// --- Components & Icons ---
import Button from '../../components/Button';
import TesterLayout from '../../components/TesterLayout'; // Use TesterLayout
import {
    FiUser, FiMail, FiBriefcase, FiAward, FiLink, FiLinkedin, FiGithub, FiTwitter,
    FiMapPin, FiEdit2, FiImage, FiSave, FiKey, FiLogOut, FiAlertCircle,
    FiCheckCircle, FiLoader, FiUploadCloud
} from 'react-icons/fi';
import { motion } from 'framer-motion';
// --- UUID (Not strictly needed if overwriting avatar, but good for unique names if not) ---
// import { v4 as uuidv4 } from 'uuid';

export default function TesterAccountPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Form States
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [location, setLocation] = useState('');
    const [socialLinks, setSocialLinks] = useState({ github: '', linkedin: '', twitter: '' });
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Avatar States
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

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

                        // Role check for tester
                        if (profileData.role !== 'tester') {
                            console.warn("Tester Account: User is not a tester. Redirecting.");
                            // Redirect to a default page or developer dashboard if applicable
                            router.replace(profileData.role === 'developer' ? '/developer/dashboard' : '/');
                            return;
                        }

                        // Initialize form state
                        setUsername(profileData.username || '');
                        setBio(profileData.bio || '');
                        setSkills(profileData.skills || '');
                        setPortfolioUrl(profileData.portfolioUrl || '');
                        setLocation(profileData.location || '');
                        setSocialLinks(profileData.socialLinks || { github: '', linkedin: '', twitter: '' });
                        setAvatarPreview(profileData.avatarUrl || null);
                        setError(null);
                    } else {
                        setError("Profile data not found. Please complete your profile or sign in again.");
                        // Consider a redirect to a profile creation step if applicable for testers
                        await auth.signOut(); // Sign out if profile is crucial and missing
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
    }, [router]);

    // --- Avatar Handling ---
    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const maxSize = 2 * 1024 * 1024; // 2MB limit
            if (file.size > maxSize) {
                setError("Avatar image must be less than 2MB.");
                setAvatarFile(null);
                setAvatarPreview(profile?.avatarUrl || null);
                e.target.value = null;
                return;
            }
            setError(null);
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        } else {
            setError("Please select a valid image file (jpg, png, gif).");
            setAvatarFile(null);
            setAvatarPreview(profile?.avatarUrl || null);
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile || !user) {
            setError("No new avatar selected or user not found.");
            return;
        }
        setError(null); setSuccessMessage(null);
        setIsUploadingAvatar(true);

        const fileExtension = avatarFile.name.split('.').pop();
        const filePath = `public/avatars/${user.uid}/avatar.${fileExtension}`; // Overwrite

        try {
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars') // Ensure this bucket exists and policies are set
                .upload(filePath, avatarFile, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            const uploadedPath = uploadData?.path;
            let newAvatarUrl = null;
            if (uploadedPath) {
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadedPath);
                newAvatarUrl = urlData?.publicUrl ? `${urlData.publicUrl}?t=${new Date().getTime()}` : null;
            }
            if (!newAvatarUrl) throw new Error("Could not get public URL for avatar.");

            const profileDocRef = doc(db, "profiles", user.uid);
            await updateDoc(profileDocRef, { avatarUrl: newAvatarUrl, updatedAt: serverTimestamp() });

            setSuccessMessage("Avatar updated successfully!");
            setProfile(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
            setAvatarFile(null); // Clear file after successful upload
            if (fileInputRef.current) fileInputRef.current.value = null;

        } catch (err) {
            console.error("Avatar upload/update failed:", err);
            setError(`Avatar update failed: ${err.message}. Check Supabase Storage policies for 'avatars' bucket.`);
            setAvatarPreview(profile?.avatarUrl || null); // Revert preview
            setAvatarFile(null);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // --- Profile Update Handling ---
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!user) { setError("Not authenticated."); return; }
        if (username.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
            setError("Username must be at least 3 characters and contain only letters, numbers, or underscores.");
            return;
        }
        setError(null); setSuccessMessage(null);
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
            setProfile(prev => ({ ...prev, ...updatedData, updatedAt: new Date() }));
        } catch (err) {
            console.error("Profile update error:", err);
            setError(`Failed to update profile: ${err.message}`);
        } finally {
            setIsSavingProfile(false);
        }
    };

    // --- Password Reset Handling ---
    const handlePasswordResetClick = async () => {
        if (!user?.email) { setError("User email not found."); return; }
        setError(null); setSuccessMessage(null);
        try {
            await sendPasswordResetEmail(auth, user.email);
            setSuccessMessage(`Password reset email sent to ${user.email}. Check your inbox.`);
        } catch (err) {
            console.error("Password reset email error:", err);
            setError(`Failed to send reset email: ${err.message}`);
        }
    };

    const handleSocialLinkChange = (platform, value) => {
        setSocialLinks(prev => ({ ...prev, [platform]: value }));
    };

    if (loadingUser) {
        return (
            <TesterLayout>
                <div className="flex justify-center items-center py-20">
                    <FiLoader className="animate-spin text-nova-blue-500 text-3xl" />
                </div>
            </TesterLayout>
        );
    }
    if (!user || !profile) return null; // Should be redirected by useEffect

    return (
        <TesterLayout>
            <Head><title>Account Settings - DevApps Tester</title></Head>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nova-gray-900">Account Settings</h1>
            </div>

            {successMessage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 text-sm text-nova-success-700 bg-nova-success-50 rounded-lg border border-nova-success-200 flex items-center space-x-2">
                    <FiCheckCircle className="w-5 h-5" /><span>{successMessage}</span>
                </motion.div>
            )}
            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 text-sm text-nova-error-700 bg-nova-error-50 rounded-lg border border-nova-error-200 flex items-center space-x-2">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" /> <span className="break-words">{error}</span>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- Profile Information Section --- */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleProfileUpdate} className="bg-white p-6 rounded-lg shadow border border-nova-gray-100 space-y-6">
                        <h2 className="text-xl font-semibold text-nova-gray-800 border-b pb-3 mb-4">Public Profile</h2>

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-nova-gray-700 mb-1">Username</label>
                            <div className="relative">
                                <FiUser className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength="3" maxLength="30" pattern="^[a-zA-Z0-9_]+$" title="Letters, numbers, underscores only (min 3)." className="w-full pl-10 input-style" disabled={isSavingProfile} />
                            </div>
                            <p className="text-xs text-nova-gray-500 mt-1">Your display name on DevApps.</p>
                        </div>

                        {/* Email (Read Only) */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-nova-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <FiMail className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="email" id="email" value={user.email || ''} className="w-full pl-10 input-style bg-nova-gray-100" disabled readOnly />
                            </div>
                        </div>

                        {/* Role (Read Only) */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-nova-gray-700 mb-1">Role</label>
                            <div className="relative">
                                <FiAward className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" /> {/* Tester icon */}
                                <input type="text" id="role" value={profile.role || 'N/A'} className="w-full pl-10 input-style bg-nova-gray-100 capitalize" disabled readOnly />
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-nova-gray-700 mb-1">Bio <span className="text-nova-gray-400 text-xs">(Optional)</span></label>
                            <textarea id="bio" rows="4" value={bio} onChange={(e) => setBio(e.target.value)} className="w-full input-style" placeholder="A brief description of yourself..." disabled={isSavingProfile}></textarea>
                        </div>

                        {/* Skills */}
                        <div>
                            <label htmlFor="skills" className="block text-sm font-medium text-nova-gray-700 mb-1">Testing Skills/Interests <span className="text-nova-gray-400 text-xs">(Optional)</span></label>
                            <textarea id="skills" rows="3" value={skills} onChange={(e) => setSkills(e.target.value)} className="w-full input-style" placeholder="e.g., UI/UX, Performance Testing, Android, iOS, Web Apps" disabled={isSavingProfile}></textarea>
                            <p className="text-xs text-nova-gray-500 mt-1">Comma-separated, e.g., Usability, Game Testing, Security.</p>
                        </div>

                        {/* Portfolio URL */}
                        <div>
                            <label htmlFor="portfolioUrl" className="block text-sm font-medium text-nova-gray-700 mb-1">Portfolio/Website URL <span className="text-nova-gray-400 text-xs">(Optional)</span></label>
                            <div className="relative">
                                <FiLink className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="url" id="portfolioUrl" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className="w-full pl-10 input-style" placeholder="https://your-site.com" disabled={isSavingProfile} />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-nova-gray-700 mb-1">Location <span className="text-nova-gray-400 text-xs">(Optional)</span></label>
                            <div className="relative">
                                <FiMapPin className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-10 input-style" placeholder="City, Country" disabled={isSavingProfile} />
                            </div>
                        </div>

                        {/* Social Links Section */}
                        <div className="pt-4 space-y-4">
                            <h3 className="text-md font-medium text-nova-gray-700">Social Links <span className="text-nova-gray-400 text-xs">(Optional)</span></h3>
                            {/* GitHub */}
                            <div className="relative">
                                <label htmlFor="github" className="sr-only">GitHub URL</label>
                                <FiGithub className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="url" id="github" value={socialLinks.github || ''} onChange={(e) => handleSocialLinkChange('github', e.target.value)} className="w-full pl-10 input-style" placeholder="https://github.com/yourusername" disabled={isSavingProfile} />
                            </div>
                            {/* LinkedIn */}
                            <div className="relative">
                                <label htmlFor="linkedin" className="sr-only">LinkedIn URL</label>
                                <FiLinkedin className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="url" id="linkedin" value={socialLinks.linkedin || ''} onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)} className="w-full pl-10 input-style" placeholder="https://linkedin.com/in/yourprofile" disabled={isSavingProfile} />
                            </div>
                            {/* Twitter/X */}
                            <div className="relative">
                                <label htmlFor="twitter" className="sr-only">Twitter/X URL</label>
                                <FiTwitter className="absolute top-1/2 left-3 transform -translate-y-1/2 text-nova-gray-400" />
                                <input type="url" id="twitter" value={socialLinks.twitter || ''} onChange={(e) => handleSocialLinkChange('twitter', e.target.value)} className="w-full pl-10 input-style" placeholder="https://twitter.com/yourhandle" disabled={isSavingProfile} />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" variant="primary" disabled={isSavingProfile} icon={isSavingProfile ? FiLoader : FiSave} iconClassName={isSavingProfile ? "animate-spin" : ""}>
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
                                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <FiUser className="w-16 h-16 text-nova-gray-400" />
                                )}
                            </div>
                            <input
                                type="file" accept="image/png, image/jpeg, image/gif"
                                onChange={handleAvatarChange} ref={fileInputRef}
                                className="hidden" id="avatar-upload" disabled={isUploadingAvatar}
                            />
                            <div className="flex space-x-3">
                                <Button
                                    variant="secondary" onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingAvatar} icon={FiEdit2}
                                    className="!text-sm !px-3 !py-1.5"
                                >
                                    Change
                                </Button>
                                {avatarFile && (
                                    <Button
                                        variant="primary" onClick={handleAvatarUpload}
                                        disabled={isUploadingAvatar} icon={isUploadingAvatar ? FiLoader : FiUploadCloud}
                                        iconClassName={isUploadingAvatar ? "animate-spin" : ""}
                                        className="!text-sm !px-3 !py-1.5"
                                    >
                                        {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                                    </Button>
                                )}
                            </div>
                            {isUploadingAvatar && <p className="text-xs text-nova-blue-600 flex items-center"><FiLoader className="animate-spin w-3 h-3 mr-1"/> Uploading avatar...</p>}
                        </div>
                    </div>

                    {/* Account Security Section */}
                    <div className="bg-white p-6 rounded-lg shadow border border-nova-gray-100 space-y-4">
                        <h2 className="text-xl font-semibold text-nova-gray-800 mb-4">Account Security</h2>
                        <div>
                            <h3 className="text-sm font-medium text-nova-gray-700 mb-1">Change Password</h3>
                            <p className="text-xs text-nova-gray-500 mb-2">An email will be sent to {user.email} with instructions.</p>
                            <Button
                                variant="secondary" onClick={handlePasswordResetClick}
                                icon={FiKey} className="!text-sm !px-3 !py-1.5"
                            >
                                Send Password Reset Email
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .input-style {
                    @apply block w-full px-3 py-2 border border-nova-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-nova-blue-500 focus:border-nova-blue-500 transition duration-150 ease-in-out sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed;
                }
            `}</style>
        </TesterLayout>
    );
}