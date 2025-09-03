"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Logo from "@/components/Logo";
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleRouteChangeStart = () => setIsLoading(true);
    const handleRouteChangeComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Clean up the event listeners
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events]);


  const navigationLinks = [
    { name: "Home", href: "/" },
    { name: "PDF Tools", href: "/pdf-tools" },
    { name: "Image Tools", href: "/image-tools" },
    { name: "Pricing", href: "/pricing" },
  ];

  const handleGetStarted = () => {
    // Emit sign-up event or navigate to registration
    console.log("Get Started clicked");
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/30 backdrop-blur-xl">
          <Logo size="lg" showText={true} />
        </div>
      )}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? "bg-background/20 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-primary/5"
            : "bg-background/10 backdrop-blur-lg"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link
                href="/"
                className="no-underline"
              >
                <Logo size="md" showText={true} />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-muted-foreground hover:text-primary transition-all duration-300 text-sm font-medium no-underline hover:neon-text hover:animate-neon-pulse ${
                    pathname === link.href ? 'text-primary neon-text animate-neon-pulse' : ''
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/sign-in"
                className="text-muted-foreground hover:text-primary transition-all duration-300 text-sm font-medium no-underline hover:neon-text"
              >
                Sign In
              </Link>
              <Button
                onClick={handleGetStarted}
                className="glass-hover neon-glow-hover bg-gradient-neon text-white px-6 py-2 text-sm font-medium transition-all duration-300 border-0 ripple"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 glass-hover neon-glow-hover"
                    aria-label="Open mobile menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[300px] sm:w-[400px] bg-background/30 backdrop-blur-xl border-l border-white/10"
                >
                  <div className="flex flex-col space-y-6 pt-6">
                    {/* Mobile Logo */}
                    <Logo size="md" showText={true} />

                    {/* Mobile Navigation */}
                    <nav className="flex flex-col space-y-4">
                      {navigationLinks.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={closeMobileMenu}
                          className={`text-muted-foreground hover:text-primary transition-all duration-300 text-base font-medium py-2 no-underline hover:neon-text glass-hover rounded-lg px-4 ${
                            pathname === link.href ? 'text-primary neon-text animate-neon-pulse' : ''
                          }`}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </nav>

                    {/* Mobile Auth Actions */}
                    <div className="flex flex-col space-y-3 pt-6 border-t border-white/10">
                      <Link
                        href="/sign-in"
                        onClick={closeMobileMenu}
                        className="text-muted-foreground hover:text-primary transition-all duration-300 text-base font-medium py-2 no-underline hover:neon-text glass-hover rounded-lg px-4"
                      >
                        Sign In
                      </Link>
                      <Button
                        onClick={() => {
                          handleGetStarted();
                          closeMobileMenu();
                        }}
                        className="glass-hover neon-glow-hover bg-gradient-neon text-white px-6 py-3 text-base font-medium transition-all duration-300 w-full border-0 ripple"
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}