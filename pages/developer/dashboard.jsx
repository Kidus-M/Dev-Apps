// pages/developer/dashboard.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '../../utils/supabase/client'; // Use client helper
import Button from '../../components/Button';
import { FiLogOut } from 'react-icons/fi';

export default function DeveloperDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUserData = async () => {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
         if (error || !currentUser) {
            router.push('/signin'); // Redirect if not logged in (middleware should catch this too)
         } else {
             // Optional: Verify role again client-side as extra check
             const { data: profile } = await supabase
               .from('profiles')
               .select('role')
               .eq('id', currentUser.id)
               .single();
             if (profile?.role !== 'developer') {
                // Redirect if role mismatch (e.g., tester trying to access dev dash)
                router.push('/tester/dashboard'); // Or an unauthorized page
             } else {
                 setUser(currentUser);
             }
         }
         setLoading(false);
    }
    getUserData();
  }, [router, supabase]);

   const handleSignOut = async () => {
       setLoading(true);
       await supabase.auth.signOut();
       router.push('/signin'); // Redirect to signin after logout
   }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null; // Should be redirected if no user

  return (
    <div className="min-h-screen bg-nova-gray-50 p-8">
       <Head><title>Developer Dashboard - DevApps</title></Head>
       <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
           <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-nova-gray-800">Developer Dashboard</h1>
                <Button onClick={handleSignOut} variant="secondary" icon={FiLogOut} className="text-sm">
                    Sign Out
                </Button>
           </div>
            <p className="text-nova-gray-600">Welcome back, Developer!</p>
            <p className="text-nova-gray-500 text-sm">Your email: {user.email}</p>
            {/* Add Developer-specific content here */}
       </div>
    </div>
  );
}