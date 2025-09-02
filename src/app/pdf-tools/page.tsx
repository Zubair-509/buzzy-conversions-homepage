"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  Presentation, 
  Upload, 
  Settings, 
  Download, 
  Zap, 
  Shield, 
  Monitor, 
  Layers,
  Merge,
  Split,
  Minimize,
  Code
} from 'lucide-react';

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  fromFormat?: string;
  toFormat?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, href, fromFormat, toFormat }) => {
  const router = useRouter();
  
  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };
  
  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-border/50 hover:border-primary/20" onClick={handleClick}>
      <CardHeader className="pb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <CardTitle className="text-lg font-display">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transition-all duration-300"
          size="sm"
        >
          Try Now
        </Button>
      </CardContent>
    </Card>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ 
  icon, 
  title, 
  description 
}) => {
  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-display font-semibold">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const StepCard: React.FC<{ number: string; title: string; description: string; icon: React.ReactNode }> = ({ 
  number, 
  title, 
  description, 
  icon 
}) => {
  return (
    <div className="relative">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto text-white">
          {icon}
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-primary bg-primary/10 rounded-full px-3 py-1 inline-block">
            Step {number}
          </div>
          <h3 className="text-xl font-display font-semibold">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default function PDFToolsPage() {
  const pdfConversionTools = [
    {
      icon: <FileText className="w-6 h-6 text-primary" />,
      title: "PDF to Word",
      description: "Convert PDF documents to editable Word files with precision",
      href: "/tools/pdf-to-word"
    },
    {
      icon: <Presentation className="w-6 h-6 text-primary" />,
      title: "PDF to PowerPoint",
      description: "Transform PDFs into editable PowerPoint presentations",
      href: "/tools/pdf-to-powerpoint"
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-primary" />,
      title: "PDF to Excel",
      description: "Extract tables and data from PDFs to Excel spreadsheets",
      href: "/tools/pdf-to-excel"
    },
    {
      icon: <FileImage className="w-6 h-6 text-primary" />,
      title: "PDF to JPG",
      description: "Convert PDF pages to high-quality JPG images",
      href: "/tools/pdf-to-jpg"
    }
  ];

  const toPdfTools = [
    {
      icon: <FileText className="w-6 h-6 text-primary" />,
      title: "Word to PDF",
      description: "Convert Word documents to professional PDF files",
      href: "/tools/word-to-pdf"
    },
    {
      icon: <Presentation className="w-6 h-6 text-primary" />,
      title: "PowerPoint to PDF",
      description: "Transform presentations into PDF format",
      href: "/tools/powerpoint-to-pdf"
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-primary" />,
      title: "Excel to PDF",
      description: "Convert spreadsheets to PDF with formatting intact",
      href: "/tools/excel-to-pdf"
    },
    {
      icon: <Code className="w-6 h-6 text-primary" />,
      title: "HTML to PDF",
      description: "Generate PDF files from HTML web pages",
      href: "/tools/html-to-pdf"
    },
    {
      icon: <FileImage className="w-6 h-6 text-primary" />,
      title: "JPG to PDF",
      description: "Create PDF documents from image files",
      href: "/tools/jpg-to-pdf"
    }
  ];

  const pdfUtilityTools = [
    {
      icon: <Merge className="w-6 h-6 text-primary" />,
      title: "PDF Merge",
      description: "Combine multiple PDF files into a single document",
      href: "/tools/pdf-merge"
    },
    {
      icon: <Split className="w-6 h-6 text-primary" />,
      title: "PDF Split",
      description: "Extract specific pages or split PDFs into separate files",
      href: "/tools/pdf-split"
    },
    {
      icon: <Minimize className="w-6 h-6 text-primary" />,
      title: "PDF Compress",
      description: "Reduce PDF file size while maintaining quality",
      href: "/tools/pdf-compress"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,theme(colors.primary/10),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,theme(colors.accent/20),transparent_50%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                Powerful PDF Conversion Tools
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Convert, merge, split, and compress your PDF files with ease using our comprehensive suite of professional tools
              </p>
            </div>
            
            
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
              Complete PDF Toolkit
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to work with PDF files efficiently and professionally
            </p>
          </div>

          {/* PDF Conversion Tools */}
          <div className="space-y-16">
            <div>
              <h3 className="text-2xl font-display font-semibold mb-8 text-center">PDF Conversion Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {pdfConversionTools.map((tool, index) => (
                  <ToolCard key={index} {...tool} />
                ))}
              </div>
            </div>

            {/* To PDF Tools */}
            <div>
              <h3 className="text-2xl font-display font-semibold mb-8 text-center">Convert to PDF</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {toPdfTools.map((tool, index) => (
                  <ToolCard key={index} {...tool} />
                ))}
              </div>
            </div>

            {/* PDF Utility Tools */}
            <div>
              <h3 className="text-2xl font-display font-semibold mb-8 text-center">PDF Utilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pdfUtilityTools.map((tool, index) => (
                  <ToolCard key={index} {...tool} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-accent/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
              Why Choose Our PDF Tools?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the benefits of professional-grade PDF processing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-primary" />}
              title="Lightning Fast"
              description="Process your files in seconds with our optimized conversion engine"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-primary" />}
              title="Secure Processing"
              description="Your files are encrypted and automatically deleted after processing"
            />
            <FeatureCard
              icon={<Monitor className="w-8 h-8 text-primary" />}
              title="No Installation"
              description="Work directly in your browser without downloading any software"
            />
            <FeatureCard
              icon={<Layers className="w-8 h-8 text-primary" />}
              title="Batch Processing"
              description="Convert multiple files simultaneously to save time"
            />
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get your files converted in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <StepCard
              number="1"
              icon={<Upload className="w-8 h-8" />}
              title="Upload Your File"
              description="Select and upload your PDF or source file directly from your device or cloud storage"
            />
            <StepCard
              number="2"
              icon={<Settings className="w-8 h-8" />}
              title="Choose Conversion"
              description="Select your desired output format and adjust any conversion settings if needed"
            />
            <StepCard
              number="3"
              icon={<Download className="w-8 h-8" />}
              title="Download Results"
              description="Get your converted file instantly and download it to your preferred location"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
                Ready to Convert Your Files?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of users who trust our PDF tools for their daily conversion needs
              </p>
            </div>
            
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-lg px-12 py-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              Get Started for Free
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}