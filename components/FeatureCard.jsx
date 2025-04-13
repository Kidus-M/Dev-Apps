// components/FeatureCard.jsx
import { motion } from 'framer-motion';
// No IconType needed for JS

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

  return (
    <motion.div
      className={`bg-white p-6 rounded-xl border border-nova-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount: 0.3 }} // Trigger animation when 30% visible
      variants={cardVariants}
    >
      <div className="mb-4 text-nova-blue-500">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-semibold text-nova-gray-800 mb-2">{title}</h3>
      <p className="text-nova-gray-600">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;