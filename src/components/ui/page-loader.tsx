
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

    // Override Link clicks to trigger loading
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.startsWith('#') && !link.href.includes('mailto:') && !link.href.includes('tel:')) {
        // Check if it's an internal link
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);
        
        if (url.hostname === currentUrl.hostname && url.pathname !== currentUrl.pathname) {
          setLoading(true);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('navigation-start', handleNavigationStart);
      window.removeEventListener('navigation-end', handleNavigationEnd);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <LoadingScreen 
          message="Navigating to page" 
        />
      )}
    </AnimatePresence>
  );
}
