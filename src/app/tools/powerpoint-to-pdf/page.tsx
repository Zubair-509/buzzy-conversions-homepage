
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Download, CheckCircle, XCircle, Loader2, FileIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ConversionResult {
  success: boolean;
  conversion_id?: string;
  status?: string;
  filename?: string;
  download_url?: string;
  error?: string;
  message?: string;
  metadata?: {
    pages?: number;
    file_size?: number;
    method?: string;
  };
}

export default function PowerPointToPDFPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
          file.name.toLowerCase().endsWith('.pptx')) {
        setSelectedFile(file);
        setResult(null);
        toast.success(`Selected ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        toast.error('Please select a valid PowerPoint file (.pptx)');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
          file.name.toLowerCase().endsWith('.pptx')) {
        setSelectedFile(file);
        setResult(null);
        toast.success(`Selected ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        toast.error('Please select a valid PowerPoint file (.pptx)');
      }
    }
  };

  const pollConversionStatus = async (conversionId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/status/${conversionId}`);
        const statusResult = await response.json();

        if (statusResult.status === 'completed' && statusResult.success) {
          setProgress(100);
          setResult(statusResult);
          setIsConverting(false);
          toast.success('PowerPoint successfully converted to PDF!');
          return;
        } else if (statusResult.status === 'failed') {
          setResult(statusResult);
          setIsConverting(false);
          toast.error(`Conversion failed: ${statusResult.error}`);
          return;
        } else if (statusResult.status === 'processing') {
          // Update progress based on time elapsed
          const progressValue = Math.min(90, (attempts / maxAttempts) * 90);
          setProgress(progressValue);
          
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            setIsConverting(false);
            toast.error('Conversion timed out. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
        setIsConverting(false);
        toast.error('Error checking conversion status');
      }
    };

    poll();
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.error('Please select a PowerPoint file first');
      return;
    }

    setIsConverting(true);
    setProgress(10);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/convert/powerpoint-to-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.conversion_id) {
        toast.success('Conversion started! Processing your PowerPoint file...');
        pollConversionStatus(data.conversion_id);
      } else {
        setIsConverting(false);
        toast.error(data.error || 'Conversion failed');
      }
    } catch (error) {
      setIsConverting(false);
      console.error('Error:', error);
      toast.error('An error occurred during conversion');
    }
  };

  const handleDownload = async () => {
    if (!result?.download_url) return;

    try {
      const response = await fetch(result.download_url);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || 'converted.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Download started!');
      } else {
        toast.error('Failed to download file');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error downloading file');
    }
  };

  const resetConverter = () => {
    setSelectedFile(null);
    setIsConverting(false);
    setProgress(0);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full mr-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">PowerPoint to PDF</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Convert your PowerPoint presentations to PDF format while preserving formatting, layout, images, and slide templates
          </p>
        </div>

        {/* Main Converter Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileIcon className="mr-2 h-5 w-5" />
              PowerPoint to PDF Converter
            </CardTitle>
            <CardDescription>
              Upload your PPTX file and convert it to a high-quality PDF document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={handleFileSelect}
              />
              
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              
              {selectedFile ? (
                <div>
                  <p className="text-lg font-medium text-green-700 mb-2">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for conversion
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop your PowerPoint file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports .pptx files up to 50MB
                  </p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {isConverting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Converting PowerPoint to PDF...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleConvert}
                disabled={!selectedFile || isConverting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Convert to PDF
                  </>
                )}
              </Button>

              {result?.success && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="lg"
                  className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}

              <Button
                onClick={resetConverter}
                variant="outline"
                size="lg"
                className="sm:w-auto"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        {result && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                {result.success ? (
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
                )}
                Conversion {result.success ? 'Successful' : 'Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Status</p>
                      <p className="text-lg font-semibold text-green-800">Complete</p>
                    </div>
                    {result.metadata?.pages && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Pages</p>
                        <p className="text-lg font-semibold text-blue-800">{result.metadata.pages}</p>
                      </div>
                    )}
                    {result.metadata?.file_size && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">File Size</p>
                        <p className="text-lg font-semibold text-purple-800">
                          {(result.metadata.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {result.metadata?.method && (
                    <p className="text-sm text-gray-600">
                      Conversion method: <span className="font-medium">{result.metadata.method}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">
                    <strong>Error:</strong> {result.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Perfect Formatting
            </h3>
            <p className="text-gray-600">
              Maintains original layout, fonts, and formatting from your PowerPoint presentation
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Images & Media
            </h3>
            <p className="text-gray-600">
              Preserves all images, charts, graphs, and media elements with high quality
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Template Support
            </h3>
            <p className="text-gray-600">
              Works with all PowerPoint templates and slide designs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
