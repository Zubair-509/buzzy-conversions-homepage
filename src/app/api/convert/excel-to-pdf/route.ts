
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward the request to the Python backend
    const backendResponse = await fetch('http://localhost:8000/api/convert/excel-to-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with status: ${backendResponse.status}`);
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in Excel to PDF conversion:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
