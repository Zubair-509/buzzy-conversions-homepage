"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Copyright } from "lucide-react";
import { toast } from "sonner";

const footerLinks = {
  About: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Blog", href: "/blog" },
  ],
  Tools: [
    { label: "Conversion Calculator", href: "/tools/calculator" },
    { label: "A/B Testing", href: "/tools/ab-testing" },
    { label: "Analytics Dashboard", href: "/tools/analytics" },
    { label: "Optimization Suite", href: "/tools/optimization" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Help Center", href: "/help" },
    { label: "Tutorials", href: "/tutorials" },
    { label: "API Reference", href: "/api" },
  ],
  Company: [
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Security", href: "/security" },
  ],
};

const socialLinks = [
  { label: "Twitter", href: "https://twitter.com/buzzyconversions", icon: "𝕏" },
  { label: "LinkedIn", href: "https://linkedin.com/company/buzzyconversions", icon: "in" },
  { label: "GitHub", href: "https://github.com/buzzyconversions", icon: "⚡" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    
    // Simulate newsletter signup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Successfully subscribed to newsletter!");
    setEmail("");
    setIsSubmitting(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <footer className="glass border-t animate-border-glow relative">
        {/* Background with floating neon elements */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-radial opacity-10 animate-float" />
          <div className="absolute bottom-10 left-20 w-48 h-48 bg-gradient-radial opacity-15 animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
            {/* Brand & Newsletter */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-display font-semibold text-gradient-neon mb-2 animate-neon-pulse">
                  Buzzy Conversions
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed hover:text-foreground/80 transition-colors duration-300">
                  Transform your marketing with data-driven conversion optimization tools and insights.
                </p>
              </div>
              
              {/* Glass Newsletter Signup */}
              <div className="glass rounded-2xl p-6 border border-primary/20 animate-border-glow hover:border-primary/40 hover:neon-glow-hover transition-all duration-300">
                <h4 className="text-sm font-display font-medium text-foreground mb-3 hover:text-gradient-neon transition-all duration-300">
                  Stay updated with neon insights
                </h4>
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 text-sm glass border-primary/30 focus:border-primary/60 focus:neon-glow placeholder:text-muted-foreground/60"
                    aria-label="Email address for newsletter"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="shrink-0 glass-hover neon-glow-hover bg-gradient-neon text-white border-0 ripple transition-all duration-300"
                    aria-label="Subscribe to newsletter"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {/* Footer Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-4">
                <h4 className="text-sm font-display font-medium text-gradient-neon">
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary hover:neon-text transition-all duration-300 no-underline hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm glass-hover px-2 py-1 -mx-2 -my-1"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Section with Glass Effect */}
          <div className="pt-8 border-t animate-border-glow">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Neon Social Links */}
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="inline-flex items-center justify-center w-12 h-12 text-sm font-bold glass glass-hover border border-primary/30 hover:border-primary/60 text-primary hover:text-white hover:bg-gradient-neon rounded-full transition-all duration-300 hover:scale-110 hover:neon-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 no-underline animate-border-glow"
                    aria-label={`Follow us on ${social.label}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>

              {/* Copyright & Credits */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground glass rounded-full px-4 py-2 border border-primary/20 hover:border-primary/40 hover:text-primary transition-all duration-300">
                <Copyright className="w-3 h-3 neon-glow" />
                <span>2024 Buzzy Conversions. All rights reserved.</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Scroll to Top Button with Neon Glow */}
      <Button
        onClick={scrollToTop}
        size="sm"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full glass glass-hover neon-glow-hover bg-gradient-neon text-white border-0 hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 z-50 animate-float ripple"
        aria-label="Scroll to top of page"
      >
        <ArrowRight className="w-4 h-4 rotate-[-90deg] drop-shadow-sm" />
      </Button>
    </>
  );
}