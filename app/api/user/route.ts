import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'database.json');

// دالة لقراءة قاعدة البيانات
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    const initialData = {
      users: [],
      stats: {
        totalUsers: 0,
        totalRecordings: 0,
        totalSkipped: 0
      }
    };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

// دالة لكتابة قاعدة البيانات
async function writeDB(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();
    
    // تنظيف الاسم (منع المسافات)
    const cleanName = name.trim().replace(/\s+/g, '_');
    
    // التحقق من صحة الإيميل
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صحيح' },
        { status: 400 }
      );
    }
    
    const db = await readDB();
    
    // التحقق إذا المستخدم موجود
    const existingUser = db.users.find(
      (u: any) => u.email === email || u.name === cleanName
    );
    
    if (existingUser) {
      // مستخدم موجود - نحدث آخر نشاط
      existingUser.lastActive = new Date().toISOString();
      await writeDB(db);
      
      return NextResponse.json({
        success: true,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          totalRecorded: existingUser.totalRecorded || 0,
          totalSkipped: existingUser.totalSkipped || 0,
          recordedSigns: existingUser.recordedSigns || []
        },
        isNew: false
      });
    }
    
    // مستخدم جديد
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: cleanName,
      email: email,
      folderId: null, // هيتم تعبئته بعد إنشاء الفولدر في Google Drive
      recordedSigns: [],
      skippedSigns: [],
      totalRecorded: 0,
      totalSkipped: 0,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    
    db.users.push(newUser);
    db.stats.totalUsers += 1;
    await writeDB(db);
    
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        totalRecorded: 0,
        totalSkipped: 0,
        recordedSigns: []
      },
      isNew: true
    });
    
  } catch (error: any) {
    console.error('❌ خطأ في إنشاء المستخدم:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء المستخدم' },
      { status: 500 }
    );
  }
}

// تحديث بيانات المستخدم (تسجيل أو تخطي)
export async function PUT(request: NextRequest) {
  try {
    const { userId, sign, action } = await request.json();
    
    const db = await readDB();
    const user = db.users.find((u: any) => u.id === userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }
    
    if (action === 'record') {
      user.recordedSigns.push({
        sign,
        timestamp: new Date().toISOString()
      });
      user.totalRecorded += 1;
      db.stats.totalRecordings += 1;
    } else if (action === 'skip') {
      user.skippedSigns.push({
        sign,
        timestamp: new Date().toISOString()
      });
      user.totalSkipped += 1;
      db.stats.totalSkipped += 1;
    }
    
    user.lastActive = new Date().toISOString();
    await writeDB(db);
    
    return NextResponse.json({
      success: true,
      totalRecorded: user.totalRecorded,
      totalSkipped: user.totalSkipped
    });
    
  } catch (error: any) {
    console.error('❌ خطأ في تحديث المستخدم:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث البيانات' },
      { status: 500 }
    );
  }
}

// جلب بيانات المستخدم
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    
    const db = await readDB();
    
    let user = null;
    if (userId) {
      user = db.users.find((u: any) => u.id === userId);
    } else if (email) {
      user = db.users.find((u: any) => u.email === email);
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        totalRecorded: user.totalRecorded || 0,
        totalSkipped: user.totalSkipped || 0,
        recordedSigns: user.recordedSigns || [],
        skippedSigns: user.skippedSigns || []
      }
    });
    
  } catch (error: any) {
    console.error('❌ خطأ في جلب المستخدم:', error);
    return NextResponse.json(
      { error: 'فشل في جلب البيانات' },
      { status: 500 }
    );
  }
}