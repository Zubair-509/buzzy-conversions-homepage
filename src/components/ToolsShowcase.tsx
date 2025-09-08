"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Grid2x2, 
  ZoomIn, 
  Grid3x2, 
  PanelTopDashed, 
  ListFilter, 
  GalleryThumbnails, 
  GalleryVertical, 
  LayoutGrid,
  InspectionPanel,
  LayoutPanelTop,
  Component,
  Lasso,
  PanelTop,
  PanelRight,
  LayoutPanelLeft,
  LassoSelect,
  TabletSmartphone,
  FileText,
  FileSpreadsheet,
  Code
} from "lucide-react";

// Import router if it's used for navigation
import { useRouter } from 'next/navigation'; 

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "pdf" | "image";
  badge?: "new" | "popular";
  route?: string;
}

const tools: Tool[] = [
  {
    id: "pdf-splitter",
    name: "PDF Splitter",
    description: "Split large PDFs into smaller, manageable documents",
    icon: Grid2x2,
    category: "pdf",
    badge: "popular"
  },
  {
    id: "pdf-merger", 
    name: "PDF Merger",
    description: "Combine multiple PDFs into a single document",
    icon: Grid3x2,
    category: "pdf"
  },
  {
    id: "pdf-compressor",
    name: "PDF Compressor", 
    description: "Reduce PDF file size without losing quality",
    icon: PanelTopDashed,
    category: "pdf"
  },
  {
    id: "pdf-converter",
    name: "PDF Converter",
    description: "Convert PDFs to various formats like Word, Excel, PowerPoint",
    icon: LayoutPanelTop,
    category: "pdf",
    badge: "new"
  },
  {
    id: "pdf-editor",
    name: "PDF Editor",
    description: "Edit text, images, and annotations in PDF documents",
    icon: InspectionPanel,
    category: "pdf"
  },
  {
    id: "pdf-protector",
    name: "PDF Protector",
    description: "Add password protection and security to your PDFs",
    icon: PanelTop,
    category: "pdf"
  },
  {
    id: "word-to-pdf", // Added route for Word to PDF
    name: "Word to PDF",
    description: "Convert Word documents to PDF format while preserving formatting and layout",
    icon: FileText, // Assuming FileText is used for this tool
    category: "pdf",
    route: "/tools/word-to-pdf"
  },
  {
    id: "excel-to-pdf", // Added Excel to PDF tool
    name: "Excel to PDF",
    description: "Convert Excel spreadsheets to PDF format while preserving charts, formatting, and formulas",
    icon: FileSpreadsheet,
    category: "pdf",
    route: "/tools/excel-to-pdf"
  },
  {
    id: "html-to-pdf",
    name: "HTML to PDF",
    description: "Convert HTML files to PDF format while preserving formatting, layout, images, and styling",
    icon: Code,
    category: "pdf",
    route: "/tools/html-to-pdf",
    badge: "new"
  },
  {
    id: "powerpoint-to-pdf", // Added new tool ID
    name: "PowerPoint to PDF",
    description: "Convert PowerPoint presentations to PDF while preserving slides, images, and templates",
    icon: FileText, // Assuming FileText is used for this tool as well
    category: "pdf",
    route: "/tools/powerpoint-to-pdf", // Added route for PowerPoint to PDF
    badge: "new" // Optional badge
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Resize images while maintaining aspect ratio and quality",
    icon: ZoomIn,
    category: "image",
    badge: "popular"
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Reduce image file size for faster web loading",
    icon: GalleryThumbnails,
    category: "image"
  },
  {
    id: "image-converter",
    name: "Image Converter",
    description: "Convert between JPG, PNG, WebP, and other formats",
    icon: GalleryVertical,
    category: "image",
    badge: "new"
  },
  {
    id: "image-editor",
    name: "Image Editor",
    description: "Crop, rotate, adjust colors, and apply filters",
    icon: LayoutGrid,
    category: "image"
  },
  {
    id: "background-remover",
    name: "Background Remover",
    description: "Remove backgrounds from images automatically",
    icon: LassoSelect,
    category: "image",
    badge: "popular"
  },
  {
    id: "batch-processor",
    name: "Batch Processor",
    description: "Process multiple images at once with batch operations",
    icon: TabletSmartphone,
    category: "image"
  }
];

function SkeletonCard() {
  return (
    <Card className="glass animate-border-glow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-muted/20 rounded-lg animate-pulse"></div>
          <div className="w-16 h-5 bg-muted/20 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-5 bg-muted/20 rounded animate-pulse"></div>
          <div className="h-4 bg-muted/20 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-muted/20 rounded animate-pulse w-1/2"></div>
        </div>
        <div className="mt-4 h-9 bg-muted/20 rounded-lg animate-pulse"></div>
      </CardContent>
    </Card>
  );
}

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-20px" });
  const IconComponent = tool.icon;
  const router = useRouter(); // Initialize router

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
    >
      <Card className="group glass glass-hover neon-glow-hover animate-border-glow cursor-pointer h-full transition-all duration-300 border-primary/20 hover:border-primary/60"
        onClick={() => {
          if (tool.route) {
            router.push(tool.route);
          } else {
            console.log(`Opening ${tool.name}`);
            // Fallback or default action if no route is specified
          }
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              animate={isInView ? { rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] } : {}}
              transition={{ 
                duration: 0.6, 
                delay: (index * 0.1) + 0.3,
                ease: "easeOut"
              }}
              className="p-3 bg-gradient-neon/20 rounded-lg border border-primary/30 group-hover:border-primary/60 group-hover:animate-glow transition-all duration-300"
            >
              <IconComponent className="w-6 h-6 text-primary group-hover:text-white transition-all duration-300 drop-shadow-sm group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
            </motion.div>
            {tool.badge && (
              <Badge 
                variant={tool.badge === "new" ? "default" : "secondary"}
                className={tool.badge === "new" 
                  ? "bg-gradient-neon text-white border border-primary/30 neon-glow animate-pulse" 
                  : "glass border border-primary/20 text-primary"
                }
              >
                {tool.badge}
              </Badge>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-gradient-neon transition-all duration-300">
              {tool.name}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
              {tool.description}
            </p>
          </div>

          <Button 
            variant="outline" 
            className="w-full glass glass-hover border-primary/30 hover:border-primary/60 hover:bg-gradient-neon hover:text-white transition-all duration-300 ripple group-hover:neon-glow"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card's onClick from firing
              if (tool.route) {
                router.push(tool.route);
              } else {
                console.log(`Opening ${tool.name}`);
              }
            }}
          >
            <span className="relative z-10">Open Tool</span>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ToolsShowcase() {
  const [activeTab, setActiveTab] = useState<"pdf" | "image">("pdf");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter tools based on active tab and search query
  const filteredTools = useMemo(() => {
    let filtered = tools.filter(tool => tool.category === activeTab);

    if (debouncedSearchQuery) {
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [activeTab, debouncedSearchQuery]);

  // Simulate loading when switching tabs
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, [activeTab]);

  return (
    <section 
      ref={containerRef}
      className="w-full py-16 lg:py-24 relative"
    >
      {/* Background with floating elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-radial opacity-30 animate-float" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-gradient-radial opacity-20 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6 px-4 pb-2 leading-tight text-gradient-neon animate-neon-pulse"
          >
            Powerful Tools for Every Need
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Professional-grade PDF and image processing tools designed to streamline your workflow
          </motion.p>
        </div>

        {/* Tabs and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "pdf" | "image")}
            className="w-full"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <TabsList className="glass border border-primary/30 grid w-full max-w-md grid-cols-2">
                <TabsTrigger 
                  value="pdf" 
                  className="data-[state=active]:bg-gradient-neon data-[state=active]:text-white data-[state=active]:neon-glow transition-all duration-300"
                  aria-label="PDF Tools"
                >
                  PDF Tools
                </TabsTrigger>
                <TabsTrigger 
                  value="image"
                  className="data-[state=active]:bg-gradient-neon data-[state=active]:text-white data-[state=active]:neon-glow transition-all duration-300" 
                  aria-label="Image Tools"
                >
                  Image Tools
                </TabsTrigger>
              </TabsList>

              <div className="relative max-w-sm w-full">
                <ListFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4 neon-glow" />
                <Input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass border-primary/30 focus:border-primary/60 focus:neon-glow placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* PDF Tools */}
            <TabsContent value="pdf" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                ) : filteredTools.length > 0 ? (
                  filteredTools.map((tool, index) => (
                    <ToolCard key={tool.id} tool={tool} index={index} />
                  ))
                ) : (
                  // Empty state
                  <div className="col-span-full text-center py-12">
                    <div className="glass rounded-lg p-8 border-primary/20">
                      <p className="text-muted-foreground text-lg mb-2">No PDF tools found</p>
                      <p className="text-muted-foreground text-sm">
                        Try adjusting your search query or browse all tools
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Image Tools */}
            <TabsContent value="image" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                  // Loading skeleton  
                  Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                ) : filteredTools.length > 0 ? (
                  filteredTools.map((tool, index) => (
                    <ToolCard key={tool.id} tool={tool} index={index} />
                  ))
                ) : (
                  // Empty state
                  <div className="col-span-full text-center py-12">
                    <div className="glass rounded-lg p-8 border-primary/20">
                      <p className="text-muted-foreground text-lg mb-2">No image tools found</p>
                      <p className="text-muted-foreground text-sm">
                        Try adjusting your search query or browse all tools
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}