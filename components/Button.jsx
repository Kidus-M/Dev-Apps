// components/Button.jsx
import { motion } from 'framer-motion';
import Link from 'next/link';

// No type definition needed for JS
const Button = ({
  href,
  variant = 'primary', // Default variant
  children,
  className = '',    // Default className
}) => {
  const baseStyle = "px-6 py-3 rounded-lg font-semibold transition-colors duration-300 inline-block text-center";

  const styles = {
    primary: 'bg-nova-blue-500 text-white hover:bg-nova-blue-600 focus:ring-2 focus:ring-nova-blue-300',
    secondary: 'bg-nova-gray-200 text-nova-gray-800 hover:bg-nova-gray-300 focus:ring-2 focus:ring-nova-gray-400',
  };

  return (
    <Link href={href} passHref legacyBehavior>
      <motion.a
        className={`${baseStyle} ${styles[variant]} ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </motion.a>
    </Link>
  );
};

export default Button;