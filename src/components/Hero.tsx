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
        <div className="flex justify-center items-center">
          {/* Text Content - Left Column */}
          <MotionWrapper
            className="text-center"
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
                className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto relative"
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
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
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

          
        </div>
      </div>
    </section>
  );
}