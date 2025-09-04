import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Word to PDF conversion is not implemented yet.' },
    { status: 503 }
  );
}