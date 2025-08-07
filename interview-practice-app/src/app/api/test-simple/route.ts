import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    return NextResponse.json({
      success: true,
      echo: message || 'Hello World',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Simple test failed', 
        details: (error as any).message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'Simple test endpoint is working',
    timestamp: new Date().toISOString()
  });
}