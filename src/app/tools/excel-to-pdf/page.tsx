
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ArrowLeft,
  FileSpreadsheet,
  Lock,
  Zap,
  Shield,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';

interface ConversionResult {
  success: boolean;
  conversion_id?: string;
  status?: string;
  filename?: string;
  download_url?: string;
  error?: string;
  message?: string;
  metadata?: {
    sheets?: number;
    sheet_names?: string[];
    total_cells?: number;
    file_size?: number;
    method?: string;
  };
}

export default function ExcelToPDFPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.name.toLowerCase().endsWith('.xlsx') ||
          selectedFile.name.toLowerCase().endsWith('.xls')) {
        setFile(selectedFile);
        setError(null);
        setConversionResult(null);
        toast.success(`Selected ${selectedFile.name}`);
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          droppedFile.type === 'application/vnd.ms-excel' ||
          droppedFile.name.toLowerCase().endsWith('.xlsx') ||
          droppedFile.name.toLowerCase().endsWith('.xls')) {
        setFile(droppedFile);
        setError(null);
        setConversionResult(null);
        toast.success(`Selected ${droppedFile.name}`);
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
      }
    }
  };

  const pollConversionStatus = async (conversionId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/status/${conversionId}`);
        const result = await response.json();

        if (result.status === 'completed' && result.success) {
          setProgress(100);
          setConversionResult(result);
          setIsConverting(false);
          toast.success('Excel successfully converted to PDF!');
        } else if (result.status === 'failed') {
          setConversionResult(result);
          setIsConverting(false);
          toast.error(`Conversion failed: ${result.error}`);
        } else if (result.status === 'processing') {
          const progressValue = Math.min(90, (attempts / maxAttempts) * 90);
          setProgress(progressValue);
          
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000);
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
    if (!file) {
      toast.error('Please select an Excel file first');
      return;
    }

    setIsConverting(true);
    setProgress(10);
    setConversionResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/convert/excel-to-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.conversion_id) {
        setProgress(30);
        toast.success('Conversion started! Processing your Excel file...');
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
        error: 'Failed to convert Excel to PDF'
      });
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (conversionResult?.download_url) {
      const link = document.createElement('a');
      link.href = conversionResult.download_url;
      link.download = conversionResult.filename || 'converted.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started!');
    }
  };

  const resetForm = () => {
    setFile(null);
    setIsConverting(false);
    setConversionResult(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                <FileSpreadsheet className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                Excel to PDF Converter
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Convert your Excel spreadsheets to PDF format while preserving formatting, charts, tables, and formulas
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
              <CardTitle className="text-2xl font-display">Upload Your Excel File</CardTitle>
              <CardDescription>Convert .xlsx and .xls files to PDF format with perfect formatting</CardDescription>
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
              <div
                className="border-2 border-dashed border-primary/20 rounded-xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{file ? file.name : 'Drop your Excel file here'}</h3>
                <p className="text-muted-foreground mb-4">Support for .xlsx and .xls formats up to 50MB</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                {file && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {isConverting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Converting Excel to PDF...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleConvert}
                  disabled={!file || isConverting}
                  className="flex-1 bg-primary hover:bg-primary/90"
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

                {conversionResult?.success && (
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

                {(file || conversionResult !== null) && (
                  <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                    Reset
                  </Button>
                )}
              </div>

              {/* Conversion Result */}
              {conversionResult && (
                <div className="mt-6">
                  {conversionResult.success ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <h3 className="font-semibold text-green-800">Conversion Successful</h3>
                      </div>
                      {conversionResult.metadata && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          {conversionResult.metadata.sheets && (
                            <div className="text-center">
                              <p className="text-sm text-green-600">Sheets</p>
                              <p className="text-lg font-semibold text-green-800">{conversionResult.metadata.sheets}</p>
                            </div>
                          )}
                          {conversionResult.metadata.total_cells && (
                            <div className="text-center">
                              <p className="text-sm text-green-600">Data Cells</p>
                              <p className="text-lg font-semibold text-green-800">{conversionResult.metadata.total_cells}</p>
                            </div>
                          )}
                          {conversionResult.metadata.file_size && (
                            <div className="text-center">
                              <p className="text-sm text-green-600">File Size</p>
                              <p className="text-lg font-semibold text-green-800">
                                {(conversionResult.metadata.file_size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {conversionResult.metadata?.sheet_names && (
                        <div className="mt-4">
                          <p className="text-sm text-green-600 mb-2">Sheets Converted:</p>
                          <div className="flex flex-wrap gap-2">
                            {conversionResult.metadata.sheet_names.map((sheet, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                                {sheet}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                        <div>
                          <h3 className="font-semibold text-red-800">Conversion Failed</h3>
                          <p className="text-red-700">{conversionResult.error}</p>
                        </div>
                      </div>
                    </div>
                  )}
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
              Professional Excel to PDF Conversion
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Convert Excel spreadsheets with complete accuracy, preserving all formatting, charts, formulas, and data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Format Preservation</h3>
              <p className="text-muted-foreground">Maintains all formatting, formulas, charts, and cell styling perfectly</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Charts & Graphs</h3>
              <p className="text-muted-foreground">Preserves all Excel charts, graphs, and visual elements</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">Quick conversion process that handles large spreadsheets efficiently</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold">Secure Processing</h3>
              <p className="text-muted-foreground">Your files are processed securely and deleted after conversion</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
