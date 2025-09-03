import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Python backend is reachable
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonApiUrl}/api/health`, {
      method: 'GET',
      timeout: 5000, // 5 second timeout
    });
    
    if (response.ok) {
      const backendHealth = await response.json();
      return NextResponse.json({
        status: 'healthy',
        frontend: 'running',
        backend: backendHealth,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        status: 'degraded',
        frontend: 'running',
        backend: 'unreachable',
        backend_status: response.status,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      frontend: 'running',
      backend: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}