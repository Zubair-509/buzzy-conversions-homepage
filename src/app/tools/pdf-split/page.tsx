
"use client";

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Split, Upload, Settings, Download, Shield, Zap, Scissors, CheckCircle } from 'lucide-react';

export default function PDFSplitPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
              <Split className="w-10 h-10 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                PDF Split Tool
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Extract specific pages or split PDFs into separate files. Perfect for organizing large documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Split Tool Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-primary/10 shadow-xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-display">Upload PDF to Split</CardTitle>
              <CardDescription>Extract pages or split your PDF into multiple documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-primary/20 rounded-xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Drop your PDF here</h3>
                <p className="text-muted-foreground mb-4">Select the PDF file you want to split</p>
                <Button className="bg-gradient-to-r from-primary to-primary/90">
                  Choose File
                </Button>
              </div>

              {/* Split Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Split Method</label>
                  <select className="w-full p-3 border rounded-lg">
                    <option>Extract specific pages</option>
                    <option>Split by page range</option>
                    <option>Split every N pages</option>
                    <option>Split by bookmarks</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Page Range</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 1-5, 10, 15-20"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 py-6 text-lg">
                Split PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-accent/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
              Flexible PDF Splitting
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Scissors className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Precise Extraction</h3>
              <p className="text-muted-foreground">Extract exact pages you need</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Multiple Options</h3>
              <p className="text-muted-foreground">Various splitting methods available</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Fast Processing</h3>
              <p className="text-muted-foreground">Quick splitting of large documents</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Original Quality</h3>
              <p className="text-muted-foreground">Maintains all original formatting</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
