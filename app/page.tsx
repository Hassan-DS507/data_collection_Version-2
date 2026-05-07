"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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
  Heart,
  HelpCircle,
  Loader2
} from "lucide-react"
import Image from "next/image"
import { type Sign, getDriveEmbedUrl } from "@/config/signs"
import { cn } from "@/lib/utils"

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

type Step = "welcome" | "instructions" | "recording" | "complete"

// دالة للكشف عن الموبايل
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
}

export default function ArSLDatasetCollection() {
  const [step, setStep] = useState<Step>("welcome")
  const [username, setUsername] = useState("")
  const [usernameError, setUsernameError] = useState("")
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
  const [isMobile, setIsMobile] = useState(false)
  const [currentInstructionPage, setCurrentInstructionPage] = useState(0)
  const [signs, setSigns] = useState<Sign[]>([])
  const [signsLoading, setSignsLoading] = useState(true)

  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const previewRef = useRef<HTMLVideoElement>(null)
  const playbackRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentSign: Sign | undefined = signs[currentIndex]
  const totalSigns = signs.length
  const progress = totalSigns > 0 ? ((currentIndex + 1) / totalSigns) * 100 : 0

  // صفحات التعليمات المقسمة
  const instructionPages = [
    {
      title: "مرحباً بك في وصال",
      description: "وصال يهدف إلى مساعدة الصم وضعاف السمع على التواصل بسهولة أكبر مع الآخرين من خلال استخدام تقنيات الذكاء الاصطناعي الحديثة.",
      points: [
        "مشاركتك البسيطة تساعد في تطوير تطبيقات تترجم لغة الإشارة",
        "كل فيديو تسجله يقربنا خطوة من عالم أكثر تواصلاً",
        "لا تحتاج أي خبرة مسبقة، فقط بضع دقائق من وقتك"
      ]
    },
    {
      title: "كيف ستساعد؟",
      description: "ثلاث خطوات بسيطة تصنع الفرق",
      points: [
        "تشاهد فيديو قصير للإشارة المطلوبة",
        "تسجل فيديو لنفسك وأنت تؤدي الإشارة",
        "يتم حفظ الفيديو تلقائياً في قاعدة البيانات"
      ]
    },
    {
      title: "طريقة التسجيل الصحيحة",
      description: "اتبع هذه الخطوات لتسجيل مثالي",
      points: [
        "تأكد من ظهور الجزء العلوي من الجسم واليدين بوضوح",
        "انتظر ثانية قبل بدء الإشارة (عد تنازلي)",
        "أدِّ الإشارة بوضوح كالمعتاد",
        "بعد الانتهاء، أنزل يديك وابقَ ثابتاً حتى انتهاء الوقت",
        "يمكنك مشاهدة الفيديو المرجعي في أي وقت"
      ]
    },
    {
      title: "مراجعة التسجيل",
      description: "تأكد من جودة التسجيل قبل الحفظ",
      points: [
        "بعد التسجيل، يمكنك مشاهدة الفيديو الذي سجلته",
        "إذا كان صحيحاً، اضغط حفظ والتالي",
        "إذا أخطأت، يمكنك الضغط إعادة وتسجيل الإشارة مرة أخرى",
        "يمكنك تخطي أي إشارة لا تستطيع تأديتها"
      ]
    }
  ]

  // التحقق من الموبايل عند تحميل الصفحة وعند تغيير الحجم
  // التحقق من الموبايل عند تحميل الصفحة وعند تغيير الحجم
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice())
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function loadReferenceVideos() {
      try {
        const res = await fetch('/api/reference-videos');
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
          setSigns(data.videos);
        }
      } catch (err) {
        console.error('Failed to load reference videos:', err);
      } finally {
        setSignsLoading(false);
      }
    }
    loadReferenceVideos();
  }, []);

  // التحقق من صحة الاسم (منع المسافات)
  const validateUsername = (name: string) => {
    if (name.includes(' ')) {
      setUsernameError('لا يمكن استخدام مسافات في الاسم')
      return false
    }
    setUsernameError('')
    return true
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    validateUsername(value)
  }

  // ========== دالة initCamera المعدلة بالكامل ==========
  const initCamera = useCallback(async () => {
    try {
      setCameraError(null)

      // قيود أساسية: كاميرا أمامية، بدون دقة محددة - المتصفح يختار الأفضل
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "user", // كاميرا أمامية دائماً
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // التحقق من وجود مسارات فيديو
      if (stream.getVideoTracks().length === 0) {
        throw new Error('No video track found')
      }

      streamRef.current = stream
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        previewRef.current.setAttribute('playsinline', 'true') // مهم للموبايل

        // محاولة التشغيل
        try {
          await previewRef.current.play()
        } catch (playError) {
          console.warn('Autoplay failed:', playError)
          // لا نرمي الخطأ هنا، لأن الكاميرا قد تكون جاهزة لكن التشغيل التلقائي محظور
        }
      }
      setCameraReady(true)
    } catch (error: any) {
      console.error('Camera initialization error:', error)
      let errorMessage = "لا يمكن الوصول للكاميرا. يرجى التحقق من الصلاحيات."

      // رسائل خطأ أكثر تحديداً
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "تم رفض الوصول للكاميرا. يرجى السماح بالوصول في إعدادات المتصفح."
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = "لم يتم العثور على كاميرا. تأكد من توصيل كاميرا بجهازك."
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = "الكاميرا مشغولة بتطبيق آخر. يرجى إغلاق التطبيقات الأخرى."
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "لا يمكن تلبية متطلبات الكاميرا. حاول مرة أخرى."
      }

      setCameraError(errorMessage)
      setCameraReady(false)
    }
  }, []) // تم إزالة isMobile من التبعيات

  // ========== باقي الدوال كما هي بدون تغيير ==========
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

  const uploadRecording = useCallback(async () => {
    if (!recordedBlob || !currentSign) return;

    const safeWordId = currentSign.word.trim().replace(/\s+/g, '_');
    let baseUsername = username.trim().replace(/\s+/g, '_');

    // Generate or retrieve a 4-character unique ID for the user's browser
    let userUuid = localStorage.getItem('user_uuid');
    if (!userUuid) {
      userUuid = Math.random().toString(36).substring(2, 6);
      localStorage.setItem('user_uuid', userUuid);
    }

    // Append the UUID to the username
    const safeUsername = `${baseUsername}_${userUuid}`;

    const storageKey = `take_${safeWordId}_${safeUsername}`;
    let currentTake = parseInt(localStorage.getItem(storageKey) || '0');
    currentTake += 1;
    localStorage.setItem(storageKey, currentTake.toString());

    const formattedTake = currentTake.toString().padStart(2, '0');
    const filename = `${safeWordId}_${safeUsername}_${formattedTake}.mp4`;

    setUploadStatus("uploading");
    setStatusMessage("جاري رفع الفيديو...");

    try {
      const formData = new FormData();
      formData.append("video", recordedBlob);
      formData.append("filename", filename);
      formData.append("username", username);
      formData.append("word", currentSign.word);

      const response = await fetch(CONFIG.apiEndpoint, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل الرفع");

      setUploadStatus("success");
      setStatusMessage("تم حفظ الفيديو بنجاح!");
      setTotalRecorded(prev => prev + 1);

      setTimeout(() => {
        nextWord();
      }, 1000);

    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setStatusMessage(`فشل الرفع: ${error.message}`);
    }
  }, [recordedBlob, currentSign, username, nextWord]);

  const endSession = useCallback(() => {
    stopCamera()
    setStep("complete")
  }, [stopCamera])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const nextInstructionPage = () => {
    if (currentInstructionPage < instructionPages.length - 1) {
      setCurrentInstructionPage(prev => prev + 1)
    } else {
      setStep("recording")
      initCamera()
    }
  }

  const prevInstructionPage = () => {
    if (currentInstructionPage > 0) {
      setCurrentInstructionPage(prev => prev - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Progress Bar */}
      {step === "recording" && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/wasal-logo.png"
                  alt="وصال"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 text-xl">وصال</h1>
                <p className="text-xs text-gray-500">مشروع الحفاظ على لغة الإشارة العربية</p>
              </div>
            </div>

            {username && step !== "welcome" && step !== "instructions" && (
              <div className="flex items-center gap-3">
                <a
                  href="/ArSL_Recording_Guidelines_v2.html"
                  target="_blank"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors rounded-full"
                  title="دليل التصوير"
                >
                  <HelpCircle className="w-4 h-4 text-yellow-700" />
                  <span className="text-sm font-medium text-yellow-800">دليل التصوير</span>
                </a>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{username}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                  <span className="text-sm font-medium text-blue-700">{totalRecorded}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {step === "welcome" && (
          <div className="max-w-md mx-auto">
            <Card className="border shadow-sm rounded-2xl bg-white">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <Image
                      src="/wasal-logo.png"
                      alt="وصال"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    مرحباً بك في وصال
                  </h2>
                  <div className="text-gray-600 leading-relaxed text-center" dir="rtl">
                    <p className="mb-2">
                      مشروع يهدف إلى مساعدة الصم وضعاف السمع من خلال بناء مجموعة بيانات للغة الإشارة العربية.
                    </p>
                    <p className="text-gray-900 font-bold text-lg bg-blue-50 py-2 px-4 rounded-lg inline-block mt-1">
                      مشاركتك البسيطة تصنع فرقاً كبيراً في حياتهم!
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      الاسم
                    </label>
                    <Input
                      placeholder="أدخل اسمك"
                      value={username}
                      onChange={handleUsernameChange}
                      className="h-12 text-right border-gray-200"
                      dir="rtl"
                    />
                    {usernameError && (
                      <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        {usernameError}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    disabled={!username || !!usernameError}
                    onClick={() => setStep("instructions")}
                  >
                    ابدأ المساهمة
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>

                  <p className="text-xs text-center text-gray-400">
                    بالاستمرار، أنت توافق على المساهمة في مجموعة بيانات لغة الإشارة العربية
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "instructions" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border shadow-sm rounded-2xl bg-white">
              <div className="p-8">
                <div className="flex justify-center gap-2 mb-8">
                  {instructionPages.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        index === currentInstructionPage
                          ? "w-8 bg-blue-600"
                          : "w-2 bg-gray-200"
                      )}
                    />
                  ))}
                </div>

                <div className="space-y-6">
                  <div className="p-6 border border-gray-100 rounded-xl bg-gray-50">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        {instructionPages[currentInstructionPage].title}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {instructionPages[currentInstructionPage].description}
                      </p>
                    </div>

                    <ul className="space-y-3">
                      {instructionPages[currentInstructionPage].points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <CheckCircle className="w-5 h-5 flex-shrink-0 text-blue-600" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  {currentInstructionPage > 0 && (
                    <Button
                      variant="outline"
                      className="flex-1 h-12 border hover:bg-gray-50 rounded-xl"
                      onClick={prevInstructionPage}
                    >
                      السابق
                    </Button>
                  )}
                  <Button
                    className={cn(
                      "flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl",
                      currentInstructionPage === 0 && "w-full"
                    )}
                    onClick={nextInstructionPage}
                  >
                    {currentInstructionPage === instructionPages.length - 1 ? 'ابدأ التسجيل' : 'التالي'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "recording" && signsLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">جاري تحميل الإشارات المرجعية...</p>
            </div>
          </div>
        )}

        {step === "recording" && !signsLoading && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-block bg-white px-8 py-4 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">الإشارة الحالية</p>
                <p className="text-4xl font-bold text-gray-900" dir="rtl">{currentSign?.word}</p>
              </div>
            </div>

            {/* البانر التحذيري الجديد للكادر */}
            <div className="bg-blue-50 border-r-4 border-blue-600 p-4 mb-6 rounded-lg mx-auto max-w-4xl shadow-sm text-right" dir="rtl">
              <div className="flex items-start gap-3">
                <span className="text-xl sm:text-2xl flex-shrink-0 pt-0.5">💡</span>
                <p className="text-blue-900 font-bold text-sm sm:text-base leading-relaxed m-0">
                  <span className="text-blue-700">خليك في الكادر!</span> اتأكد إن جسمك ظاهر من الوسط للرأس، وإيديك الاتنين مش بيخرجوا بره الشاشة طول الإشارة.
                </p>
              </div>
            </div>

            <div ref={containerRef} className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'lg:grid-cols-2 gap-6'}`}>
              <Card className="border shadow-sm overflow-hidden rounded-xl bg-white">
                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">الفيديو المرجعي</span>
                  </div>
                  <span className="text-xs text-gray-500">شاهد وقلد</span>
                </div>
                <div className="aspect-video bg-black">
                  <iframe
                    src={getDriveEmbedUrl(currentSign?.fileId || "")}
                    className="w-full h-full"
                    allow="autoplay"
                  />
                </div>
              </Card>

              <Card className="border shadow-sm overflow-hidden rounded-xl bg-white">
                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">الكاميرا</span>
                  </div>
                  {cameraReady && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      جاهزة
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className={`relative ${isMobile ? 'aspect-[9/16] max-w-[300px] mx-auto' : 'aspect-video'} bg-gray-900 rounded-lg overflow-hidden mb-4`}>
                    <video
                      ref={previewRef}
                      autoPlay
                      muted
                      playsInline
                      className={cn(
                        "w-full h-full",
                        isMobile ? "object-cover" : "object-cover",
                        recordedBlob ? "hidden" : "block"
                      )}
                    />
                    <video
                      ref={playbackRef}
                      controls
                      playsInline
                      className={cn(
                        "absolute inset-0 w-full h-full",
                        isMobile ? "object-cover" : "object-cover",
                        recordedBlob ? "block" : "hidden"
                      )}
                    />

                    {isRecording && (
                      <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs text-white font-medium">{Math.round((recordingProgress / 100) * 5)}ث</span>
                      </div>
                    )}

                    {countdown !== null && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <span className="text-7xl font-bold text-white">{countdown}</span>
                      </div>
                    )}

                    {cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                          <p className="text-white text-sm">{cameraError}</p>
                        </div>
                      </div>
                    )}

                    {isRecording && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                        <div
                          className="h-full bg-red-500 transition-all duration-100"
                          style={{ width: `${recordingProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {!recordedBlob ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                          onClick={startCountdown}
                          disabled={isRecording || countdown !== null || !cameraReady}
                        >
                          {isRecording ? (
                            <>جاري التسجيل...</>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 ml-2" />
                              ابدأ التسجيل
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 border hover:bg-gray-50 rounded-lg"
                          onClick={skipWord}
                        >
                          <SkipForward className="w-4 h-4 ml-2" />
                          تخطي
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-12 border hover:bg-gray-50 rounded-lg"
                          onClick={resetRecording}
                        >
                          <RotateCcw className="w-4 h-4 ml-2" />
                          إعادة
                        </Button>
                        <Button
                          className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                          onClick={uploadRecording}
                          disabled={uploadStatus === "uploading"}
                        >
                          {uploadStatus === "uploading" ? (
                            <>
                              <Upload className="w-4 h-4 ml-2 animate-pulse" />
                              جاري الرفع...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 ml-2" />
                              حفظ والتالي
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {statusMessage && (
                      <div className={cn(
                        "p-3 rounded-lg text-sm text-center",
                        uploadStatus === "success" && "bg-green-50 text-green-800 border border-green-200",
                        uploadStatus === "error" && "bg-red-50 text-red-800 border border-red-200",
                        uploadStatus === "uploading" && "bg-blue-50 text-blue-800 border border-blue-200"
                      )}>
                        {statusMessage}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-center text-gray-400 mt-4">
                    يمكنك تخطي الإشارات التي لا تستطيع تأديتها
                  </p>
                </div>
              </Card>
            </div>

            <div className="text-center mt-6">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowExitDialog(true)}
              >
                <LogOut className="w-4 h-4 ml-2" />
                إنهاء الجلسة
              </Button>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="max-w-md mx-auto">
            <Card className="border shadow-sm rounded-2xl bg-white">
              <div className="p-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="bg-green-100 rounded-full p-5">
                    <Heart className="w-14 h-14 text-green-600" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  شكراً لك، {username}!
                </h2>

                <p className="text-gray-600 mb-8 leading-relaxed">
                  لقد ساهمت بنجاح في الحفاظ على لغة الإشارة العربية. مساهمتك ستساعد في تطوير تطبيقات تخدم الصم وضعاف السمع.
                </p>

                <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{totalRecorded}</p>
                      <p className="text-sm text-gray-500">إشارات مسجلة</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{totalSkipped}</p>
                      <p className="text-sm text-gray-500">تم تخطيها</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    onClick={() => {
                      setUsername("")
                      setCurrentIndex(0)
                      setTotalRecorded(0)
                      setTotalSkipped(0)
                      setStep("welcome")
                    }}
                  >
                    جلسة جديدة
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 border hover:bg-gray-50 rounded-xl"
                    onClick={() => window.close()}
                  >
                    إغلاق
                  </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                  © ٢٠٢٦ وِصال - مشروع الحفاظ على لغة الإشارة العربية
                </p>
              </div>
            </Card>
          </div>
        )}
      </main>

      {showExitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full border shadow-lg rounded-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                إنهاء الجلسة؟
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                لقد سجلت {totalRecorded} إشارات. هل أنت متأكد من إنهاء الجلسة؟
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-10 border"
                  onClick={() => setShowExitDialog(false)}
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    setShowExitDialog(false)
                    endSession()
                  }}
                >
                  إنهاء الجلسة
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}