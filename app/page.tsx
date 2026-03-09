"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Camera, 
  Video, 
  CheckCircle, 
  AlertCircle,
  SkipForward,
  LogOut,
  HelpCircle,
  X,
  ArrowRight,
  RotateCcw,
  Upload,
  Clock,
  User,
  Award,
  Heart
} from "lucide-react"
import { SIGNS, type Sign } from "@/config/signs"
import { cn } from "@/lib/utils"

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: "user",
          aspectRatio: 16/9
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
      setCameraError("Unable to access camera. Please check permissions.")
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
    setStatusMessage("Uploading to dataset...")
    
    try {
      const formData = new FormData()
      formData.append("video", recordedBlob)
      formData.append("filename", filename)
      
      const response = await fetch(CONFIG.apiEndpoint, {
        method: "POST",
        body: formData
      })
      
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Upload failed")
      
      setUploadStatus("success")
      setStatusMessage("Video saved successfully!")
      setTotalRecorded(prev => prev + 1)
      
      setTimeout(() => {
        nextWord()
      }, 1000)
      
    } catch (error: any) {
      console.error("Upload error:", error)
      setUploadStatus("error")
      setStatusMessage(`Upload failed: ${error.message}`)
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
    <div className="min-h-screen bg-gray-50">
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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">و</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Wesal</h1>
                <p className="text-xs text-gray-500">Arabic Sign Language Dataset</p>
              </div>
            </div>
            
            {username && step !== "welcome" && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{username}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{totalRecorded}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {step === "welcome" && (
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-xl">
              <div className="p-8">
                {/* Logo and Welcome */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-3xl">و</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Wesal
                  </h2>
                  <p className="text-gray-600">
                    Help preserve Arabic Sign Language by contributing to our dataset
                  </p>
                </div>

                {/* Name Input */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Enter your name
                    </label>
                    <Input
                      placeholder="Your name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <Button
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!username}
                    onClick={() => setStep("instructions")}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    By continuing, you agree to contribute to the Arabic Sign Language dataset
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "instructions" && (
          <div className="max-w-3xl mx-auto">
            <Card className="border-0 shadow-xl">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Recording Guidelines
                </h2>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Good Practices */}
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Best Practices
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Plain, uncluttered background",
                        "Good lighting from the front",
                        "Camera stable on a surface",
                        "Dark, contrasting clothing",
                        "Both hands clearly visible",
                        "Upper body in frame"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Things to Avoid */}
                  <div className="bg-red-50 rounded-xl p-6">
                    <h3 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Things to Avoid
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Busy or moving background",
                        "Camera shaking",
                        "Strong backlight",
                        "Hands leaving the frame",
                        "Other people in video",
                        "Light-colored clothing"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recording Process */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Recording Process</h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full text-white flex items-center justify-center text-xs">1</div>
                      <span>3-second countdown</span>
                    </div>
                    <ArrowRight className="hidden sm:block w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full text-white flex items-center justify-center text-xs">2</div>
                      <span>5-second recording</span>
                    </div>
                    <ArrowRight className="hidden sm:block w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full text-white flex items-center justify-center text-xs">3</div>
                      <span>Preview & upload</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                      setStep("recording")
                      await initCamera()
                    }}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12"
                    onClick={() => setStep("welcome")}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "recording" && (
          <div className="max-w-6xl mx-auto">
            {/* Current Sign */}
            <div className="text-center mb-6">
              <div className="inline-block bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Current Sign</p>
                <p className="text-3xl font-bold text-gray-900" dir="rtl">{currentSign?.word}</p>
              </div>
            </div>

            {/* Main Recording Area */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Reference Video */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Reference</span>
                  </div>
                  <span className="text-xs text-gray-500">Watch & follow</span>
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
                    <span className="text-sm font-medium text-gray-300">Your Camera</span>
                  </div>
                  {cameraReady && (
                    <span className="text-xs text-green-400">● Camera ready</span>
                  )}
                </div>

                <div className="p-4">
                  {/* Video Preview */}
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
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
                      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs text-white font-medium">REC {Math.round((recordingProgress / 100) * 5)}s</span>
                      </div>
                    )}

                    {/* Countdown */}
                    {countdown !== null && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <span className="text-6xl font-bold text-white">{countdown}</span>
                      </div>
                    )}

                    {/* Camera Error */}
                    {cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
                        <div className="text-center">
                          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                          <p className="text-white text-sm">{cameraError}</p>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {isRecording && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                        <div
                          className="h-full bg-red-500 transition-all duration-100"
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
                          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                          onClick={startCountdown}
                          disabled={isRecording || countdown !== null || !cameraReady}
                        >
                          {isRecording ? (
                            <>Recording...</>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-2" />
                              Start Recording
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12"
                          onClick={skipWord}
                        >
                          <SkipForward className="w-4 h-4 mr-2" />
                          Skip
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-12"
                          onClick={resetRecording}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Retake
                        </Button>
                        <Button
                          className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                          onClick={uploadRecording}
                          disabled={uploadStatus === "uploading"}
                        >
                          {uploadStatus === "uploading" ? (
                            <>
                              <Upload className="w-4 h-4 mr-2 animate-pulse" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Save & Next
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
                    You can skip signs you're not comfortable with
                  </p>
                </div>
              </Card>
            </div>

            {/* Exit Session Button */}
            <div className="text-center mt-6">
              <Button
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowExitDialog(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                End Session
              </Button>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-xl">
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Thank You, {username}!
                </h2>

                <p className="text-gray-600 mb-6">
                  You've successfully contributed to the Arabic Sign Language dataset.
                </p>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{totalRecorded}</p>
                      <p className="text-xs text-gray-500">Signs Recorded</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{totalSkipped}</p>
                      <p className="text-xs text-gray-500">Signs Skipped</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  Your contribution helps preserve Arabic Sign Language for future generations.
                </p>

                <div className="space-y-3">
                  <Button
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setUsername("")
                      setCurrentIndex(0)
                      setTotalRecorded(0)
                      setTotalSkipped(0)
                      setStep("welcome")
                    }}
                  >
                    Start New Session
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => window.close()}
                  >
                    Close
                  </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                  © 2026 Wesall - Arabic Sign Language Dataset
                </p>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full border-0 shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                End Session?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                You've recorded {totalRecorded} signs. Are you sure you want to end this session?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowExitDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    setShowExitDialog(false)
                    endSession()
                  }}
                >
                  End Session
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
