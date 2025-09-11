
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('application/json')) {
      // Handle JSON requests (HTML code or URL)
      body = await request.json();
      
      // Forward JSON data to backend
      const backendResponse = await fetch('http://localhost:8000/api/convert/html-to-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend responded with status: ${backendResponse.status}`);
      }

      const result = await backendResponse.json();
      return NextResponse.json(result);
      
    } else if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      
      // Forward form data to backend
      const backendResponse = await fetch('http://localhost:8000/api/convert/html-to-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend responded with status: ${backendResponse.status}`);
      }

      const result = await backendResponse.json();
      return NextResponse.json(result);
      
    } else {
      // Handle raw HTML code
      const text = await request.text();
      
      const backendResponse = await fetch('http://localhost:8000/api/convert/html-to-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/html',
        },
        body: text,
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend responded with status: ${backendResponse.status}`);
      }

      const result = await backendResponse.json();
      return NextResponse.json(result);
    }
    
  } catch (error) {
    console.error('Error in HTML to PDF conversion:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
