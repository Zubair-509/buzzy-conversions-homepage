'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from './loading-screen';

export default function PageLoader() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setLoading(true);
    };

    const handleRouteChangeComplete = () => {
      setLoading(false);
    };

    // Listen for route changes
    const handlePopState = () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 100);
    };

    window.addEventListener('popstate', handlePopState);
    
    // For programmatic navigation, we'll use a custom event
    const handleNavigationStart = () => setLoading(true);
    const handleNavigationEnd = () => setLoading(false);
    
    window.addEventListener('navigation-start', handleNavigationStart);
    window.addEventListener('navigation-end', handleNavigationEnd);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('navigation-start', handleNavigationStart);
      window.removeEventListener('navigation-end', handleNavigationEnd);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <LoadingScreen 
          message="Preparing your tools" 
        />
      )}
    </AnimatePresence>
  );
}