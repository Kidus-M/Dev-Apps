// pages/index.js
import Head from 'next/head';
import Navbar from '../components/Navbar'; // Adjust path if needed
import Hero from '../components/Hero';
import BentoFeatures from '../components/BentoFeatures';
import Footer from '../components/Footer';
import { auth } from "../utils/firebaseClient";
import { useEffect } from 'react';
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
// You could add more sections like "How it Works" or "Final CTA" here later

export default function LandingPage() {
  const router = useRouter();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.push("/dashboard-redirect");
      }
    });
    return () => unsubscribe();
  }, [router]);
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Dev Apps - Where Innovation Meets Feedback</title>
        <meta name="description" content="Test groundbreaking apps or share your creation for invaluable feedback. Your pre-launch app hub." />
        <link rel="icon" href="/favicon.ico" /> {/* Make sure you have a favicon */}
      </Head>

      <Navbar />

      <main className="flex-grow">
        <Hero />
        <BentoFeatures />
        {/* Add other sections here */}
      </main>

      <Footer />
    </div>
  );
}