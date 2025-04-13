// components/Button.jsx
import { motion } from 'framer-motion';
import Link from 'next/link';

// Pass Icon component directly as prop if needed
const Button = ({
  href,
  variant = 'primary', // 'primary' or 'secondary'
  children,
  className = '',
  icon: Icon, // Optional icon component (e.g., from react-icons)
  iconPosition = 'right', // 'left' or 'right'
}) => {
  const baseStyle = "group px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ease-out inline-flex items-center justify-center space-x-2 overflow-hidden relative"; // Rounded-full, added relative/overflow

  const styles = {
    primary: `
      bg-gradient-to-r from-nova-blue-500 to-nova-blue-600
      text-white
      shadow-md shadow-nova-blue-500/30
      hover:from-nova-blue-600 hover:to-nova-blue-700
      hover:shadow-lg hover:shadow-nova-blue-500/40
      focus:ring-2 focus:ring-nova-blue-400 focus:ring-offset-2
    `,
    secondary: `
      border-2 border-nova-blue-500
      text-nova-blue-500
      bg-transparent
      hover:bg-gradient-to-r hover:from-nova-blue-500 hover:to-nova-blue-600
      hover:text-white
      hover:border-transparent
      hover:shadow-md hover:shadow-nova-blue-500/30
      focus:ring-2 focus:ring-nova-blue-400 focus:ring-offset-1
    `,
  };

  // Subtle animation for icon on hover
  const iconVariants = {
    rest: { x: 0, opacity: 0.8 },
    hover: { x: iconPosition === 'right' ? 2 : -2, opacity: 1 } // Slight move
  };

  return (
    <Link href={href} passHref legacyBehavior>
      <motion.a
        className={`${baseStyle} ${styles[variant]} ${className}`}
        whileHover="hover" // Trigger 'hover' variant on children
        whileTap={{ scale: 0.97 }}
        initial="rest"
        animate="rest"
      >
        {Icon && iconPosition === 'left' && (
          <motion.span variants={iconVariants} transition={{ duration: 0.2 }}>
            <Icon className="w-5 h-5" />
          </motion.span>
        )}
        <span>{children}</span>
        {Icon && iconPosition === 'right' && (
           <motion.span variants={iconVariants} transition={{ duration: 0.2 }}>
            <Icon className="w-5 h-5" />
          </motion.span>
        )}
      </motion.a>
    </Link>
  );
};

export default Button;