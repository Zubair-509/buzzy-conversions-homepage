import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ downloadId: string; filename: string }> }
) {
  try {
    const { downloadId, filename } = await params;
    
    // Forward the request to the Python backend
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    console.log(`Forwarding download request: ${downloadId}/${filename}`);
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
    
    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filename.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (filename.endsWith('.pptx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (filename.endsWith('.xlsx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (filename.endsWith('.zip')) {
      contentType = 'application/zip';
    }
    
    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('API download proxy error:', error);
    
    // Check if it's a connection error
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Download service is not available. Please ensure the backend server is running.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error during download' },
      { status: 500 }
    );
  }
}