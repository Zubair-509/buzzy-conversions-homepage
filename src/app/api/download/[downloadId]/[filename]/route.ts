
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { downloadId: string; filename: string } }
) {
  try {
    const { downloadId, filename } = params;
    
    // Forward the request to the Python backend
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://127.0.0.1:8001';
    const response = await fetch(`${pythonApiUrl}/api/download/${downloadId}/${filename}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'File not found or has expired' },
          { status: 404 }
        );
      }
      
      const errorText = await response.text();
      console.error('Backend download error:', errorText);
      return NextResponse.json(
        { error: `Download error: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Get the file stream
    const fileBuffer = await response.arrayBuffer();
    
    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('API download proxy error:', error);
    
    // Check if it's a connection error
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Backend service is not available. Please ensure the Python server is running.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
