// components/Footer.jsx
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear(); // Get current year

  return (
    <footer className="bg-nova-gray-900 text-nova-gray-400 py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
        <p>&copy; {currentYear} NovaTest. All rights reserved.</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Link href="/about" passHref legacyBehavior><a className="hover:text-white transition-colors">About</a></Link>
          <Link href="/privacy" passHref legacyBehavior><a className="hover:text-white transition-colors">Privacy Policy</a></Link>
          <Link href="/terms" passHref legacyBehavior><a className="hover:text-white transition-colors">Terms of Service</a></Link>
          <Link href="/contact" passHref legacyBehavior><a className="hover:text-white transition-colors">Contact</a></Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;