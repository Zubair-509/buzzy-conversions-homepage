'use client';

import { motion } from 'framer-motion';
import { FileText, Download, Zap } from 'lucide-react';

interface ConversionLoaderProps {
  isVisible: boolean;
  progress?: number;
  stage?: 'analyzing' | 'converting' | 'finalizing';
}

export default function ConversionLoader({ 
  isVisible, 
  progress = 0, 
  stage = 'analyzing' 
}: ConversionLoaderProps) {
  const getStageMessage = () => {
    switch (stage) {
      case 'analyzing':
        return 'Analyzing your PDF...';
      case 'converting':
        return 'Converting to Word...';
      case 'finalizing':
        return 'Finalizing document...';
      default:
        return 'Processing...';
    }
  };

  const getStageIcon = () => {
    switch (stage) {
      case 'analyzing':
        return <FileText className="w-6 h-6" />;
      case 'converting':
        return <Zap className="w-6 h-6" />;
      case 'finalizing':
        return <Download className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Icon animation */}
        <div className="flex justify-center mb-6">
          <motion.div 
            className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-400/30"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: stage === 'converting' ? [0, 360] : [0, 5, -5, 0]
            }}
            transition={{ 
              duration: stage === 'converting' ? 2 : 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="text-purple-400">
              {getStageIcon()}
            </div>
          </motion.div>
        </div>

        {/* Message */}
        <motion.h3 
          className="text-xl font-semibold text-white text-center mb-6"
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {getStageMessage()}
        </motion.h3>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-400 rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
        </div>

        {/* Stage indicators */}
        <div className="flex justify-center space-x-4 mt-6">
          {['analyzing', 'converting', 'finalizing'].map((stageItem, index) => {
            const isActive = stageItem === stage;
            const isCompleted = ['analyzing', 'converting', 'finalizing'].indexOf(stage) > index;
            
            return (
              <motion.div
                key={stageItem}
                className={`w-3 h-3 rounded-full border-2 ${
                  isCompleted 
                    ? 'bg-purple-400 border-purple-400' 
                    : isActive 
                    ? 'border-purple-400 bg-purple-400/20' 
                    : 'border-gray-600 bg-transparent'
                }`}
                animate={isActive ? { 
                  scale: [1, 1.3, 1],
                  boxShadow: [
                    '0 0 0 rgba(168, 85, 247, 0)',
                    '0 0 20px rgba(168, 85, 247, 0.5)',
                    '0 0 0 rgba(168, 85, 247, 0)'
                  ]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            );
          })}
        </div>

        {/* Processing animation */}
        <div className="flex justify-center space-x-1 mt-4">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-purple-400/60 rounded-full"
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}