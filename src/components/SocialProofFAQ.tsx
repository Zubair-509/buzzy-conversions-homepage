"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Quote, SquareArrowRight, MessageCircleQuestionMark } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface SocialProofFAQProps {
  className?: string;
  testimonials?: Testimonial[];
  faqs?: FAQ[];
  companyLogos?: Array<{ name: string; logo: string }>;
  autoAdvanceMs?: number;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Marketing Director',
    company: 'TechFlow',
    content: 'Buzzy Conversions transformed our landing pages. We saw a 340% increase in conversion rates within the first month.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b3c5?w=64&h=64&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    role: 'Growth Manager',
    company: 'StartupLab',
    content: 'The A/B testing tools are incredible. We optimized our entire funnel and doubled our revenue in 3 months.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Emily Watson',
    role: 'Product Manager',
    company: 'ScaleUp Inc',
    content: 'Finally, a conversion tool that actually works. The insights helped us understand our users better than ever.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face'
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Founder',
    company: 'InnovateCorp',
    content: 'Buzzy Conversions paid for itself in the first week. The ROI is absolutely incredible.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face'
  }
];

const defaultFAQs: FAQ[] = [
  {
    id: '1',
    question: 'How quickly can I see results?',
    answer: 'Most users see significant improvements within 24-48 hours of implementing our optimization suggestions. Our AI analyzes your traffic patterns and provides instant recommendations for conversion improvements.'
  },
  {
    id: '2',
    question: 'Do I need technical knowledge to use Buzzy Conversions?',
    answer: 'Not at all! Our platform is designed for marketers, founders, and business owners without technical backgrounds. Simply paste your URL and our AI handles the complex analysis and provides clear, actionable recommendations.'
  },
  {
    id: '3',
    question: 'What types of websites work best with your platform?',
    answer: 'Buzzy Conversions works with any website or landing page - from e-commerce stores to SaaS signup pages, lead generation forms, and service-based businesses. Our AI adapts to your specific industry and audience.'
  },
  {
    id: '4',
    question: 'Can I integrate with my existing analytics tools?',
    answer: 'Yes! We integrate seamlessly with Google Analytics, Facebook Pixel, HubSpot, and dozens of other popular marketing tools. Your existing tracking setup remains untouched while gaining powerful new insights.'
  },
  {
    id: '5',
    question: 'Is there a free trial available?',
    answer: 'Absolutely! Start with our 14-day free trial - no credit card required. You\'ll get full access to all features and can analyze up to 3 pages during your trial period.'
  },
  {
    id: '6',
    question: 'How does the A/B testing feature work?',
    answer: 'Our AI automatically creates multiple variations of your page elements and tests them with real visitors. You\'ll see live results and can implement winning variations with a single click - no coding required.'
  },
  {
    id: '7',
    question: 'What kind of support do you provide?',
    answer: 'We offer 24/7 chat support, comprehensive documentation, video tutorials, and weekly optimization workshops. Our team of conversion experts is always ready to help you maximize your results.'
  },
  {
    id: '8',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel anytime with no questions asked. We believe in earning your business every month with results, not contracts. Your data remains accessible for 30 days after cancellation.'
  }
];

const StarRating = ({ rating, animated = false }: { rating: number; animated?: boolean }) => {
  const [visibleStars, setVisibleStars] = useState(animated ? 0 : rating);

  useEffect(() => {
    if (!animated) return;

    const timer = setTimeout(() => {
      if (visibleStars < rating) {
        setVisibleStars(prev => prev + 1);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [visibleStars, rating, animated]);

  useEffect(() => {
    if (animated) {
      setVisibleStars(0);
    }
  }, [animated]);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 transition-all duration-300 ${
            star <= visibleStars ? 'text-yellow-400 fill-current drop-shadow-[0_0_4px_rgba(251,191,36,0.8)] animate-pulse' : 'text-muted-foreground/30'
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const TestimonialCard = ({ testimonial, isActive }: { testimonial: Testimonial; isActive: boolean }) => {
  return (
    <Card className={`flex-shrink-0 w-full glass glass-hover animate-border-glow transition-all duration-500 border-primary/20 hover:border-primary/40 ${
      isActive ? 'opacity-100 scale-100 neon-glow border-primary/60' : 'opacity-70 scale-95'
    }`}>
      <CardContent className="p-8">
        <div className="flex items-start gap-4">
          <Quote className="w-8 h-8 text-primary/40 flex-shrink-0 mt-1 neon-glow animate-pulse" />
          <div className="flex-1">
            <blockquote className="text-lg font-medium text-foreground mb-4 leading-relaxed hover:text-gradient-neon transition-all duration-300">
              "{testimonial.content}"
            </blockquote>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full glass overflow-hidden border border-primary/30 neon-glow-hover">
                  {testimonial.avatar ? (
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-neon/20 flex items-center justify-center text-primary font-display font-semibold border border-primary/30">
                      {testimonial.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-display font-semibold text-foreground hover:text-gradient-neon transition-all duration-300">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
              <StarRating rating={testimonial.rating} animated={isActive} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TestimonialSkeleton = () => (
  <Card className="flex-shrink-0 w-full glass animate-border-glow border-primary/20">
    <CardContent className="p-8">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-muted/20 rounded animate-pulse" />
        <div className="flex-1">
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-muted/20 rounded animate-pulse" />
            <div className="h-4 bg-muted/20 rounded animate-pulse w-4/5" />
            <div className="h-4 bg-muted/20 rounded animate-pulse w-3/5" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted/20 animate-pulse" />
              <div>
                <div className="h-4 bg-muted/20 rounded animate-pulse w-24 mb-1" />
                <div className="h-3 bg-muted/20 rounded animate-pulse w-32" />
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-4 h-4 bg-muted/20 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function SocialProofFAQ({
  className = '',
  testimonials = defaultTestimonials,
  faqs = defaultFAQs,
  companyLogos,
  autoAdvanceMs = 5000
}: SocialProofFAQProps) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const nextTestimonial = useCallback(() => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevTestimonial = useCallback(() => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Auto-advance functionality
  useEffect(() => {
    if (!isPlaying || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      nextTestimonial();
    }, autoAdvanceMs);

    return () => clearInterval(interval);
  }, [isPlaying, nextTestimonial, autoAdvanceMs]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseEnter = () => setIsPlaying(false);
  const handleMouseLeave = () => setIsPlaying(true);

  return (
    <section className={`py-24 relative ${className}`}>
      {/* Background with floating neon elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-radial opacity-20 animate-float" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-radial opacity-15 animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6 px-4 pb-2 leading-tight text-foreground">
            Trusted by <mark className="bg-gradient-neon text-white px-3 py-1 rounded-full neon-glow animate-pulse">10,000+</mark> businesses worldwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our customers say about their conversion results and get answers to common questions.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="mb-20">
          <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {isLoading ? (
                  <TestimonialSkeleton />
                ) : (
                  testimonials.map((testimonial, index) => (
                    <TestimonialCard
                      key={testimonial.id}
                      testimonial={testimonial}
                      isActive={index === currentTestimonial}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Navigation Controls */}
            {!isLoading && testimonials.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevTestimonial}
                  className="w-10 h-10 p-0 glass glass-hover border-primary/30 hover:border-primary/60 hover:bg-gradient-neon hover:text-white neon-glow-hover transition-all duration-300"
                  aria-label="Previous testimonial"
                >
                  <SquareArrowRight className="w-4 h-4 rotate-180" />
                </Button>

                {/* Glowing Dots Indicator */}
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial 
                          ? 'bg-gradient-neon w-8 neon-glow animate-pulse' 
                          : 'glass border border-primary/30 hover:border-primary/60 hover:bg-gradient-neon/20'
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextTestimonial}
                  className="w-10 h-10 p-0 glass glass-hover border-primary/30 hover:border-primary/60 hover:bg-gradient-neon hover:text-white neon-glow-hover transition-all duration-300"
                  aria-label="Next testimonial"
                >
                  <SquareArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Company Logos */}
        {companyLogos && companyLogos.length > 0 && (
          <div className="mb-20">
            <p className="text-center text-sm text-muted-foreground mb-8">
              Trusted by leading companies
            </p>
            <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
              {companyLogos.map((company) => (
                <img
                  key={company.name}
                  src={company.logo}
                  alt={company.name}
                  className="h-8 object-contain grayscale hover:grayscale-0 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                />
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 glass border border-primary/30 rounded-full text-primary mb-4 neon-glow-hover transition-all duration-300">
              <MessageCircleQuestionMark className="w-4 h-4 neon-glow" />
              <span className="text-sm font-medium font-display">Frequently Asked Questions</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-gradient-neon animate-neon-pulse">
              Everything you need to know
            </h3>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq) => (
              <AccordionItem 
                key={faq.id} 
                value={faq.id}
                className="glass border border-primary/20 rounded-2xl px-6 animate-border-glow data-[state=open]:border-primary/60 data-[state=open]:neon-glow data-[state=open]:bg-gradient-neon/5 transition-all duration-300"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6 group">
                  <span className="font-display font-semibold text-foreground group-hover:text-gradient-neon group-data-[state=open]:text-gradient-neon transition-all duration-300">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-0 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Still have questions? We're here to help.
            </p>
            <Button 
              variant="outline" 
              className="font-medium glass glass-hover border-primary/30 hover:border-primary/60 hover:bg-gradient-neon hover:text-white neon-glow-hover transition-all duration-300"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}