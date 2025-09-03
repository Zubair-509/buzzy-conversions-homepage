"use client";

import React, { useState, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, Settings, Download, Shield, Zap, Clock, CheckCircle } from 'lucide-react';


export default function PDFToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'uploading' | 'converting' | 'completed' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [conversionMode, setConversionMode] = useState<'standard' | 'fast' | 'accurate' | 'hybrid'>('standard');
  const [conversionMethod, setConversionMethod] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setConversionStatus('idle');
      setErrorMessage('');
      setDownloadUrl(null);
      setConversionMethod(null);
      setFileSize(selectedFile.size);
    } else {
      setErrorMessage('Please select a valid PDF file.');
      setFile(null);
      setFileSize(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }

    setIsConverting(true);
    setConversionStatus('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', conversionMode);

      setConversionStatus('converting');

      const response = await fetch('/api/convert/pdf-to-word', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setConversionStatus('completed');
        setDownloadUrl(`/api/download/${result.download_id}/${result.filename}`);
        setDownloadFilename(result.filename);
        setConversionMethod(result.conversion_method || 'Unknown');
        setFileSize(result.output_size || 0);
      } else {
        throw new Error(result.error || 'Conversion failed');
      }
    } catch (error) {
      setConversionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred.');
      setConversionMethod(null);
      setFileSize(0);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
              <div 
                className="border-2 border-dashed border-primary/20 rounded-xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {file ? file.name : 'Drop your PDF file here'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {file ? `File size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Support for PDF files up to 16MB'}
                </p>
                <Button 
                  variant="outline" 
                  className="bg-gradient-to-r from-primary to-primary/90"
                  disabled={isConverting}
                >
                  {file ? 'Change File' : 'Choose File'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Conversion Mode Selector */}
              {file && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Conversion Mode</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        mode: 'standard' as const,
                        title: 'Auto (Recommended)',
                        description: 'Automatically detects PDF type and uses the best method',
                        icon: <Settings className="w-5 h-5" />
                      },
                      {
                        mode: 'fast' as const,
                        title: 'Fast',
                        description: 'Quick conversion with basic formatting',
                        icon: <Zap className="w-5 h-5" />
                      },
                      {
                        mode: 'accurate' as const,
                        title: 'Accurate',
                        description: 'Preserves complex formatting and layout',
                        icon: <CheckCircle className="w-5 h-5" />
                      },
                      {
                        mode: 'hybrid' as const,
                        title: 'Hybrid',
                        description: 'Background image with editable text overlay',
                        icon: <Shield className="w-5 h-5" />
                      }
                    ].map((option) => (
                      <Card 
                        key={option.mode}
                        className={`cursor-pointer transition-all ${
                          conversionMode === option.mode 
                            ? 'ring-2 ring-primary border-primary/50' 
                            : 'hover:border-primary/30'
                        }`}
                        onClick={() => setConversionMode(option.mode)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="flex justify-center mb-2">
                            {option.icon}
                          </div>
                          <h4 className="font-semibold text-sm mb-1">{option.title}</h4>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {conversionStatus === 'uploading' && (
                <div className="text-center p-6 bg-primary/5 rounded-lg">
                  <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-primary font-medium">Uploading file...</p>
                </div>
              )}

              {conversionStatus === 'converting' && (
                <div className="text-center p-6 bg-primary/5 rounded-lg">
                  <Settings className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                  <p className="text-primary font-medium">Converting PDF to Word...</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Using {conversionMode} mode - This may take a few moments
                  </p>
                  <div className="mt-4 w-full bg-primary/10 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              )}

              {conversionStatus === 'completed' && downloadUrl && (
                <div className="text-center p-6 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-500 font-medium mb-2">Conversion completed successfully!</p>
                  <div className="text-sm text-muted-foreground mb-4 space-y-1">
                    {conversionMethod && <p>Method: {conversionMethod}</p>}
                    {fileSize > 0 && <p>Output size: {(fileSize / 1024 / 1024).toFixed(2)} MB</p>}
                  </div>
                  <Button 
                    onClick={() => window.open(downloadUrl, '_blank')}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download {downloadFilename}
                  </Button>
                </div>
              )}

              {conversionStatus === 'error' && errorMessage && (
                <div className="text-center p-6 bg-red-500/10 rounded-lg">
                  <p className="text-red-500 font-medium">Error: {errorMessage}</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Try a different conversion mode or check if your PDF is valid.
                  </p>
                </div>
              )}

              <Button 
                onClick={handleConvert}
                disabled={!file || isConverting}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConverting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Converting...
                  </>
                ) : (
                  'Convert to Word'
                )}
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