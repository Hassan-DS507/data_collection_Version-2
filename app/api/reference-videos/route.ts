import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const REFERENCE_FOLDER_ID = process.env.REFERENCE_FOLDER_ID || '';

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function GET() {
  try {
    if (!REFERENCE_FOLDER_ID) {
      return NextResponse.json({ videos: [], source: 'no_folder_configured' });
    }

    const drive = getDriveClient();

    const response = await drive.files.list({
      q: `'${REFERENCE_FOLDER_ID}' in parents and trashed = false and mimeType contains 'video/'`,
      pageSize: 200,
      fields: 'files(id, name)',
    });

    const files = response.data.files || [];

    const videos = files
      .filter((f) => f.name && f.name.endsWith('.mp4'))
      .map((f) => ({
        word: (f.name as string).replace(/\.mp4$/i, ''),
        filename: f.name as string,
        fileId: f.id as string,
      }));

    return NextResponse.json({ videos, source: 'google_drive' });
  } catch (error: any) {
    console.error('[System] Reference videos API error:', error);
    return NextResponse.json({ videos: [], source: 'error', error: error.message }, { status: 500 });
  }
}
