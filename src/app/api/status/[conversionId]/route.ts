
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

    // Check status with Python backend
    const pythonApiUrl = process.env.PYTHON_API_URL || process.env.BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${pythonApiUrl}/api/status/${conversionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Conversion not found', status: 'not_found' },
          { status: 404 }
        );
      }
      
      const errorText = await response.text();
      console.error('Backend status check error:', errorText);
      return NextResponse.json(
        { error: `Status check failed: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Transform the response to match frontend expectations
    const transformedResult = {
      conversion_id: result.conversion_id || conversionId,
      success: result.success || false,
      status: result.status || (result.success ? 'completed' : 'processing'),
      filename: result.filename,
      download_url: result.download_url,
      error: result.error,
      metadata: result.metadata || {},
      method: result.method
    };

    return NextResponse.json(transformedResult);

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error during status check' },
      { status: 500 }
    );
  }
}
