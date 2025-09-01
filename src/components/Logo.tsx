
"use client";

import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface LogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo = ({ showText = true, size = 'md', className }: LogoProps) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <div className={`relative ${iconSizes[size]}`}>
          {/* Background circle with gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-secondary-500 to-accent-500 opacity-20" />

          {/* Outer rotating circle */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              borderLeftColor: 'var(--secondary-500)',
              borderRightColor: 'var(--accent-500)',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Inner icon */}
          <div className="absolute inset-0 flex items-center justify-center text-secondary-500">
            <RefreshCw
              size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
              className="transform -rotate-45"
            />
          </div>
        </div>

        {/* Glowing effect */}
        <motion.div
          className="absolute inset-0 bg-accent-500 rounded-full blur-xl opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </motion.div>
      
      {showText && (
        <motion.div 
          className={`ml-2 font-bold ${textSizes[size]} bg-gradient-to-r from-secondary-500 to-accent-500 bg-clip-text text-transparent`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Buzzy Conversions
        </motion.div>
      )}
    </div>
  );
};

export default Logo;
