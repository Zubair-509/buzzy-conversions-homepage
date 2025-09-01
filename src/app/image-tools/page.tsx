"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Upload, Settings, Download, Image, FileImage, Camera, Zap, Shield, Layers, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: string;
}

interface Feature {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

export default function ImageToolsPage() {
  const router = useRouter();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const imageTools: ToolCard[] = [
    {
      id: "html-to-image",
      title: "HTML to Image",
      description: "Convert HTML code into high-quality PNG or JPG images with pixel-perfect rendering",
      icon: FileImage,
      href: "/tools/html-to-image",
      badge: "Popular"
    },
    {
      id: "jpg-to-png",
      title: "JPG to PNG",
      description: "Convert JPG images to PNG format while preserving quality and adding transparency support",
      icon: Image,
      href: "/tools/jpg-to-png"
    },
    {
      id: "png-to-jpg",
      title: "PNG to JPG",
      description: "Convert PNG images to JPG format with customizable quality settings and background options",
      icon: Camera,
      href: "/tools/png-to-jpg"
    }
  ];

  const features: Feature[] = [
    {
      icon: Zap,
      title: "High Quality Conversion",
      description: "Professional-grade image processing that maintains crisp details and accurate colors"
    },
    {
      icon: Layers,
      title: "Multiple Format Support",
      description: "Support for all major image formats including PNG, JPG, WebP, and more"
    },
    {
      icon: Upload,
      title: "Batch Processing",
      description: "Convert multiple images at once to save time and streamline your workflow"
    },
    {
      icon: Shield,
      title: "Preserves Image Quality",
      description: "Advanced algorithms ensure your images look their best after conversion"
    }
  ];

  const steps: Step[] = [
    {
      number: "01",
      title: "Upload Your Image",
      description: "Drag and drop your image or browse to select files from your device",
      icon: Upload
    },
    {
      number: "02",
      title: "Select Output Format",
      description: "Choose your desired format and customize quality settings if needed",
      icon: Settings
    },
    {
      number: "03",
      title: "Download Converted File",
      description: "Get your converted image instantly with a single click download",
      icon: Download
    }
  ];

  const handleToolClick = (href: string) => {
    router.push(href);
  };

  const handleGetStarted = () => {
    router.push("/tools/html-to-image");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-accent/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
        
        <div className="relative container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              Image Conversion Tools
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 tracking-tight">
              Advanced Image{" "}
              <span className="bg-gradient-to-r from-brand via-brand/80 to-brand/60 bg-clip-text text-transparent">
                Conversion Tools
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Convert and optimize your images with professional quality. 
              From HTML to images to format conversion, get perfect results every time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-brand to-brand/90 hover:from-brand/90 hover:to-brand/80 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Converting
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-6 text-lg font-semibold border-2 hover:bg-accent/50 transition-all duration-200"
              >
                View All Tools
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-24 bg-gradient-to-b from-background to-accent/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Choose Your Tool
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select from our collection of professional image conversion tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {imageTools.map((tool) => {
              const IconComponent = tool.icon;
              const isHovered = hoveredTool === tool.id;

              return (
                <Card
                  key={tool.id}
                  className={`group cursor-pointer border-2 transition-all duration-300 hover:border-brand/20 ${
                    isHovered ? 'transform -translate-y-2 shadow-2xl' : 'hover:shadow-lg'
                  }`}
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                  onClick={() => handleToolClick(tool.href)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br from-brand/10 to-accent/20 transition-all duration-300 ${
                        isHovered ? 'from-brand/20 to-accent/30 scale-110' : ''
                      }`}>
                        <IconComponent className="h-6 w-6 text-brand" />
                      </div>
                      {tool.badge && (
                        <Badge variant="secondary" className="bg-badge-new-bg text-badge-new-text">
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-display font-bold group-hover:text-brand transition-colors">
                      {tool.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground mb-6 leading-relaxed">
                      {tool.description}
                    </CardDescription>
                    <Button 
                      className="w-full group-hover:bg-brand group-hover:text-brand-contrast transition-all duration-200"
                      variant="outline"
                    >
                      Try Now
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-accent/20 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Why Choose Our Tools?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-grade features designed for quality and efficiency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              
              return (
                <div
                  key={index}
                  className="text-center group hover:transform hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-brand/10 to-accent/20 inline-block mb-6 group-hover:from-brand/20 group-hover:to-accent/30 transition-all duration-300">
                    <IconComponent className="h-8 w-8 text-brand" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3 group-hover:text-brand transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-24 bg-gradient-to-b from-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Convert your images in three simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                
                return (
                  <div key={index} className="relative text-center group">
                    {/* Connection Line */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-brand/30 to-transparent transform translate-x-1/2 z-0" />
                    )}
                    
                    <div className="relative z-10">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-brand/10 to-accent/20 inline-block mb-6 group-hover:from-brand/20 group-hover:to-accent/30 transition-all duration-300 group-hover:scale-110">
                        <IconComponent className="h-10 w-10 text-brand" />
                      </div>
                      
                      <div className="mb-4">
                        <span className="text-sm font-mono text-brand font-bold bg-brand/10 px-3 py-1 rounded-full">
                          {step.number}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-display font-bold mb-3 group-hover:text-brand transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-brand to-brand/90 hover:from-brand/90 hover:to-brand/80 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}