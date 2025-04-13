// pages/dashboard-redirect.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '../utils/supabase/client'; // Use client-side helper

export default function DashboardRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClient(); // Initialize client-side client

  useEffect(() => {
    const fetchProfileAndRedirect = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch profile to get the role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single(); // Expect only one row

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          // Handle error - maybe redirect to a generic error page or signin
          router.push('/signin');
          return;
        }

        if (profile && profile.role === 'developer') {
          console.log("Redirecting to Developer Dashboard");
          router.replace('/developer/dashboard');
        } else if (profile && profile.role === 'tester') {
          console.log("Redirecting to Tester Dashboard");
          router.replace('/tester/dashboard');
        } else {
          // Role not set or profile missing? Redirect to profile setup or signin
          console.warn("User profile role not found or invalid:", profile);
          // You might want a dedicated /profile-setup page
          router.replace('/signin'); // Fallback for now
        }
      } else {
        // Not logged in, redirect to signin
        console.log("No user found, redirecting to signin");
        router.replace('/signin');
      }
      // setLoading(false); // Might redirect before this runs
    };

    fetchProfileAndRedirect();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-nova-gray-50">
      <p className="text-nova-gray-600">Loading your dashboard...</p>
      {/* Add a spinner component here */}
    </div>
  );
}