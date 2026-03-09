import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// استخدام خط واحد نظيف بدلاً من خطين
const inter = Inter({ 
  subsets: ['latin', 'arabic'], // دعم العربية والإنجليزية
  display: 'swap',
  variable: '--font-inter',
})

// إعدادات viewport للتوافق مع جميع الأجهزة
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export const metadata: Metadata = {
  // تحديث العنوان ليعكس اسم المشروع
  title: {
    default: 'Wesal - Arabic Sign Language Dataset',
    template: '%s | Wesal',
  },
  description: 'Contribute to preserving Arabic Sign Language by recording video samples for machine learning dataset',
  
  // إضافة كلمات مفتاحية للبحث
  keywords: [
    'Arabic Sign Language',
    'ArSL',
    'Dataset Collection',
    'Machine Learning',
    'AI Training Data',
    'Sign Language Recognition',
    'وصال',
    'لغة الإشارة العربية'
  ],
  
  // معلومات المؤلف والفريق
  authors: [{ name: 'Wesal Team' }],
  
  // أيقونات محسنة
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
        type: 'image/png',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
        type: 'image/png',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  
  // إعدادات المانيفست للتطبيق
  manifest: '/manifest.json',
  
  // إعدادات الـ Open Graph للتواصل الاجتماعي
  openGraph: {
    title: 'Wesal - Arabic Sign Language Dataset',
    description: 'Help preserve Arabic Sign Language by contributing to our dataset',
    url: 'https://wesal.vercel.app',
    siteName: 'Wesal',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Wesal - Arabic Sign Language Dataset',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  // إعدادات تويتر
  twitter: {
    card: 'summary_large_image',
    title: 'Wesal - Arabic Sign Language Dataset',
    description: 'Help preserve Arabic Sign Language by contributing to our dataset',
    images: ['/twitter-image.png'],
    creator: '@wesal_team',
  },
  
  // إعدادات الـ robots للبحث
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // رابط الموقع الأساسي
  metadataBase: new URL('https://wesal.vercel.app'),
  
  // إعدادات الـ verification لمحركات البحث
  verification: {
    google: 'google-site-verification-code', // ضع الكود الخاص بك هنا
  },
  
  // إعدادات الـ alternates للغات
  alternates: {
    canonical: '/',
    languages: {
      'en': '/en',
      'ar': '/ar',
    },
  },
  
  // إعدادات الـ app links
  appleWebApp: {
    capable: true,
    title: 'Wesal',
    statusBarStyle: 'default',
  },
  
  // إعدادات التنسيق
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" className={inter.variable}>
      <head>
        {/* إضافة وصف قصير للمتصفحات القديمة */}
        <meta name="description" content="Contribute to Arabic Sign Language dataset" />
        
        {/* إضافة حماية من الـ XSS */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* إضافة الـ color scheme */}
        <meta name="color-scheme" content="light dark" />
        
        {/* إضافة الـ mobile-web-app-capable للتطبيقات */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wesal" />
        
        {/* إضافة الـ application-name */}
        <meta name="application-name" content="Wesal" />
        
        {/* إضافة الـ msapplication-TileImage لـ Windows */}
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        
        {/* إضافة الـ favicon الأساسي */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        
        {/* إضافة الـ manifest للتطبيق */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* إضافة الـ preconnect للخطوط */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* إضافة الـ dns-prefetch للخدمات الخارجية */}
        <link rel="dns-prefetch" href="https://drive.google.com" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
      </head>
      <body 
        className={`
          ${inter.className} 
          antialiased 
          min-h-screen 
          bg-white 
          text-gray-900 
          dark:bg-gray-950 
          dark:text-gray-100
          transition-colors
          duration-300
        `}
      >
        {/* إضافة div للتطبيق مع بعض الخصائص المفيدة */}
        <div id="app" className="flex flex-col min-h-screen">
          {/* إضافة skip link للوصولية */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
          >
            Skip to main content
          </a>
          
          {/* المحتوى الرئيسي */}
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          
          {/* إضافة Analytics في النهاية */}
          <Analytics />
        </div>
      </body>
    </html>
  )
}