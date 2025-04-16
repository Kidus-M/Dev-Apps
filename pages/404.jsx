import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Custom404() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-nova-gray-50 via-white to-nova-blue-50 p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-nova-blue-600"
      >
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-nova-gray-700 mb-6">Oops! The page you're looking for doesn't exist.</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Link href="/" className="px-6 py-3 bg-nova-blue-600 text-white rounded-lg shadow-md hover:bg-nova-blue-500 transition duration-300">
          Go to Homepage
        </Link>
      </motion.div>
    </div>
  );
}
