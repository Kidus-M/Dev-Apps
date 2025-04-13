// components/Button.jsx
import { motion } from 'framer-motion';
import Link from 'next/link';

const Button = ({
  href,
  variant = 'primary',
  children,
  className = '',
  icon: Icon,
  iconPosition = 'right',
}) => {
  const baseStyle = "group px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ease-out inline-flex items-center justify-center space-x-2 overflow-hidden relative text-sm md:text-base"; // Adjusted padding/text size slightly

  const styles = {
    primary: `
      bg-gradient-to-r from-nova-blue-500 to-nova-blue-600
      text-white
      shadow-md shadow-nova-blue-500/30
      hover:from-nova-blue-600 hover:to-nova-blue-700
      hover:shadow-lg hover:shadow-nova-blue-500/40
      focus:ring-2 focus:ring-nova-blue-400 focus:ring-offset-2
    `,
    // --- UPDATED SECONDARY HOVER ---
    secondary: `
      border-2 border-nova-blue-500
      text-nova-blue-500
      bg-transparent
      hover:bg-nova-blue-50       /* Light background tint on hover */
      hover:text-nova-blue-600   /* Slightly darker text on hover */
      hover:border-nova-blue-600 /* Slightly darker border on hover */
      focus:ring-2 focus:ring-nova-blue-400 focus:ring-offset-1
    `,
  };

  const iconVariants = {
    rest: { x: 0, opacity: 0.8 },
    hover: { x: iconPosition === 'right' ? 2 : -2, opacity: 1 }
  };

  return (
    <Link href={href} passHref legacyBehavior>
      <motion.a
        className={`${baseStyle} ${styles[variant]} ${className}`}
        whileHover="hover"
        whileTap={{ scale: 0.97 }}
        initial="rest"
        animate="rest"
      >
        {Icon && iconPosition === 'left' && (
          <motion.span variants={iconVariants} transition={{ duration: 0.2 }}>
            <Icon className="w-4 h-4 md:w-5 md:h-5" /> {/* Adjusted icon size */}
          </motion.span>
        )}
        <span className="mx-1">{children}</span> {/* Added margin for spacing */}
        {Icon && iconPosition === 'right' && (
           <motion.span variants={iconVariants} transition={{ duration: 0.2 }}>
            <Icon className="w-4 h-4 md:w-5 md:h-5" /> {/* Adjusted icon size */}
          </motion.span>
        )}
      </motion.a>
    </Link>
  );
};

export default Button;