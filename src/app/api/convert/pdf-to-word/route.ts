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
    });
    
    const result = await response.json();
    
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}