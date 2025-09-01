"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Upload, RotateCw, Download, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HowItWorksProps {
  className?: string;
}

const steps = [
  {
    id: 1,
    icon: Upload,
    title: "Upload Your Files",
    description: "Select and upload your documents, images, or any file type you need to convert.",
    position: "left"
  },
  {
    id: 2,
    icon: RotateCw,
    title: "Choose Format & Convert",
    description: "Pick your desired output format and let our AI-powered conversion engine do the work.",
    position: "right"
  },
  {
    id: 3,
    icon: Download,
    title: "Download Results",
    description: "Get your converted files instantly with perfect quality and formatting preserved.",
    position: "left"
  }
];

export default function HowItWorks({ className = "" }: HowItWorksProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Intersection observer for step animations
  useEffect(() => {
    if (reducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepIndex = parseInt(entry.target.getAttribute('data-step') || '0');
            setVisibleSteps(prev => new Set([...prev, stepIndex]));
          }
        });
      },
      { threshold: 0.3 }
    );

    const stepElements = sectionRef.current?.querySelectorAll('[data-step]');
    stepElements?.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [reducedMotion]);

  // Demo mode automation
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setActiveStep(prev => (prev + 1) % steps.length);
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  const handleDemoToggle = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setActiveStep(0);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  return (
    <section 
      ref={sectionRef}
      className={`py-24 relative ${className}`}
      aria-labelledby="how-it-works-title"
    >
      {/* Background with floating neon shapes */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-radial opacity-20 animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-radial opacity-15 animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 
            id="how-it-works-title"
            className="text-3xl md:text-4xl font-display font-bold text-gradient-neon mb-4 animate-neon-pulse"
          >
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Convert your files in three simple steps. Fast, secure, and reliable file conversion made easy.
          </p>

          {/* Demo Controls */}
          <Button
            onClick={handleDemoToggle}
            variant="outline"
            size="sm"
            className="glass glass-hover border-primary/30 hover:border-primary/60 hover:bg-gradient-neon hover:text-white transition-all duration-300 inline-flex items-center gap-2 neon-glow-hover"
            aria-controls="steps-demo"
            aria-label={isPlaying ? "Pause demo" : "Play demo"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause Demo" : "Play Demo"}
          </Button>
        </div>

        {/* Steps Container */}
        <div 
          id="steps-demo"
          className="relative"
          role="region"
          aria-label="File conversion process steps"
        >
          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="relative flex items-center justify-between max-w-4xl mx-auto">
              {/* Glowing Connector Lines */}
              <div className="absolute top-1/2 left-16 right-16 h-1 -translate-y-1/2 z-0">
                <div className="h-full bg-primary/20 rounded-full" />
                <div 
                  className={`h-full bg-gradient-neon rounded-full transition-all duration-1000 ease-in-out neon-glow ${
                    reducedMotion ? '' : 'animate-glow'
                  }`}
                  style={{
                    width: `${((activeStep + 1) / steps.length) * 100}%`,
                    animation: reducedMotion ? 'none' : undefined
                  }}
                />
              </div>

              {/* Steps */}
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = activeStep >= index;
                const isVisible = visibleSteps.has(index) || reducedMotion;

                return (
                  <div
                    key={step.id}
                    data-step={index}
                    className={`relative z-10 flex flex-col items-center cursor-pointer group transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    } ${
                      step.position === 'left' && !reducedMotion ? 'lg:translate-x-4' : ''
                    } ${
                      step.position === 'right' && !reducedMotion ? 'lg:-translate-x-4' : ''
                    }`}
                    onClick={() => handleStepClick(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleStepClick(index);
                      }
                    }}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                  >
                    {/* Glass Step Card */}
                    <div className={`glass glass-hover rounded-2xl p-6 mb-4 transition-all duration-300 border animate-border-glow ${
                      isActive 
                        ? 'border-primary/60 neon-glow bg-gradient-neon/10' 
                        : 'border-primary/20 hover:border-primary/40'
                    }`}>
                      {/* Step Icon */}
                      <div 
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 mx-auto ${
                          isActive 
                            ? 'bg-gradient-neon text-white neon-glow animate-glow' 
                            : 'glass border border-primary/30 text-primary group-hover:border-primary/60 group-hover:text-white group-hover:bg-gradient-neon/20'
                        }`}
                      >
                        <StepIcon 
                          className={`w-8 h-8 transition-all duration-300 ${
                            isActive && !reducedMotion ? 'animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''
                          } ${
                            activeStep === index && !reducedMotion ? 'animate-bounce' : ''
                          }`} 
                        />
                      </div>

                      {/* Step Content */}
                      <div className="text-center max-w-sm">
                        <h3 className={`text-lg font-display font-semibold mb-3 transition-colors duration-300 ${
                          isActive ? 'text-gradient-neon' : 'text-foreground group-hover:text-primary'
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                          {step.description}
                        </p>
                      </div>

                      {/* Step Number */}
                      <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-neon text-white neon-glow animate-pulse' 
                          : 'glass border border-primary/30 text-primary'
                      }`}>
                        {step.id}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = activeStep >= index;
              const isVisible = visibleSteps.has(index) || reducedMotion;

              return (
                <div key={step.id} className="relative">
                  {/* Vertical Glowing Connector */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-8 top-24 w-1 h-12">
                      <div className="w-full h-full bg-primary/20 rounded-full" />
                      <div 
                        className={`w-full bg-gradient-neon rounded-full transition-all duration-500 neon-glow ${
                          isActive ? 'h-full' : 'h-0'
                        }`}
                      />
                    </div>
                  )}

                  <div
                    data-step={index}
                    className={`glass glass-hover rounded-2xl p-5 border animate-border-glow cursor-pointer group transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                    } ${
                      isActive ? 'border-primary/60 neon-glow bg-gradient-neon/10' : 'border-primary/20 hover:border-primary/40'
                    }`}
                    onClick={() => handleStepClick(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleStepClick(index);
                      }
                    }}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Step Icon */}
                      <div 
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-neon text-white neon-glow animate-glow' 
                            : 'glass border border-primary/30 text-primary group-hover:border-primary/60 group-hover:text-white group-hover:bg-gradient-neon/20'
                        }`}
                      >
                        <StepIcon 
                          className={`w-8 h-8 transition-all duration-300 ${
                            isActive && !reducedMotion ? 'animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''
                          } ${
                            activeStep === index && !reducedMotion ? 'animate-bounce' : ''
                          }`} 
                        />

                        {/* Step Number */}
                        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-neon text-white neon-glow animate-pulse' 
                            : 'glass border border-primary/30 text-primary'
                        }`}>
                          {step.id}
                        </div>
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 pt-2">
                        <h3 className={`text-lg font-display font-semibold mb-2 transition-colors duration-300 ${
                          isActive ? 'text-gradient-neon' : 'text-foreground group-hover:text-primary'
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Glowing Progress Indicator */}
        <div className="flex justify-center mt-12">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeStep >= index 
                    ? 'bg-gradient-neon neon-glow animate-pulse' 
                    : 'glass border border-primary/30 hover:border-primary/60'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}