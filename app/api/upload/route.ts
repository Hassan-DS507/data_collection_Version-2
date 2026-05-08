import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

function validateFilename(filename: string): string | null {
  if (!filename.endsWith('.mp4')) return 'اسم الملف يجب أن ينتهي بـ .mp4';
  const base = filename.slice(0, -4);
  const parts = base.split('_');
  if (parts.length < 4) return 'صيغة اسم الملف غير صحيحة';
  const take = parts[parts.length - 1];
  const uuid = parts[parts.length - 2];
  if (!/^\d{2}$/.test(take)) return 'رقم المحاولة غير صحيح';
  if (!/^[a-z0-9]{4}$/.test(uuid)) return 'رمز المستخدم غير صحيح';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    const filename = formData.get('filename') as string;

    if (!video) return NextResponse.json({ error: 'No video provided' }, { status: 400 });
    if (!filename) return NextResponse.json({ error: 'Filename is required' }, { status: 400 });

    const validationError = validateFilename(filename);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const buffer = Buffer.from(await video.arrayBuffer());

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    console.log(`[System] Uploading: ${filename}`);

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [process.env.UPLOAD_FOLDER_ID || ''],
      },
      media: {
        mimeType: 'video/mp4',
        body: Readable.from(buffer),
      },
      fields: 'id',
    });

    return NextResponse.json({ success: true, fileId: response.data.id });
  } catch (error: any) {
    console.error('[System] Google Drive Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
