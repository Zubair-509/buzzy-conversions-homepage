import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the uploaded file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    // Forward to Python backend
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    
    // Create new FormData for backend request
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(`${pythonApiUrl}/api/convert/pdf-to-word`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend conversion error:', errorText);
      return NextResponse.json(
        { error: `Conversion service error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('API conversion proxy error:', error);
    
    // Check if it's a connection error
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Conversion service is not available. Please ensure the backend server is running.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error during conversion' },
      { status: 500 }
    );
  }
}