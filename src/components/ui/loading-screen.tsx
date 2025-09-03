'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

export default function LoadingScreen({ 
  message = "Loading page...", 
  progress 
}: LoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/60 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main loading container */}
      <motion.div 
        className="relative z-10 text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Glass morphism container */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          
          {/* Spinning loader */}
          <div className="relative mx-auto mb-6 w-16 h-16">
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-purple-500/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-2 rounded-full border-2 border-transparent border-t-pink-400"
              animate={{ rotate: -360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Center glow */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-sm" />
            <div className="absolute inset-6 rounded-full bg-white/10" />
          </div>

          {/* Loading text */}
          <motion.h2 
            className="text-2xl font-bold text-white mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {message}{dots}
          </motion.h2>

          {/* Progress bar (if progress is provided) */}
          {typeof progress === 'number' && (
            <div className="w-64 mx-auto">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Pulsing dots */}
          <div className="flex justify-center space-x-2 mt-4">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-purple-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom glow effect */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-purple-500/20 blur-xl rounded-full" />
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4">
        <motion.div 
          className="w-8 h-8 border border-purple-400/30 rounded-lg"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="absolute top-4 right-4">
        <motion.div 
          className="w-6 h-6 border border-pink-400/30 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <div className="absolute bottom-4 left-4">
        <motion.div 
          className="w-4 h-4 bg-purple-400/20 rounded-sm"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
      <div className="absolute bottom-4 right-4">
        <motion.div 
          className="w-10 h-10 border-2 border-transparent border-t-pink-400/40 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}