
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Word to PDF batch conversion has been disabled.' },
    { status: 503 }
  );
}
