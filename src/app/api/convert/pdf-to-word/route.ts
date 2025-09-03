import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward the request to the Python backend
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonApiUrl}/api/convert/pdf-to-word`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let fetch set it for FormData
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend conversion error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    
    // Check if it's a connection error
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'PDF conversion service is not available. Please ensure the backend server is running.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error during PDF conversion' },
      { status: 500 }
    );
  }
}