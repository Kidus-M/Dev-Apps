// components/Hero.jsx
import { motion } from 'framer-motion';
import Button from './Button';
import { FiArrowRight, FiDownloadCloud, FiUploadCloud, FiUserPlus } from 'react-icons/fi';

// Background shapes animation component
const AnimatedShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10 opacity-50">
      <motion.div
        className="absolute top-[10%] left-[5%] w-32 h-32 bg-nova-blue-200 rounded-full filter blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[15%] right-[10%] w-40 h-40 bg-nova-mint-200 rounded-full filter blur-2xl"
         animate={{
          scale: [1, 0.8, 1],
          rotate: [0, -90, 0],
          y: [0, -25, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
       <motion.div
        className="absolute top-[30%] right-[25%] w-20 h-20 bg-nova-blue-100 rounded-lg filter blur-xl"
         animate={{
          scale: [1, 1.1, 1],
          rotate: [45, -45, 45],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 1 }}
      />
    </div>
  );
};


const Hero = () => {
  const headline = "Where Innovation Meets Feedback."; // Split into words
  const headlineWords = headline.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } // Stagger words
    }
  };

  const wordVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

   const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut", delay: headlineWords.length * 0.1 + 0.2 } } // Delay after headline
  };


  return (
    <section className="relative min-h-screen flex items-center justify-center text-center px-4 py-24 overflow-hidden bg-gradient-to-b from-nova-gray-50 to-white"> {/* Added relative, overflow, min-h-screen, increased py */}
      <AnimatedShapes /> {/* Add animated background */}

      <div className="relative z-10 max-w-4xl"> {/* Ensure content is above shapes */}
         <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="mb-6"
        >
           <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-nova-mint-100 text-nova-mint-800 shadow-sm">
            <FiUploadCloud className="mr-2 text-nova-mint-600" /> For Developers & Testers <FiDownloadCloud className="ml-2 text-nova-mint-600" />
          </span>
        </motion.div>

        {/* Animated Headline */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-nova-gray-900 mb-6 leading-tight" // Increased size, margin
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {headlineWords.map((word, index) => (
            <motion.span
              key={index}
              variants={wordVariants}
              style={{ display: 'inline-block', marginRight: '0.25em' }} // Ensures words stay inline
              className={word === 'Feedback.' ? 'text-nova-blue-500' : ''} // Color the last word
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          variants={itemVariants} // Use delayed item variant
          initial="hidden"
          animate="visible"
          className="text-lg md:text-xl text-nova-gray-600 mb-10 max-w-2xl mx-auto" // Increased margin
        >
          Launch your app to early adopters for invaluable insights, or discover and test groundbreaking software before it hits the mainstream.
        </motion.p>

        <motion.div
           variants={itemVariants} // Use delayed item variant
           initial="hidden"
           animate="visible"
           className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <Button href="/signup" variant="primary" className="text-lg w-full sm:w-auto" icon={FiUserPlus}>
            Join as Developer
          </Button>
          <Button href="/signup-tester" variant="secondary" className="text-lg w-full sm:w-auto" icon={FiDownloadCloud}>
            Join as Tester
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;