import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <motion.div
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-8xl mb-6"
        >
          😕
        </motion.div>
        <h1 className="text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '3rem' }}>404</h1>
        <h2 className="text-gray-700 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-all" style={{ background: 'var(--btc-primary,#16a34a)' }}>
            <Home size={16} /> Go Home
          </Link>
          <button onClick={() => history.back()} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
