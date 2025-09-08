
"use client";

import React, { useState, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileImage, Upload, Settings, Download, Shield, Zap, Image, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface ConversionOptions {
  format: string;
  quality: number;
  dpi: number;
  pageRange: string;
}

export default function PDFToJPGPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Conversion options
  const [options, setOptions] = useState<ConversionOptions>({
    format: 'jpg',
    quality: 95,
    dpi: 300,
    pageRange: 'all'
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
        setConversionResult(null);
      } else {
        setError('Please select a PDF file.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
        setConversionResult(null);
      } else {
        setError('Please select a PDF file.');
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setConversionResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const pollConversionStatus = async (conversionId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes timeout
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`Polling attempt ${attempts} for conversion ${conversionId}`);
        
        const response = await fetch(`/api/status/${conversionId}`);
        const result = await response.json();
        
        console.log('Status result:', result);
        
        if (result.status === 'completed' && result.success) {
          setConversionResult(result);
          setIsConverting(false);
          setConversionProgress(100);
        } else if (result.status === 'failed' || result.error) {
          setError(result.error || 'Conversion failed');
          setIsConverting(false);
          setConversionProgress(0);
        } else if (attempts < maxAttempts) {
          // Still processing, continue polling
          setConversionProgress(Math.min(90, attempts * 3));
          setTimeout(poll, 5000);
        } else {
          setError('Conversion timeout - please try again');
          setIsConverting(false);
          setConversionProgress(0);
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setError('Failed to check conversion status');
          setIsConverting(false);
          setConversionProgress(0);
        }
      }
    };
    
    poll();
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setIsConverting(true);
    setConversionProgress(10);
    setError(null);
    setConversionResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', options.format);
      formData.append('quality', options.quality.toString());
      formData.append('dpi', options.dpi.toString());
      formData.append('pageRange', options.pageRange);

      const response = await fetch('/api/convert/pdf-to-jpg', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setConversionProgress(20);
        // Start polling for conversion status
        pollConversionStatus(result.conversion_id);
      } else {
        setError(result.error || 'Conversion failed');
        setIsConverting(false);
        setConversionProgress(0);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setError('An error occurred during conversion. Please try again.');
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  const handleDownload = () => {
    if (conversionResult?.download_url) {
      window.open(conversionResult.download_url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
              <FileImage className="w-10 h-10 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                PDF to JPG Converter
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Convert PDF pages to high-quality JPG images. Perfect for sharing, presentations, and web use.
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
              <CardDescription>Convert PDF pages to high-quality JPG images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Upload Area */}
              {!file ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-primary/20 hover:border-primary/40'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop your PDF here</h3>
                  <p className="text-muted-foreground mb-4">or click to browse files</p>
                  <Button className="bg-gradient-to-r from-primary to-primary/90">
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border-2 border-primary/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileImage className="w-10 h-10 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    {!isConverting && !conversionResult && (
                      <Button variant="ghost" size="sm" onClick={removeFile}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Conversion Options */}
              {file && !isConverting && !conversionResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Image Quality (DPI)</label>
                    <select 
                      className="w-full p-3 border rounded-lg"
                      value={options.dpi}
                      onChange={(e) => setOptions({...options, dpi: parseInt(e.target.value)})}
                    >
                      <option value={300}>High (300 DPI)</option>
                      <option value={150}>Medium (150 DPI)</option>
                      <option value={72}>Low (72 DPI)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Page Range</label>
                    <select 
                      className="w-full p-3 border rounded-lg"
                      value={options.pageRange}
                      onChange={(e) => setOptions({...options, pageRange: e.target.value})}
                    >
                      <option value="all">All pages</option>
                      <option value="first">First page only</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Output Format</label>
                    <select 
                      className="w-full p-3 border rounded-lg"
                      value={options.format}
                      onChange={(e) => setOptions({...options, format: e.target.value})}
                    >
                      <option value="jpg">JPG</option>
                      <option value="png">PNG</option>
                    </select>
                  </div>
                </div>
              )}

              {/* JPEG Quality Slider */}
              {file && !isConverting && !conversionResult && options.format === 'jpg' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">JPEG Quality: {options.quality}%</label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={options.quality}
                    onChange={(e) => setOptions({...options, quality: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
              )}

              {/* Convert Button */}
              {file && !conversionResult && (
                <Button 
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 py-6 text-lg"
                >
                  {isConverting ? 'Converting...' : 'Convert to JPG'}
                </Button>
              )}

              {/* Progress Bar */}
              {isConverting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Converting your PDF...</span>
                    <span>{conversionProgress}%</span>
                  </div>
                  <Progress value={conversionProgress} className="w-full" />
                </div>
              )}

              {/* Success Result */}
              {conversionResult && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Conversion completed successfully! 
                      {conversionResult.pages_converted && (
                        <span> {conversionResult.pages_converted} page(s) converted.</span>
                      )}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleDownload}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download {conversionResult.pages_converted > 1 ? 'ZIP File' : 'Image'}
                    </Button>
                    <Button 
                      onClick={removeFile}
                      variant="outline"
                      className="flex-1"
                    >
                      Convert Another
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-accent/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
              High-Quality Image Conversion
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Image className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Crystal Clear Quality</h3>
              <p className="text-muted-foreground">Up to 300 DPI for professional results</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Batch Conversion</h3>
              <p className="text-muted-foreground">Convert all pages or selected pages at once</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Fast Processing</h3>
              <p className="text-muted-foreground">Quick conversion with optimized algorithms</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Privacy Protected</h3>
              <p className="text-muted-foreground">Files automatically deleted after download</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
