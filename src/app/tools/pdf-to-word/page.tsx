
"use client";

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, Settings, Download, Shield, Zap, Clock, CheckCircle } from 'lucide-react';

export default function PDFToWordPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                PDF to Word Converter
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Convert PDF documents to editable Word files with precision. Maintain formatting, images, and layout integrity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conversion Tool Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-primary/10 shadow-xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-display">Upload Your PDF</CardTitle>
              <CardDescription>Select a PDF file to convert to Word format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-primary/20 rounded-xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Drop your PDF here</h3>
                <p className="text-muted-foreground mb-4">or click to browse files</p>
                <Button className="bg-gradient-to-r from-primary to-primary/90">
                  Choose File
                </Button>
              </div>

              {/* Conversion Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Output Format</label>
                  <select className="w-full p-3 border rounded-lg">
                    <option>Microsoft Word (.docx)</option>
                    <option>Rich Text Format (.rtf)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conversion Mode</label>
                  <select className="w-full p-3 border rounded-lg">
                    <option>Standard (Recommended)</option>
                    <option>High Accuracy</option>
                    <option>Fast Conversion</option>
                  </select>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 py-6 text-lg">
                Convert to Word
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
              Why Choose Our PDF to Word Converter?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Secure Processing</h3>
              <p className="text-muted-foreground">Your files are encrypted and deleted after conversion</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">Convert PDFs to Word in seconds</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">High Accuracy</h3>
              <p className="text-muted-foreground">Maintains formatting, fonts, and layout</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">No Registration</h3>
              <p className="text-muted-foreground">Start converting immediately without signup</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto text-white">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-sm font-medium text-primary bg-primary/10 rounded-full px-3 py-1 inline-block">
                Step 1
              </div>
              <h3 className="text-xl font-display font-semibold">Upload PDF</h3>
              <p className="text-muted-foreground">Select your PDF file from your device or drag and drop it</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto text-white">
                <Settings className="w-8 h-8" />
              </div>
              <div className="text-sm font-medium text-primary bg-primary/10 rounded-full px-3 py-1 inline-block">
                Step 2
              </div>
              <h3 className="text-xl font-display font-semibold">Configure Settings</h3>
              <p className="text-muted-foreground">Choose output format and conversion preferences</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto text-white">
                <Download className="w-8 h-8" />
              </div>
              <div className="text-sm font-medium text-primary bg-primary/10 rounded-full px-3 py-1 inline-block">
                Step 3
              </div>
              <h3 className="text-xl font-display font-semibold">Download Word File</h3>
              <p className="text-muted-foreground">Get your converted Word document instantly</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
