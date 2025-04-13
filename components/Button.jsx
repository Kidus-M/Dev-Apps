// components/Button.jsx
import { motion } from 'framer-motion';
import Link from 'next/link';

const Button = ({
  href,
  onClick,
  type = 'button', // Default to 'button', pass 'submit' for form buttons
  variant = 'primary',
  children,
  className = '',
  icon: Icon,
  iconPosition = 'right',
  disabled = false, // Accept disabled prop
}) => {
  const baseStyle = "group px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ease-out inline-flex items-center justify-center space-x-2 overflow-hidden relative text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed"; // Added disabled styles

  const styles = {
    primary: `
      bg-gradient-to-r from-nova-blue-500 to-nova-blue-600
      text-white
      shadow-md shadow-nova-blue-500/30
      hover:from-nova-blue-600 hover:to-nova-blue-700 hover:shadow-lg hover:shadow-nova-blue-500/40
      focus:ring-2 focus:ring-nova-blue-400 focus:ring-offset-2
    `,
    secondary: `
      border-2 border-nova-blue-500
      text-nova-blue-500
      bg-transparent
      hover:bg-nova-blue-50 hover:text-nova-blue-600 hover:border-nova-blue-600
      focus:ring-2 focus:ring-nova-blue-400 focus:ring-offset-1
    `,
  };

  const iconVariants = {
    rest: { x: 0, opacity: 0.8 },
    hover: { x: iconPosition === 'right' ? 2 : -2, opacity: 1 }
  };

  // Common content rendering function
  const renderContent = () => (
    <>
      {Icon && iconPosition === 'left' && ( <motion.span variants={iconVariants} transition={{ duration: 0.2 }}><Icon className="w-4 h-4 md:w-5 md:h-5" /></motion.span>)}
      <span className="mx-1">{children}</span>
      {Icon && iconPosition === 'right' && (<motion.span variants={iconVariants} transition={{ duration: 0.2 }}><Icon className="w-4 h-4 md:w-5 md:h-5" /></motion.span>)}
    </>
  );

  // --- CONDITIONAL RENDERING ---
  // Render as a Next.js Link if href is a valid navigational path
  if (href && href !== '#') {
    return (
      <Link href={href} passHref legacyBehavior>
        {/* We use legacyBehavior here because Button might wrap complex children sometimes */}
        <motion.a
          className={`${baseStyle} ${styles[variant]} ${className}`}
          whileHover={!disabled ? "hover" : ""} // Use hover state name
          whileTap={!disabled ? { scale: 0.97 } : {}}
          initial="rest"
          animate="rest"
          // Links usually don't need onClick unless doing something extra before nav
          // Add onClick={onClick} here if needed for specific link interactions
        >
          {renderContent()}
        </motion.a>
      </Link>
    );
  }

  // Render as a standard button for actions (onClick, type="submit", etc.)
  return (
    <motion.button
      type={type} // Use 'submit' or 'button'
      onClick={onClick} // Attach onClick handler
      className={`${baseStyle} ${styles[variant]} ${className}`}
      whileHover={!disabled ? "hover" : ""} // Use hover state name
      whileTap={!disabled ? { scale: 0.97 } : {}}
      initial="rest"
      animate="rest"
      disabled={disabled} // Pass disabled state
    >
      {renderContent()}
    </motion.button>
  );
};

export default Button;