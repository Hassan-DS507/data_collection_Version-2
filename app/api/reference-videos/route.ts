import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // The frontend now loads reference videos directly from the CONFIG file.
    // This endpoint is kept active to prevent routing errors, but no longer
    // requires Google Drive Service Account credentials.
    
    return NextResponse.json({
      status: 'ok',
      message: 'Reference videos are now handled directly by the frontend configuration.',
      source: 'static_config'
    });

  } catch (error) {
    console.error('[System] Reference videos API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}