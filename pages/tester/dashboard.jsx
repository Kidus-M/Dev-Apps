// pages/tester/dashboard.jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '../../utils/supabase/client';
import Button from '../../components/Button';
import { FiLogOut } from 'react-icons/fi';

export default function TesterDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
     const getUserData = async () => {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
         if (error || !currentUser) {
            router.push('/signin');
         } else {
             const { data: profile } = await supabase
               .from('profiles')
               .select('role')
               .eq('id', currentUser.id)
               .single();
             if (profile?.role !== 'tester') {
                router.push('/developer/dashboard'); // Redirect if wrong role
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
       router.push('/signin');
   }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

   if (!user) return null;

  return (
    <div className="min-h-screen bg-nova-gray-50 p-8">
      <Head><title>Tester Dashboard - DevApps</title></Head>
       <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
           <div className="flex justify-between items-center mb-6">
               <h1 className="text-2xl font-bold text-nova-gray-800">Tester Dashboard</h1>
               <Button onClick={handleSignOut} variant="secondary" icon={FiLogOut} className="text-sm">
                    Sign Out
                </Button>
           </div>
            <p className="text-nova-gray-600">Welcome back, Tester!</p>
            <p className="text-nova-gray-500 text-sm">Your email: {user.email}</p>
            {/* Add Tester-specific content here */}
       </div>
    </div>
  );
}