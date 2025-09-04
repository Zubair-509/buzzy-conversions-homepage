"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Upload, 
  Download, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  FileIcon,
  X
} from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  downloadUrl?: string;
  error?: string;
}

export default function PDFToWordPage() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file, index) => ({
      file,
      id: `${Date.now()}-${index}`,
      status: 'pending',
      progress: 0,
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const convertFiles = async () => {
    setIsConverting(true);
    
    // Convert each file
    for (const file of uploadedFiles.filter(f => f.status === 'pending')) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'converting', progress: 0 } : f
      ));

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file.file);

        // Send to backend conversion API
        const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
        const response = await fetch(`${pythonApiUrl}/api/convert/pdf-to-word`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          const conversionId = result.conversion_id;
          
          // Poll for conversion status
          let attempts = 0;
          const maxAttempts = 60; // 60 seconds max
          
          const pollStatus = async () => {
            try {
              const statusResponse = await fetch(`${pythonApiUrl}/api/status/${conversionId}`);
              const statusData = await statusResponse.json();
              
              if (statusData.status === 'completed' && statusData.success) {
                setUploadedFiles(prev => prev.map(f => 
                  f.id === file.id ? { 
                    ...f, 
                    status: 'completed', 
                    progress: 100,
                    downloadUrl: `${pythonApiUrl}${statusData.download_url}`
                  } : f
                ));
              } else if (statusData.status === 'failed') {
                setUploadedFiles(prev => prev.map(f => 
                  f.id === file.id ? { 
                    ...f, 
                    status: 'error', 
                    error: statusData.error || 'Conversion failed'
                  } : f
                ));
              } else if (attempts < maxAttempts) {
                // Still processing, update progress and continue polling
                const progress = Math.min(90, (attempts / maxAttempts) * 80 + 10);
                setUploadedFiles(prev => prev.map(f => 
                  f.id === file.id ? { ...f, progress } : f
                ));
                
                attempts++;
                setTimeout(pollStatus, 1000); // Poll every second
              } else {
                // Timeout
                setUploadedFiles(prev => prev.map(f => 
                  f.id === file.id ? { 
                    ...f, 
                    status: 'error', 
                    error: 'Conversion timeout. Please try again.'
                  } : f
                ));
              }
            } catch (error) {
              setUploadedFiles(prev => prev.map(f => 
                f.id === file.id ? { 
                  ...f, 
                  status: 'error', 
                  error: 'Failed to check conversion status'
                } : f
              ));
            }
          };
          
          // Start polling
          setTimeout(pollStatus, 1000);
          
        } else {
          setUploadedFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'error', 
              error: result.error || 'Conversion failed'
            } : f
          ));
        }
        
      } catch (error) {
        console.error('Conversion error:', error);
        setUploadedFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error', 
            error: `Network error: ${error.message}`
          } : f
        ));
      }
    }
    
    setIsConverting(false);
  };

  const downloadFile = (downloadUrl: string, filename: string) => {
    // In a real app, this would trigger the actual download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'converting':
        return <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <FileIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,theme(colors.primary/10),transparent_50%)]"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/pdf-tools')}
              className="mb-8 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to PDF Tools
            </Button>
            
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                PDF to Word Converter
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Convert your PDF files to editable Word documents while preserving formatting and layout
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conversion Tool Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-display">Upload PDF Files</CardTitle>
              <CardDescription>
                Select PDF files to convert to Word documents. Maximum file size: 50MB per file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                  ${isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-accent/20'
                  }
                `}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop PDF files here' : 'Drag & drop PDF files here'}
                  </p>
                  <p className="text-muted-foreground">
                    or click to browse from your device
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports: PDF files up to 50MB each
                  </p>
                </div>
              </div>

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Uploaded Files</h3>
                  <div className="space-y-3">
                    {uploadedFiles.map((uploadedFile) => (
                      <div
                        key={uploadedFile.id}
                        className="flex items-center justify-between p-4 border border-border rounded-xl bg-accent/5"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          {getStatusIcon(uploadedFile.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {uploadedFile.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(uploadedFile.file.size)}
                            </p>
                            {uploadedFile.status === 'converting' && (
                              <div className="mt-2">
                                <Progress value={uploadedFile.progress} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Converting... {uploadedFile.progress}%
                                </p>
                              </div>
                            )}
                            {uploadedFile.error && (
                              <p className="text-xs text-red-500 mt-1">
                                {uploadedFile.error}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {uploadedFile.status === 'completed' && uploadedFile.downloadUrl && (
                            <Button
                              size="sm"
                              onClick={() => downloadFile(uploadedFile.downloadUrl!, uploadedFile.file.name.replace('.pdf', '.docx'))}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                          {uploadedFile.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(uploadedFile.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Convert Button */}
              {uploadedFiles.filter(f => f.status === 'pending').length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={convertFiles}
                    disabled={isConverting}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 px-12"
                  >
                    {isConverting ? 'Converting...' : 'Convert to Word'}
                  </Button>
                </div>
              )}

              {/* Status Alert */}
              {uploadedFiles.length > 0 && !isConverting && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Note: This is a demonstration version. In the full version, your files would be securely processed and converted to Word format.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-accent/10 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold">
              Why Choose Our PDF to Word Converter?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience professional-grade conversion with advanced features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-semibold">Preserves Formatting</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Maintain original layout, fonts, and styling in your converted Word documents
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-semibold">High Accuracy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Advanced OCR technology ensures accurate text recognition and conversion
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-semibold">Batch Processing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Convert multiple PDF files to Word documents simultaneously
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}