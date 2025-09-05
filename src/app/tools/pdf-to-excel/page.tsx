
"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSpreadsheet, Upload, Settings, Download, Shield, Zap, Table, CheckCircle, FileX, AlertCircle } from 'lucide-react';

interface ConversionResult {
  success: boolean;
  conversion_id?: string;
  message?: string;
  error?: string;
  status_url?: string;
  download_url?: string;
  filename?: string;
  method?: string;
}

export default function PDFToExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setConversionResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const pollConversionStatus = async (conversionId: string) => {
    try {
      const response = await fetch(`/api/status/${conversionId}`);
      const result = await response.json();
      
      if (result.status === 'completed' && result.success) {
        setProgress(100);
        setConversionResult({
          success: true,
          download_url: result.download_url,
          filename: result.filename,
          message: `Conversion completed successfully using ${result.metadata?.method || 'advanced'} method`,
          method: result.metadata?.method
        });
        setIsConverting(false);
      } else if (result.status === 'failed' || result.error) {
        setConversionResult({
          success: false,
          error: result.error || 'Conversion failed'
        });
        setIsConverting(false);
      } else {
        // Still processing, continue polling
        setTimeout(() => pollConversionStatus(conversionId), 2000);
        setProgress(prev => Math.min(prev + 10, 90));
      }
    } catch (error) {
      console.error('Error polling status:', error);
      setConversionResult({
        success: false,
        error: 'Failed to check conversion status'
      });
      setIsConverting(false);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setProgress(10);
    setConversionResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/convert/pdf-to-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.conversion_id) {
        setProgress(30);
        // Start polling for conversion status
        setTimeout(() => pollConversionStatus(result.conversion_id), 1000);
      } else {
        setConversionResult({
          success: false,
          error: result.error || 'Failed to start conversion'
        });
        setIsConverting(false);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setConversionResult({
        success: false,
        error: 'Failed to convert PDF to Excel'
      });
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (conversionResult?.download_url) {
      const link = document.createElement('a');
      link.href = conversionResult.download_url;
      link.download = conversionResult.filename || 'converted.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetConverter = () => {
    setFile(null);
    setIsConverting(false);
    setConversionResult(null);
    setProgress(0);
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
              <FileSpreadsheet className="w-10 h-10 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                PDF to Excel Converter
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Extract tables and data from PDFs to Excel spreadsheets with advanced formatting, image, and table preservation.
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
              <CardDescription>Extract tables and data to Excel format with advanced formatting preservation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                  isDragActive || dragActive
                    ? 'border-primary/60 bg-primary/5' 
                    : 'border-primary/20 hover:border-primary/40'
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="space-y-4">
                    <FileSpreadsheet className="w-12 h-12 text-primary mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">{file.name}</h3>
                      <p className="text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        resetConverter();
                      }}
                    >
                      Choose Different File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-primary mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Drop your PDF here</h3>
                      <p className="text-muted-foreground mb-4">or click to browse files</p>
                    </div>
                    <Button className="bg-gradient-to-r from-primary to-primary/90">
                      Choose File
                    </Button>
                  </div>
                )}
              </div>

              {/* Conversion Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Table Detection</label>
                  <select className="w-full p-3 border rounded-lg bg-background">
                    <option>Auto-detect tables and data</option>
                    <option>Enhanced table extraction</option>
                    <option>Text-only extraction</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Formatting</label>
                  <select className="w-full p-3 border rounded-lg bg-background">
                    <option>Preserve original formatting</option>
                    <option>Clean formatting</option>
                    <option>Basic table format</option>
                  </select>
                </div>
              </div>

              {/* Conversion Progress */}
              {isConverting && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Converting PDF to Excel...</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Processing tables, images, and formatting. This may take a few moments.
                  </p>
                </div>
              )}

              {/* Results */}
              {conversionResult && (
                <Alert className={conversionResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center space-x-2">
                    {conversionResult.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <AlertDescription className={conversionResult.success ? "text-green-800" : "text-red-800"}>
                      {conversionResult.success ? (
                        <div className="space-y-2">
                          <p>{conversionResult.message}</p>
                          {conversionResult.method && (
                            <p className="text-sm">Method: {conversionResult.method}</p>
                          )}
                        </div>
                      ) : (
                        <p>{conversionResult.error}</p>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {conversionResult?.success ? (
                  <>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Excel File
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={resetConverter}
                    >
                      Convert Another PDF
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 py-6 text-lg"
                    onClick={handleConvert}
                    disabled={!file || isConverting}
                  >
                    {isConverting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Convert to Excel
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-accent/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
              Advanced Table & Data Extraction
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our enhanced converter maintains consistency in formatting, layout, images, and tables
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Table className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Smart Table Detection</h3>
              <p className="text-muted-foreground">Automatically identifies and extracts tables with precision</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Formatting Preservation</h3>
              <p className="text-muted-foreground">Maintains original formatting, borders, and cell styling</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Multiple Methods</h3>
              <p className="text-muted-foreground">Uses advanced algorithms for optimal extraction quality</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Data Integrity</h3>
              <p className="text-muted-foreground">Preserves numbers, formulas, and data relationships</p>
            </div>
          </div>

          {/* Enhanced Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-primary" />
                  <span>Advanced Processing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• PyMuPDF enhanced extraction for complex layouts</li>
                  <li>• Multiple fallback methods for maximum compatibility</li>
                  <li>• Image extraction and cataloging</li>
                  <li>• Structured data pattern recognition</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <span>Excel Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Multi-sheet support for multi-page PDFs</li>
                  <li>• Automatic column width adjustment</li>
                  <li>• Header row formatting and styling</li>
                  <li>• Data type preservation (numbers, text, dates)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
