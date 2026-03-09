"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Camera, 
  Video, 
  CheckCircle, 
  AlertCircle,
  SkipForward,
  LogOut,
  ArrowRight,
  RotateCcw,
  Upload,
  User,
  Award,
  Heart,
  Sparkles,
  Shield,
  Clock,
  Info
} from "lucide-react"
import { SIGNS, type Sign } from "@/config/signs"
import { cn } from "@/lib/utils"
import Image from "next/image"

// Configuration
const CONFIG = {
  recordingDuration: 5000,
  countdownDuration: 3,
  apiEndpoint: "/api/upload",
  mimeTypes: [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4"
  ],
}

// رابط اللوجو - غير الرابط ده برابط الصورة بتاعتك
const LOGO_URL = "/placeholder-logo.png" // استبدل ده برابط الصورة بتاعتك

type Step = "welcome" | "instructions" | "recording" | "complete"

export default function ArSLDatasetCollection() {
  const [step, setStep] = useState<Step>("welcome")
  const [username, setUsername] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalRecorded, setTotalRecorded] = useState(0)
  const [totalSkipped, setTotalSkipped] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [showExitDialog, setShowExitDialog] = useState(false)
  
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const previewRef = useRef<HTMLVideoElement>(null)
  const playbackRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const currentSign: Sign | undefined = SIGNS[currentIndex]
  const totalSigns = SIGNS.length
  const progress = ((currentIndex + 1) / totalSigns) * 100

  // Helper to format Google Drive links
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes('preview') || !url.includes('drive.google.com')) return url;
    const fileId = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1];
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const initCamera = useCallback(async () => {
    try {
      setCameraError(null)
      
      // التحقق إذا كان الجهاز تليفون (شاشة صغيرة)
      const isMobile = window.innerWidth <= 768
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          // للموبايل: نستخدم اعدادات عمودية عشان يظهر الجسم كامل
          // للاب توب: نستخدم اعدادات افقية عادية
          width: isMobile ? { ideal: 720 } : { ideal: 1280 },
          height: isMobile ? { ideal: 1280 } : { ideal: 720 },
          facingMode: "user",
          aspectRatio: isMobile ? 9/16 : 16/9 // 9:16 للموبايل (عمودي)، 16:9 للاب توب (افقي)
        },
        audio: false
      })
      streamRef.current = stream
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        await previewRef.current.play()
      }
      setCameraReady(true)
    } catch (error) {
      setCameraError("غير قادر على الوصول للكاميرا. يرجى التحقق من الصلاحيات.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  const startCountdown = useCallback(() => {
    let count = CONFIG.countdownDuration
    setCountdown(count)
    const interval = setInterval(() => {
      count--
      if (count > 0) setCountdown(count)
      else {
        clearInterval(interval)
        setCountdown(null)
        startRecording()
      }
    }, 1000)
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    chunksRef.current = []
    setRecordedBlob(null)
    setRecordingProgress(0)
    setUploadStatus("idle")
    
    const mimeType = CONFIG.mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || ""
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType })
    mediaRecorderRef.current = mediaRecorder
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/mp4" })
      setRecordedBlob(blob)
      setIsRecording(false)
      if (playbackRef.current) playbackRef.current.src = URL.createObjectURL(blob)
    }
    
    mediaRecorder.start(100)
    setIsRecording(true)
    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setRecordingProgress(Math.min((elapsed / CONFIG.recordingDuration) * 100, 100))
      if (elapsed >= CONFIG.recordingDuration) {
        clearInterval(timerRef.current!)
        mediaRecorder.stop()
      }
    }, 100)
  }, [])

  const resetRecording = useCallback(() => {
    setRecordedBlob(null)
    setRecordingProgress(0)
    setUploadStatus("idle")
    setStatusMessage("")
  }, [])

  const uploadRecording = useCallback(async () => {
    if (!recordedBlob || !currentSign) return
    
    const filename = `${currentSign.word}#${username}.mp4`
    setUploadStatus("uploading")
    setStatusMessage("جاري رفع الفيديو...")
    
    try {
      const formData = new FormData()
      formData.append("video", recordedBlob)
      formData.append("filename", filename)
      
      const response = await fetch(CONFIG.apiEndpoint, {
        method: "POST",
        body: formData
      })
      
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "فشل الرفع")
      
      setUploadStatus("success")
      setStatusMessage("تم حفظ الفيديو بنجاح!")
      setTotalRecorded(prev => prev + 1)
      
      setTimeout(() => {
        nextWord()
      }, 1000)
      
    } catch (error: any) {
      console.error("Upload error:", error)
      setUploadStatus("error")
      setStatusMessage(`خطأ في الرفع: ${error.message}`)
    }
  }, [recordedBlob, currentSign, username])

  const skipWord = useCallback(() => {
    setTotalSkipped(prev => prev + 1)
    setRecordedBlob(null)
    setRecordingProgress(0)
    setUploadStatus("idle")
    setStatusMessage("")
    
    if (currentIndex + 1 >= totalSigns) {
      setStep("complete")
      stopCamera()
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, totalSigns, stopCamera])

  const nextWord = useCallback(() => {
    if (currentIndex + 1 >= totalSigns) {
      stopCamera()
      setStep("complete")
    } else {
      setCurrentIndex(prev => prev + 1)
      resetRecording()
    }
  }, [currentIndex, totalSigns, stopCamera, resetRecording])

  const endSession = useCallback(() => {
    stopCamera()
    setStep("complete")
  }, [stopCamera])

  // Camera initialization on mount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      {/* Progress Bar */}
      {step === "recording" && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/70 border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <Image 
                  src={LOGO_URL}
                  alt="Wesal Logo"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              <div>
                <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  وصال
                </h1>
                <p className="text-xs text-gray-500">مجموعة لغة الإشارة العربية</p>
              </div>
            </div>
            
            {username && step !== "welcome" && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">{username}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg">
                  <Award className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">{totalRecorded}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {step === "welcome" && (
          <div className="max-w-md mx-auto animate-fade-in-up">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              
              <div className="p-8">
                {/* Logo and Welcome */}
                <div className="text-center mb-8">
                  <div className="relative w-24 h-24 mx-auto mb-4 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center p-4">
                      <Image 
                        src={LOGO_URL}
                        alt="Wesal Logo"
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold mb-3">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      مرحباً بك في وصال
                    </span>
                  </h2>
                  
                  <p className="text-gray-600">
                    ساهم في الحفاظ على لغة الإشارة العربية من خلال تسجيل فيديوهات للإشارات
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">+٥٠٠</div>
                    <div className="text-xs text-gray-600">إشارة تم جمعها</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">+١٠٠</div>
                    <div className="text-xs text-gray-600">مساهم</div>
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      أدخل اسمك للبدء
                    </label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="الاسم"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-12 pr-10 bg-white/50 border-2 focus:border-blue-500 transition-all text-right"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-600/25 group"
                    disabled={!username}
                    onClick={() => setStep("instructions")}
                  >
                    <span>ابدأ الآن</span>
                    <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform rotate-180" />
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    بالمتابعة، أنت توافق على المساهمة في مجموعة لغة الإشارة العربية
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "instructions" && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span>إرشادات التسجيل</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-3">
                    اتبع هذه النصائح للحصول على أفضل النتائج
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Best Practices */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg text-green-700">نصائح مهمة</h3>
                    </div>
                    <ul className="space-y-3">
                      {[
                        "خلفية بسيطة وهادئة",
                        "إضاءة جيدة من الأمام",
                        "الكاميرا ثابتة على سطح",
                        "ملابس داكنة اللون",
                        "كلتا اليدين ظاهرتين",
                        "الجزء العلوي من الجسم كامل في الإطار"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Things to Avoid */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg text-red-700">تجنب هذه الأخطاء</h3>
                    </div>
                    <ul className="space-y-3">
                      {[
                        "خلفية مزدحمة أو متحركة",
                        "اهتزاز الكاميرا",
                        "إضاءة خلفية قوية",
                        "خروج اليدين من الإطار",
                        "وجود أشخاص آخرين في الفيديو",
                        "ملابس فاتحة اللون"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recording Steps */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 mb-8 text-white">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    خطوات التسجيل
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">١</div>
                      <div>
                        <p className="font-medium">الاستعداد (٣ ثواني)</p>
                        <p className="text-sm text-white/80">انتظر العد التنازلي واستعد لأداء الإشارة</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">٢</div>
                      <div>
                        <p className="font-medium">أداء الإشارة</p>
                        <p className="text-sm text-white/80">ابدأ في أداء الإشارة بوضوح</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">٣</div>
                      <div>
                        <p className="font-medium">الإنهاء</p>
                        <p className="text-sm text-white/80">اخفض يديك وابقَ طبيعياً حتى نهاية التسجيل</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg group"
                    onClick={async () => {
                      setStep("recording")
                      await initCamera()
                    }}
                  >
                    <Camera className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                    ابدأ التسجيل
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 border-2 hover:bg-gray-100"
                    onClick={() => setStep("welcome")}
                  >
                    رجوع
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "recording" && (
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            {/* Current Sign */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-white px-8 py-4 rounded-2xl shadow-xl border-2 border-transparent">
                  <p className="text-sm text-gray-500 mb-1 text-center">الإشارة الحالية</p>
                  <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    {currentSign?.word}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Recording Area */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Reference Video */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">فيديو مرجعي</span>
                  </div>
                  <span className="text-xs text-gray-500">شاهد وقلد</span>
                </div>
                <div className="aspect-video bg-black">
                  <iframe
                    src={getEmbedUrl(currentSign?.video || "")}
                    className="w-full h-full"
                    allow="autoplay"
                  />
                </div>
              </Card>

              {/* Recording Card */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">الكاميرا الخاصة بك</span>
                  </div>
                  {cameraReady && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      الكاميرا جاهزة
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {/* Video Preview */}
                  <div className={cn(
                    "relative bg-gray-900 rounded-lg overflow-hidden mb-4",
                    "aspect-[9/16] md:aspect-video" // للموبايل 9:16، للاب توب 16:9
                  )}>
                    <video
                      ref={previewRef}
                      autoPlay
                      muted
                      playsInline
                      className={cn(
                        "w-full h-full object-cover",
                        recordedBlob ? "hidden" : "block"
                      )}
                    />
                    <video
                      ref={playbackRef}
                      controls
                      playsInline
                      className={cn(
                        "absolute inset-0 w-full h-full object-cover bg-gray-900",
                        recordedBlob ? "block" : "hidden"
                      )}
                    />

                    {/* Recording Overlay */}
                    {isRecording && (
                      <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs text-white font-medium">تسجيل {Math.round((recordingProgress / 100) * 5)}/٥ ث</span>
                      </div>
                    )}

                    {/* Countdown */}
                    {countdown !== null && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                          <span className="text-7xl font-bold text-white mb-2 block">{countdown}</span>
                          <p className="text-white/80">استعد...</p>
                        </div>
                      </div>
                    )}

                    {/* Recording Tips */}
                    {!isRecording && !recordedBlob && countdown === null && cameraReady && (
                      <div className="absolute bottom-3 right-3 left-3 bg-black/70 backdrop-blur rounded-lg p-3 text-white text-sm">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">نصائح سريعة:</p>
                            <ul className="text-xs space-y-1 text-gray-300">
                              <li>• انتظر ٣ ثواني بعد الضغط على "تسجيل"</li>
                              <li>• ابدأ أداء الإشارة بوضوح</li>
                              <li>• اخفض يديك بعد الانتهاء وابقَ طبيعياً</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Camera Error */}
                    {cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                          <p className="text-white font-medium mb-2">خطأ في الكاميرا</p>
                          <p className="text-sm text-white/70">{cameraError}</p>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {isRecording && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-100"
                          style={{ width: `${recordingProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {!recordedBlob ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg group"
                          onClick={startCountdown}
                          disabled={isRecording || countdown !== null || !cameraReady}
                        >
                          {isRecording ? (
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              جاري التسجيل...
                            </span>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                              ابدأ التسجيل
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 border-2 hover:bg-gray-100 group"
                          onClick={skipWord}
                        >
                          <SkipForward className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform rotate-180" />
                          تخطي
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-12 border-2 hover:bg-gray-100 group"
                          onClick={resetRecording}
                        >
                          <RotateCcw className="w-4 h-4 ml-2 group-hover:rotate-180 transition-transform duration-500" />
                          إعادة
                        </Button>
                        <Button
                          className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg group"
                          onClick={uploadRecording}
                          disabled={uploadStatus === "uploading"}
                        >
                          {uploadStatus === "uploading" ? (
                            <>
                              <Upload className="w-4 h-4 ml-2 animate-bounce" />
                              جاري الرفع...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                              حفظ والتالي
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Status Message */}
                    {statusMessage && (
                      <div className={cn(
                        "p-3 rounded-lg text-sm text-center",
                        uploadStatus === "success" && "bg-green-50 text-green-800",
                        uploadStatus === "error" && "bg-red-50 text-red-800",
                        uploadStatus === "uploading" && "bg-blue-50 text-blue-800"
                      )}>
                        {statusMessage}
                      </div>
                    )}
                  </div>

                  {/* Skip Info */}
                  <p className="text-xs text-center text-gray-500 mt-4">
                    يمكنك تخطي الإشارات التي لا ترغب في تسجيلها
                  </p>
                </div>
              </Card>
            </div>

            {/* Exit Session Button */}
            <div className="text-center mt-6">
              <Button
                variant="ghost"
                className="text-gray-500 hover:text-gray-700 group"
                onClick={() => setShowExitDialog(true)}
              >
                <LogOut className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform rotate-180" />
                إنهاء الجلسة
              </Button>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="max-w-md mx-auto animate-fade-in-up">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
              
              <div className="p-8 text-center">
                {/* Animated Icon */}
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
                  <div className="relative w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto">
                    <Heart className="w-12 h-12 text-white" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold mb-3">
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                    شكراً لك، {username}!
                  </span>
                </h2>

                <p className="text-gray-600 mb-8">
                  لقد ساهمت بنجاح في الحفاظ على لغة الإشارة العربية
                </p>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                    <div className="text-3xl font-bold text-green-600 mb-1">{totalRecorded}</div>
                    <div className="text-xs text-gray-600">إشارات مسجلة</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{totalSkipped}</div>
                    <div className="text-xs text-gray-600">إشارات متخطاة</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 mb-8 text-white text-sm">
                  <Sparkles className="w-5 h-5 inline ml-2" />
                  مساهمتك تساعد في الحفاظ على لغة الإشارة العربية للأجيال القادمة
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25 group"
                    onClick={() => {
                      setUsername("")
                      setCurrentIndex(0)
                      setTotalRecorded(0)
                      setTotalSkipped(0)
                      setStep("welcome")
                    }}
                  >
                    <span>جلسة جديدة</span>
                    <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform rotate-180" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 hover:bg-gray-100"
                    onClick={() => window.close()}
                  >
                    إغلاق
                  </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                  © ٢٠٢٤ وصال - مجموعة لغة الإشارة العربية
                </p>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExitDialog(false)} />
          <Card className="relative max-w-sm w-full border-0 shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                إنهاء الجلسة؟
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                لقد سجلت <span className="font-bold text-red-500">{totalRecorded}</span> إشارة. هل أنت متأكد من إنهاء الجلسة؟
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11 border-2"
                  onClick={() => setShowExitDialog(false)}
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1 h-11 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                  onClick={() => {
                    setShowExitDialog(false)
                    endSession()
                  }}
                >
                  إنهاء
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
