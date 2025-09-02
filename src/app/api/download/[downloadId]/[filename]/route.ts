import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ downloadId: string; filename: string }> }
) {
  try {
    const { downloadId, filename } = await params;
    
    // Forward the request to the Python backend
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://0.0.0.0:8001';
    const response = await fetch(`${pythonApiUrl}/api/download/${downloadId}/${filename}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }
    
    // Get the file content as a buffer
    const fileContent = await response.arrayBuffer();
    
    // Return the file with appropriate headers
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}