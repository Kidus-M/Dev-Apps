// components/BentoFeatures.jsx
import FeatureCard from './FeatureCard'; // Use the ENHANCED card
import { FiUploadCloud, FiUsers, FiMessageSquare, FiCompass, FiShield, FiGift } from 'react-icons/fi';
import { motion } from 'framer-motion'; // Import motion

const BentoFeatures = () => {
  // Stagger children animation for the grid
  const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Stagger delay between cards
        delayChildren: 0.2, // Initial delay before starting stagger
      }
    }
  };

  // Note: The individual card animations are now mostly handled within FeatureCard itself (whileInView and hover)
  // We keep a simple item variant here mainly for the staggering effect if needed,
  // but FeatureCard's whileInView might be sufficient. Let's keep it simple.
  // const gridItemVariants = {
  //   hidden: { y: 20, opacity: 0 },
  //   visible: { y: 0, opacity: 1 }
  // };

  return (
    <section id="features" className="py-24 bg-nova-gray-50 px-4"> {/* Increased py */}
      <div className="max-w-7xl mx-auto">
        <motion.h2
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, amount: 0.5 }}
           transition={{ duration: 0.5 }}
           className="text-4xl md:text-5xl font-bold text-center text-nova-gray-900 mb-16" // Increased size, margin
        >
          Everything You Need to <span className="text-nova-blue-500">Launch & Test</span>
        </motion.h2>

        {/* Apply staggering animation to the grid container */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8" // Increased gap
          variants={gridContainerVariants}
          initial="hidden"
          whileInView="visible" // Trigger when grid enters view
          viewport={{ once: true, amount: 0.1 }} // Trigger early
        >
          {/* Use FeatureCard components directly - their internal animation handles entrance */}
          <FeatureCard
            icon={FiUploadCloud}
            title="Upload & Share Instantly"
            description="Developers: Easily upload your builds and share them with a targeted audience for testing."
            className="md:col-span-2 md:row-span-1" // Span 2 columns
          />
          <FeatureCard
            icon={FiMessageSquare}
            title="Direct Feedback Loop"
            description="Get valuable ratings and detailed feedback directly from real users."
          />
          <FeatureCard
            icon={FiUsers}
            title="Build Your Community"
            description="Connect with early adopters and testers passionate about new tech."
          />
           <FeatureCard
            icon={FiCompass}
            title="Discover Cutting-Edge Apps"
            description="Testers: Explore unique apps not yet available on mainstream stores."
             className="md:col-span-2 md:row-span-1" // Span 2 columns
          />
           <FeatureCard
            icon={FiGift}
            title="Free Access, Always"
            description="Download and test exciting new applications completely free."
          />
        </motion.div>
      </div>
    </section>
  );
};

export default BentoFeatures;