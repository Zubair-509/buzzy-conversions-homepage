"use client";

import React, { useState, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, Settings, Download, Shield, Zap, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'uploading' | 'converting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [conversionMethod, setConversionMethod] = useState<string | null>(null);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && (selectedFile.name.toLowerCase().endsWith('.docx') || selectedFile.name.toLowerCase().endsWith('.doc'))) {
      setFile(selectedFile);
      setConversionStatus('idle');
      setErrorMessage('');
      setDownloadUrl(null);
      setConversionMethod(null);
      setConversionId(null);
      setFileSize(selectedFile.size);
    } else {
      setErrorMessage('Please select a valid Word document (.doc or .docx).');
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

  const pollConversionStatus = async (conversionId: string) => {
    try {
      const response = await fetch(`/api/status/${conversionId}`);
      const result = await response.json();

      if (result.success) {
        setConversionStatus('success');
        setDownloadUrl(result.download_url);
        setConversionMethod(result.method);
      } else if (result.status === 'processing') {
        // Continue polling
        setTimeout(() => pollConversionStatus(conversionId), 2000);
      } else {
        setConversionStatus('error');
        setErrorMessage(result.error || 'Conversion failed');
      }
    } catch (error) {
      console.error('Status polling error:', error);
      setConversionStatus('error');
      setErrorMessage('Failed to check conversion status');
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setErrorMessage('Please select a Word document first.');
      return;
    }

    setIsConverting(true);
    setConversionStatus('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setConversionStatus('converting');

      const response = await fetch('/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setConversionId(result.conversion_id);
        // Start polling for conversion status
        setTimeout(() => pollConversionStatus(result.conversion_id), 1000);
      } else {
        setConversionStatus('error');
        setErrorMessage(result.error || 'Conversion failed. Please try again.');
      }
    } catch (error) {
      setConversionStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
      console.error('Conversion error:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileSize(0);
    setConversionStatus('idle');
    setErrorMessage('');
    setDownloadUrl(null);
    setConversionMethod(null);
    setConversionId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                Word to PDF Converter
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Convert Word documents to professional PDF files. Preserve formatting, fonts, images, tables, and layout perfectly.
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
              <CardTitle className="text-2xl font-display">Upload Your Word Document</CardTitle>
              <CardDescription>Convert .doc, .docx files to PDF format with perfect formatting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-primary/20 rounded-xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{file ? file.name : 'Drop your Word file here'}</h3>
                <p className="text-muted-foreground mb-4">Support for .doc, .docx formats</p>
                <input
                  type="file"
                  accept=".docx,.doc"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                {file && (
                  <p className="text-sm text-muted-foreground">Size: {(fileSize / 1024).toFixed(2)} KB</p>
                )}
              </div>

              {/* Conversion Status and Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-2 text-red-500 p-4 border border-red-500/30 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {conversionStatus === 'converting' && (
                <div className="flex items-center gap-2 text-blue-500 p-4 border border-blue-500/30 bg-blue-500/10 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <p>Converting your document... This may take a moment.</p>
                </div>
              )}

              {conversionStatus === 'success' && downloadUrl && (
                <div className="flex items-center justify-between gap-4 p-4 border border-green-500/30 bg-green-500/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-green-700">Conversion successful!</p>
                  </div>
                  {conversionMethod && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-500/50">
                      Method: {conversionMethod}
                    </Badge>
                  )}
                  <a href={downloadUrl} download className="ml-auto">
                    <Button size="sm" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                      <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                  </a>
                </div>
              )}

              {/* Conversion Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">PDF Quality</label>
                  <select className="w-full p-3 border rounded-lg">
                    <option>Standard (Recommended)</option>
                    <option>High Quality (Larger file)</option>
                    <option>Compressed (Smaller file)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Page Orientation</label>
                  <select className="w-full p-3 border rounded-lg">
                    <option>Keep original</option>
                    <option>Portrait</option>
                    <option>Landscape</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleConvert}
                disabled={!file || isConverting}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConverting ? 'Converting...' : 'Convert to PDF'}
              </Button>

              {(file || conversionStatus !== 'idle') && (
                <Button variant="outline" onClick={resetForm} className="w-full">
                  Reset
                </Button>
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
              Professional PDF Creation
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Convert Word documents with complete accuracy, preserving all formatting, images, and tables
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Format Preservation</h3>
              <p className="text-muted-foreground">Maintains all formatting, fonts, images, and tables perfectly</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Universal Compatibility</h3>
              <p className="text-muted-foreground">Works with all Word versions (.doc and .docx)</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">Convert documents in seconds with multiple conversion methods</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Secure Processing</h3>
              <p className="text-muted-foreground">Your documents are safe and private during conversion</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}