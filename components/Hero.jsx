// components/Hero.jsx
import { motion } from 'framer-motion';
import Button from './Button';
import { FiArrowRight, FiDownloadCloud, FiUploadCloud } from 'react-icons/fi'; // Example icons

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <motion.section
      className="min-h-[80vh] flex items-center justify-center text-center px-4 py-16 bg-gradient-to-b from-nova-gray-50 to-white" // Subtle gradient background
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-4xl">
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-nova-mint-100 text-nova-mint-800">
            <FiUploadCloud className="mr-2" /> For Developers & Testers <FiDownloadCloud className="ml-2" />
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-6xl font-bold text-nova-gray-900 mb-4 leading-tight"
        >
          Where Innovation Meets <span className="text-nova-blue-500">Feedback</span>.
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-nova-gray-600 mb-8 max-w-2xl mx-auto"
        >
          Launch your app to early adopters for invaluable insights, or discover and test groundbreaking software before it hits the mainstream.
        </motion.p>

        <motion.div variants={itemVariants} className="flex justify-center space-x-4">
          <Button href="/signup" variant="primary" className="text-lg">
            Get Started Free <FiArrowRight className="inline ml-2" />
          </Button>
          <Button href="#features" variant="secondary" className="text-lg">
            Learn More
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Hero;