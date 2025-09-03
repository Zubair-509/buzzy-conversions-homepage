'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from './loading-screen';

export default function PageLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Set loading to false when pathname changes (page has loaded)
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    // Listen for navigation events
    const handleNavigationStart = () => {
      setLoading(true);
    };

    const handleNavigationEnd = () => {
      setTimeout(() => setLoading(false), 500); // Small delay for smooth transition
    };

    // Listen for custom navigation events
    window.addEventListener('navigation-start', handleNavigationStart);
    window.addEventListener('navigation-end', handleNavigationEnd);

    // Listen for browser navigation
    const handlePopState = () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 800);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('navigation-start', handleNavigationStart);
      window.removeEventListener('navigation-end', handleNavigationEnd);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50"
        >
          <LoadingScreen />
        </motion.div>
      )}
    </AnimatePresence>
  );
}