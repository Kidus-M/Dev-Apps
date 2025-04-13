// components/FeatureCard.jsx
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description, className = "" }) => {
  const cardVariants = {
    offscreen: {
      y: 50,
      opacity: 0
    },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 0.8
      }
    }
  };

  // Hover variants for more interaction
  const hoverVariants = {
      rest: { scale: 1, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" }, // Softer initial shadow
      hover: {
          scale: 1.03,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" // Enhanced shadow
      }
  };

  const iconVariants = {
      rest: { rotate: 0, scale: 1 },
      hover: { rotate: -10, scale: 1.1 } // Slight rotate and scale on hover
  };


  return (
    <motion.div
      className={`relative bg-white p-6 rounded-xl border border-nova-gray-100 overflow-hidden ${className}`} // Added relative and overflow
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount: 0.3 }}
      variants={cardVariants}
      whileHover="hover" // Animate children on hover
      animate="rest" // Ensure it returns to rest state
    >
       {/* Animated Border Element */}
      <motion.div
        className="absolute inset-0 border-2 border-nova-blue-500 rounded-xl"
        variants={{
          rest: { clipPath: 'inset(100% 100% 0% 0%)' }, // Hidden initially
          hover: { clipPath: 'inset(0% 0% 0% 0%)' }    // Reveal on hover
        }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }} // Smooth ease
      />

      {/* Content (relative to allow border to be behind) */}
       <div className="relative z-10">
          <motion.div
              className="mb-4 text-nova-blue-500 inline-block"
              variants={iconVariants}
              transition={{ type: 'spring', stiffness: 300, damping: 10}}
            >
              <Icon size={32} />
          </motion.div>
          <h3 className="text-xl font-semibold text-nova-gray-800 mb-2">{title}</h3>
          <p className="text-nova-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

export default FeatureCard;