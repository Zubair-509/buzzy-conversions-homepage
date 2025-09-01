"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowDownUp, CreditCard, PanelTopDashed, Columns3, LayoutPanelTop } from 'lucide-react';
import { toast } from 'sonner';

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  popular?: boolean;
  ctaText: string;
}

const benefits: Benefit[] = [
  {
    icon: <ArrowDownUp className="w-6 h-6" />,
    title: "Lightning Fast",
    description: "Optimize conversions in real-time with blazing speed"
  },
  {
    icon: <PanelTopDashed className="w-6 h-6" />,
    title: "Secure & Reliable",
    description: "Enterprise-grade security for your data and campaigns"
  },
  {
    icon: <Columns3 className="w-6 h-6" />,
    title: "Cloud-Based",
    description: "Access your campaigns from anywhere, anytime"
  },
  {
    icon: <LayoutPanelTop className="w-6 h-6" />,
    title: "Infinitely Scalable",
    description: "Grow from startup to enterprise without limits"
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Freemium Model",
    description: "Start free, upgrade when you're ready to scale"
  }
];

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for getting started',
    features: [
      'Up to 1,000 monthly conversions',
      'Basic analytics dashboard',
      'Email support',
      'Standard templates'
    ],
    ctaText: 'Get Started Free'
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: 'Best for growing businesses',
    features: [
      'Up to 10,000 monthly conversions',
      'Advanced analytics & reporting',
      'Priority support',
      'Custom templates',
      'A/B testing tools',
      'API access'
    ],
    popular: true,
    ctaText: 'Start Pro Trial'
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 149,
    yearlyPrice: 119,
    description: 'For enterprise-scale operations',
    features: [
      'Unlimited conversions',
      'Advanced segmentation',
      'Dedicated account manager',
      'Custom integrations',
      'White-label solutions',
      'SLA guarantee'
    ],
    ctaText: 'Contact Sales'
  }
];

export default function BenefitsPricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [visibleBenefits, setVisibleBenefits] = useState<boolean[]>(new Array(benefits.length).fill(false));
  const [showPricing, setShowPricing] = useState(false);
  const [expandedComparison, setExpandedComparison] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const benefitsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  // Persist billing preference in session
  useEffect(() => {
    const savedBilling = sessionStorage.getItem('billing-preference');
    if (savedBilling === 'yearly') {
      setIsYearly(true);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('billing-preference', isYearly ? 'yearly' : 'monthly');
  }, [isYearly]);

  // Intersection Observer for staggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === benefitsRef.current) {
              // Staggered reveal for benefits
              benefits.forEach((_, index) => {
                setTimeout(() => {
                  setVisibleBenefits(prev => {
                    const newState = [...prev];
                    newState[index] = true;
                    return newState;
                  });
                }, index * 150);
              });
            } else if (entry.target === pricingRef.current) {
              setShowPricing(true);
            }
          }
        });
      },
      { threshold: 0.2, rootMargin: '-50px' }
    );

    if (benefitsRef.current) observer.observe(benefitsRef.current);
    if (pricingRef.current) observer.observe(pricingRef.current);

    return () => observer.disconnect();
  }, []);

  const handlePlanSelect = (planId: string) => {
    if (planId === 'free') {
      setShowModal(true);
    } else if (planId === 'business') {
      toast.success('Redirecting to sales team...');
    } else {
      setShowModal(true);
    }
  };

  const SignupModal = () => (
    showModal && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass neon-glow rounded-2xl p-8 max-w-md w-full border border-primary/30 animate-fade-up">
          <h3 className="text-lg font-display font-semibold mb-4 text-gradient-neon">Get Started with Buzzy Conversions</h3>
          <p className="text-muted-foreground mb-6">
            Ready to supercharge your conversion rates? Create your account now.
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => {
                setShowModal(false);
                toast.success('Redirecting to signup...');
              }}
              className="flex-1 glass-hover neon-glow-hover bg-gradient-neon text-white border-0 ripple"
            >
              Create Account
            </Button>
            <Button 
              onClick={() => setShowModal(false)}
              variant="outline"
              className="glass border-primary/30 hover:border-primary/60"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="py-24 space-y-24 relative">
      {/* Background with floating neon elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-radial opacity-20 animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-radial opacity-15 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Benefits Section */}
      <div ref={benefitsRef} className="space-y-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-gradient-neon animate-neon-pulse">
            Why Choose Buzzy Conversions?
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to transform visitors into customers, backed by enterprise-grade infrastructure.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`group transition-all duration-700 transform ${
                visibleBenefits[index] 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="glass glass-hover rounded-2xl p-6 border border-primary/20 hover:border-primary/60 neon-glow-hover animate-border-glow transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-gradient-neon/20 rounded-lg border border-primary/30 text-primary group-hover:border-primary/60 group-hover:text-white group-hover:bg-gradient-neon/40 group-hover:neon-glow transition-all duration-300">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-2 group-hover:text-gradient-neon transition-all duration-300">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm group-hover:text-foreground/80 transition-colors duration-300">{benefit.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div ref={pricingRef} className="space-y-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-gradient-neon animate-neon-pulse">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Choose the perfect plan for your business. Upgrade or downgrade at any time.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 glass border border-primary/30 rounded-lg">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                !isYearly 
                  ? 'bg-gradient-neon text-white neon-glow' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                isYearly 
                  ? 'bg-gradient-neon text-white neon-glow' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="text-xs glass border border-primary/30 text-primary animate-pulse">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={`grid md:grid-cols-3 gap-8 transition-all duration-500 ${
          showPricing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {pricingPlans.map((plan, index) => (
            <Card
              key={plan.id}
              className={`relative glass glass-hover animate-border-glow transition-all duration-300 ${
                plan.popular 
                  ? 'border-primary/60 neon-glow bg-gradient-neon/10 scale-105' 
                  : 'border-primary/20 hover:border-primary/40 hover:neon-glow-hover'
              } ${showPricing ? 'animate-fade-up' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-neon text-white border border-primary/30 neon-glow animate-pulse">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold font-display text-gradient-neon">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  {isYearly && plan.monthlyPrice > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed annually (${(isYearly ? plan.yearlyPrice : plan.monthlyPrice) * 12}/year)
                    </p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3 text-sm">
                      <div className="w-4 h-4 rounded-full bg-gradient-neon/20 border border-primary/30 flex items-center justify-center mt-0.5 flex-shrink-0 neon-glow">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full transition-all duration-300 ripple ${
                    plan.popular 
                      ? 'glass-hover neon-glow-hover bg-gradient-neon text-white border-0' 
                      : 'glass border-primary/30 hover:border-primary/60 hover:bg-gradient-neon hover:text-white'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <span className="relative z-10">{plan.ctaText}</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Compare Features */}
        <div className="text-center">
          <Collapsible open={expandedComparison} onOpenChange={setExpandedComparison}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground hover:text-primary glass-hover border border-primary/20 hover:border-primary/40 transition-all duration-300">
                Compare all features
                <ArrowDownUp className={`ml-2 w-4 h-4 transition-transform duration-300 ${
                  expandedComparison ? 'rotate-180' : ''
                }`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-8">
              <div className="glass rounded-2xl p-8 border border-primary/20 animate-border-glow">
                <div className="grid md:grid-cols-3 gap-8 text-sm">
                  <div className="space-y-4">
                    <h4 className="font-display font-semibold mb-3 text-gradient-neon">Analytics & Reporting</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Real-time dashboard</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Conversion tracking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Custom reports</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Data export</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-display font-semibold mb-3 text-gradient-neon">Integrations</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Popular CRM systems</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Email marketing tools</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Social media platforms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Custom webhooks</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-display font-semibold mb-3 text-gradient-neon">Support</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>24/7 email support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Live chat (Pro+)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Phone support (Business)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 neon-glow" />
                        <span>Dedicated manager (Business)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="relative">
        <div className="glass rounded-3xl p-12 text-center border border-primary/30 animate-border-glow neon-glow-hover transition-all duration-300 bg-gradient-neon/5">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-gradient-neon animate-neon-pulse">
            Start Converting More Visitors Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Buzzy Conversions to boost their revenue. 
            Setup takes less than 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => setShowModal(true)}
              className="relative overflow-hidden group glass-hover neon-glow-hover bg-gradient-neon text-white border-0 ripple transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-gradient-shift transition-opacity duration-500" />
              <span className="relative z-10">Start Converting Now</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="glass border-primary/30 hover:border-primary/60 hover:bg-gradient-neon hover:text-white transition-all duration-300"
            >
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>

      <SignupModal />
    </div>
  );
}