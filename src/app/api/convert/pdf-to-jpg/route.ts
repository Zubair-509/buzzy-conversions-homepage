
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Get conversion options from form data
    const format = formData.get('format') as string || 'jpg';
    const quality = formData.get('quality') as string || '95';
    const dpi = formData.get('dpi') as string || '300';
    const pageRange = formData.get('pageRange') as string || 'all';

    // Forward to Python backend
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';
    
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('format', format);
    backendFormData.append('quality', quality);
    backendFormData.append('dpi', dpi);
    backendFormData.append('pageRange', pageRange);

    const response = await fetch(`${pythonApiUrl}/api/convert/pdf-to-jpg`, {
      method: 'POST',
      body: backendFormData,
    });

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('PDF to JPG conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error during conversion' },
      { status: 500 }
    );
  }
}
