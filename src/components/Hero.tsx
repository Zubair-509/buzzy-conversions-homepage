"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroProps {
  className?: string;
  enableMotion?: boolean;
}

export default function Hero({ className = "", enableMotion = true }: HeroProps) {
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [typingComplete, setTypingComplete] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const typingRef = useRef<NodeJS.Timeout>();
  const cursorRef = useRef<NodeJS.Timeout>();
  const headlineRef = useRef<HTMLHeadingElement>(null);

  const fullText = "Convert More Visitors Into Customers";
  const typingSpeed = 80;

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!enableMotion || prefersReducedMotion) {
      setTypedText(fullText);
      setTypingComplete(true);
      setShowCursor(false);
      return;
    }

    let currentIndex = 0;
    
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
        typingRef.current = setTimeout(typeNextChar, typingSpeed);
      } else {
        setTypingComplete(true);
        // Hide cursor after typing is complete
        setTimeout(() => setShowCursor(false), 1000);
      }
    };

    // Start typing after a brief delay
    const startDelay = setTimeout(() => {
      typeNextChar();
    }, 1000);

    return () => {
      clearTimeout(startDelay);
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, [enableMotion, prefersReducedMotion]);

  // Cursor blinking effect
  useEffect(() => {
    if (!showCursor) return;

    const blink = () => {
      setShowCursor(prev => !prev);
    };

    cursorRef.current = setInterval(blink, 500);
    return () => {
      if (cursorRef.current) clearInterval(cursorRef.current);
    };
  }, [showCursor]);

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const MotionWrapper = enableMotion && !prefersReducedMotion ? motion.div : 'div';

  return (
    <section className={`relative min-h-[80vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden ${className}`}>
      {/* Floating Background Blobs with Neon Glow */}
      {enableMotion && !prefersReducedMotion && (
        <div className="absolute inset-0 -z-10">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float"
            style={{
              background: 'radial-gradient(circle, rgba(255, 28, 247, 0.15) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 70%)'
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-float"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(20, 184, 166, 0.1) 50%, transparent 70%)'
            }}
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-2xl animate-float"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)'
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
            aria-hidden="true"
          />
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content - Left Column */}
          <MotionWrapper
            className="text-center lg:text-left"
            {...(enableMotion && !prefersReducedMotion && {
              initial: "hidden",
              animate: "visible",
              variants: animationVariants,
              transition: { duration: 0.8, delay: 0.2 }
            })}
          >
            <div className="space-y-6">
              {/* Typed Headline with Neon Gradient */}
              <h1 
                ref={headlineRef}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-black leading-tight tracking-tight text-gradient-neon animate-neon-pulse"
                aria-live={!typingComplete ? "polite" : "off"}
              >
                {typedText}
                {showCursor && (
                  <span className="inline-block w-1 h-[1em] bg-primary ml-1 animate-pulse neon-glow" aria-hidden="true">|</span>
                )}
              </h1>

              {/* Subheadline with gradient shimmer */}
              <motion.p
                className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 relative"
                {...(enableMotion && !prefersReducedMotion && {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.8, delay: 1.5 }
                })}
              >
                <span className="relative">
                  Powerful tools and insights to optimize your conversion funnel and grow your business faster than ever.
                  {enableMotion && !prefersReducedMotion && (
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                      animate={{
                        x: ["-200%", "200%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: 2,
                        ease: "easeInOut"
                      }}
                      aria-hidden="true"
                    />
                  )}
                </span>
              </motion.p>

              {/* CTA Buttons with Glassmorphism */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
                {...(enableMotion && !prefersReducedMotion && {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.8, delay: 2 }
                })}
              >
                <Button
                  size="lg"
                  className="glass-hover neon-glow-hover bg-gradient-neon text-white font-semibold px-8 py-4 text-lg rounded-lg transition-all duration-300 border-0 ripple group"
                  aria-label="Start your free trial"
                >
                  <span className="relative z-10">Get Started Free</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="glass glass-hover neon-glow-hover font-semibold px-8 py-4 text-lg rounded-lg transition-all duration-300 group border-primary/30 hover:border-primary/60"
                  aria-label="Explore our conversion tools"
                >
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:text-primary transition-all duration-300" />
                  <span className="group-hover:text-primary transition-colors duration-300">Explore Tools</span>
                </Button>
              </motion.div>
            </div>
          </MotionWrapper>

          {/* Illustration - Right Column */}
          <MotionWrapper
            className="relative flex justify-center lg:justify-end"
            {...(enableMotion && !prefersReducedMotion && {
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.8, delay: 0.6 }
            })}
          >
            <div className="relative w-full max-w-lg lg:max-w-xl">
              {/* Glassmorphism Dashboard Container */}
              <div className="glass neon-glow rounded-2xl p-4 relative animate-float">
                {/* Dashboard Mockup SVG */}
                <svg
                  viewBox="0 0 400 300"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Buzzy Conversions dashboard interface showing conversion analytics and optimization tools"
                >
                  {/* Dashboard Background with Glass Effect */}
                  <defs>
                    <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(15, 15, 25, 0.8)" />
                      <stop offset="100%" stopColor="rgba(15, 15, 25, 0.6)" />
                    </linearGradient>
                    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff1cf7" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>

                  <rect width="400" height="300" rx="16" fill="url(#glassGradient)" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1"/>
                  
                  {/* Header with Neon Accent */}
                  <rect x="0" y="0" width="400" height="60" rx="16" fill="rgba(30, 30, 45, 0.8)"/>
                  <circle cx="30" cy="30" r="6" fill="#ff1cf7" className="animate-pulse"/>
                  <circle cx="50" cy="30" r="6" fill="#8b5cf6" className="animate-pulse"/>
                  <circle cx="70" cy="30" r="6" fill="#06b6d4" className="animate-pulse"/>
                  
                  {/* Navigation with Glass Effect */}
                  <rect x="120" y="18" width="60" height="24" rx="4" fill="url(#neonGradient)" opacity="0.8"/>
                  <rect x="190" y="20" width="40" height="20" rx="4" fill="rgba(139, 92, 246, 0.2)" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="1"/>
                  <rect x="240" y="20" width="50" height="20" rx="4" fill="rgba(139, 92, 246, 0.2)" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="1"/>
                  
                  {/* Main Content Area with Glass */}
                  <rect x="20" y="80" width="360" height="200" rx="8" fill="rgba(15, 15, 25, 0.4)" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="1"/>
                  
                  {/* Chart Area */}
                  <rect x="40" y="100" width="320" height="120" rx="4" fill="rgba(10, 10, 15, 0.6)"/>
                  
                  {/* Animated Neon Chart Line */}
                  {enableMotion && !prefersReducedMotion ? (
                    <motion.path
                      d="M 60 180 Q 120 160 180 140 T 340 120"
                      stroke="url(#neonGradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      filter="drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 1.5, ease: "easeInOut" }}
                    />
                  ) : (
                    <path
                      d="M 60 180 Q 120 160 180 140 T 340 120"
                      stroke="url(#neonGradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      filter="drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))"
                    />
                  )}
                  
                  {/* Data Points with Neon Glow */}
                  <circle cx="60" cy="180" r="4" fill="#ff1cf7" filter="drop-shadow(0 0 4px #ff1cf7)"/>
                  <circle cx="120" cy="160" r="4" fill="#8b5cf6" filter="drop-shadow(0 0 4px #8b5cf6)"/>
                  <circle cx="180" cy="140" r="4" fill="#06b6d4" filter="drop-shadow(0 0 4px #06b6d4)"/>
                  <circle cx="240" cy="130" r="4" fill="#14b8a6" filter="drop-shadow(0 0 4px #14b8a6)"/>
                  <circle cx="340" cy="120" r="4" fill="#ff1cf7" filter="drop-shadow(0 0 4px #ff1cf7)"/>
                  
                  {/* Glass Stats Cards */}
                  <rect x="40" y="240" width="90" height="30" rx="4" fill="rgba(255, 28, 247, 0.1)" stroke="rgba(255, 28, 247, 0.3)" strokeWidth="1"/>
                  <rect x="140" y="240" width="90" height="30" rx="4" fill="rgba(139, 92, 246, 0.1)" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1"/>
                  <rect x="240" y="240" width="90" height="30" rx="4" fill="rgba(6, 182, 212, 0.1)" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1"/>
                  
                  {/* Card Labels with Neon Text */}
                  <text x="85" y="258" textAnchor="middle" fontSize="10" fill="#ff1cf7" fontFamily="var(--font-display)" filter="drop-shadow(0 0 2px #ff1cf7)">+24% CVR</text>
                  <text x="185" y="258" textAnchor="middle" fontSize="10" fill="#8b5cf6" fontFamily="var(--font-display)" filter="drop-shadow(0 0 2px #8b5cf6)">↑ Revenue</text>
                  <text x="285" y="258" textAnchor="middle" fontSize="10" fill="#06b6d4" fontFamily="var(--font-display)" filter="drop-shadow(0 0 2px #06b6d4)">↓ Bounce</text>
                </svg>
              </div>

              {/* Floating Neon Elements */}
              {enableMotion && !prefersReducedMotion && (
                <>
                  <motion.div
                    className="absolute -top-4 -right-4 w-16 h-16 glass neon-glow rounded-full flex items-center justify-center animate-float"
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, 5, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    aria-hidden="true"
                  >
                    <span className="text-sm font-bold text-gradient-neon">+24%</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -bottom-6 -left-6 w-12 h-12 glass neon-glow rounded-full flex items-center justify-center animate-float"
                    animate={{
                      y: [0, 8, 0],
                      rotate: [0, -5, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    aria-hidden="true"
                  >
                    <Play className="w-4 h-4 text-primary neon-glow" />
                  </motion.div>
                </>
              )}
            </div>
          </MotionWrapper>
        </div>
      </div>
    </section>
  );
}