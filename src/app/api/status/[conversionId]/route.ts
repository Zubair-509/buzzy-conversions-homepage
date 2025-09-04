import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversionId: string }> }
) {
  try {
    const { conversionId } = await params;
    
    if (!conversionId) {
      return NextResponse.json(
        { error: 'Conversion ID is required' },
        { status: 400 }
      );
    }

    // Forward to Python backend
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${pythonApiUrl}/api/status/${conversionId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Conversion not found' },
          { status: 404 }
        );
      }
      
      const errorText = await response.text();
      console.error('Backend status error:', errorText);
      return NextResponse.json(
        { error: `Status check error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('API status proxy error:', error);
    
    // Check if it's a connection error
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Conversion service is not available. Please ensure the backend server is running.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error during status check' },
      { status: 500 }
    );
  }
}