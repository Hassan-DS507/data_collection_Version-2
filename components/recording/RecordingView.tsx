"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Camera,
  Video,
  CheckCircle,
  AlertCircle,
  SkipForward,
  LogOut,
  RotateCcw,
  Upload,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getDriveEmbedUrl, type Sign } from "@/config/signs"
import { usePoseDetection } from "@/hooks/usePoseDetection"
import { logger } from "@/services/logger"

interface UseCameraReturn {
  streamRef: React.MutableRefObject<MediaStream | null>
  previewRef: React.RefObject<HTMLVideoElement | null>
  cameraReady: boolean
  cameraError: string | null
  isMobile: boolean
  initCamera: () => Promise<void>
  stopCamera: () => void
}

interface UseRecordingReturn {
  isRecording: boolean
  countdown: number | null
  recordingProgress: number
  recordedBlob: Blob | null
  playbackRef: React.RefObject<HTMLVideoElement | null>
  startCountdown: () => void
  resetRecording: () => void
}

interface UseUploadReturn {
  uploadStatus: "idle" | "uploading" | "success" | "error"
  statusMessage: string
  uploadRecording: (blob: Blob, currentSign: Sign, username: string, pregeneratedFilename?: string) => Promise<{ success: boolean; filename?: string }>
  resetUpload: () => void
}

interface UseNavReturn {
  currentSign: Sign | undefined
  totalSigns: number
  totalRecorded: number
  totalSkipped: number
  progress: number
  nextWord: () => "continue" | "complete"
  skipWord: () => "continue" | "complete"
  recordWord: () => void
  saveSession: (username: string) => void
}

interface RecordingViewProps {
  camera: UseCameraReturn
  recording: UseRecordingReturn
  upload: UseUploadReturn
  navigation: UseNavReturn
  username: string
  onComplete: () => void
  onQueueForRetry?: (blob: Blob, filename: string, word: string, username: string) => void
}

export function RecordingView({ camera, recording, upload, navigation, username, onComplete, onQueueForRetry }: RecordingViewProps) {
  const [showExitDialog, setShowExitDialog] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const poseCanvasRef = useRef<HTMLCanvasElement>(null)
  const pose = usePoseDetection()

  useEffect(() => {
    if (recording.recordedBlob && navigation.currentSign) {
      logger.info("recording_complete", { word: navigation.currentSign.word, blobSize: recording.recordedBlob.size })
    }
  }, [recording.recordedBlob])

  useEffect(() => {
    if (camera.cameraReady && pose.isModelLoaded && camera.previewRef.current && poseCanvasRef.current) {
      pose.startDetection(camera.previewRef.current, poseCanvasRef.current)
      return () => pose.stopDetection()
    }
  }, [camera.cameraReady, pose.isModelLoaded, pose.startDetection, pose.stopDetection])

  useEffect(() => {
    if (recording.isRecording) pose.enhanceForRecording()
  }, [recording.isRecording, pose.enhanceForRecording])

  if (!navigation.currentSign) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل الإشارات المرجعية...</p>
        </div>
      </div>
    )
  }

  const handleUploadAndAdvance = useCallback(async () => {
    if (!recording.recordedBlob || !navigation.currentSign) return
    const blob = recording.recordedBlob
    const sign = navigation.currentSign
    const { success, filename } = await upload.uploadRecording(blob, sign, username)
    if (success) {
      navigation.recordWord()
      setTimeout(() => {
        const result = navigation.nextWord()
        navigation.saveSession(username)
        recording.resetRecording()
        upload.resetUpload()
        if (result === "complete") onComplete()
      }, 1000)
    } else if (filename && onQueueForRetry) {
      onQueueForRetry(blob, filename, sign.word, username)
    }
  }, [recording.recordedBlob, recording.resetRecording, navigation.currentSign, navigation.nextWord, navigation.recordWord, navigation.saveSession, upload, username, onComplete, onQueueForRetry])

  const handleSkip = useCallback(() => {
    if (navigation.currentSign) logger.info("word_skipped", { word: navigation.currentSign.word })
    const result = navigation.skipWord()
    navigation.saveSession(username)
    recording.resetRecording()
    upload.resetUpload()
    if (result === "complete") onComplete()
  }, [navigation.skipWord, navigation.saveSession, recording.resetRecording, upload.resetUpload, onComplete, username, navigation.currentSign])

  if (!navigation.currentSign) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">لا توجد إشارات متاحة حالياً</p>
          <p className="text-gray-500 text-sm">يرجى العودة لاحقاً</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-block bg-white px-8 py-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">الإشارة الحالية</p>
            <p className="text-4xl font-bold text-gray-900" dir="rtl">
              {navigation.currentSign.word}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border-r-4 border-blue-600 p-4 mb-6 rounded-lg mx-auto max-w-4xl shadow-sm text-right" dir="rtl">
          <div className="flex items-start gap-3">
            <span className="text-xl sm:text-2xl flex-shrink-0 pt-0.5">💡</span>
            <p className="text-blue-900 font-bold text-sm sm:text-base leading-relaxed m-0">
              <span className="text-blue-700">خليك في الكادر!</span> اتأكد إن جسمك ظاهر من الوسط للرأس، وإيديك الاتنين مش
              بيخرجوا بره الشاشة طول الإشارة.
            </p>
          </div>
        </div>

        <div ref={containerRef} className={`grid ${camera.isMobile ? "grid-cols-1 gap-4" : "lg:grid-cols-2 gap-6"}`}>
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
                src={getDriveEmbedUrl(navigation.currentSign.fileId)}
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
              {camera.cameraReady && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  جاهزة
                </span>
              )}
            </div>

            <div className="p-4">
              <div
                className={`relative ${camera.isMobile ? "aspect-[9/16] max-w-[300px] mx-auto" : "aspect-video"} bg-gray-900 rounded-lg overflow-hidden mb-4`}
              >
                <video
                  ref={camera.previewRef}
                  autoPlay
                  muted
                  playsInline
                  className={cn(
                    "w-full h-full object-cover",
                    recording.recordedBlob ? "hidden" : "block",
                  )}
                />
                <video
                  ref={recording.playbackRef}
                  controls
                  playsInline
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover",
                    recording.recordedBlob ? "block" : "hidden",
                  )}
                />

                <canvas
                  ref={poseCanvasRef}
                  className={cn(
                    "absolute inset-0 w-full h-full pointer-events-none z-[5]",
                    recording.recordedBlob || !camera.cameraReady ? "hidden" : "block",
                  )}
                />

                {recording.isRecording && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-white font-medium">
                      {Math.round((recording.recordingProgress / 100) * 5)}ث
                    </span>
                  </div>
                )}

                {recording.countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <span className="text-7xl font-bold text-white">{recording.countdown}</span>
                  </div>
                )}

                {camera.cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-white text-sm">{camera.cameraError}</p>
                    </div>
                  </div>
                )}

                {recording.isRecording && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                    <div
                      className="h-full bg-red-500 transition-all duration-100"
                      style={{ width: `${recording.recordingProgress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {!recording.recordedBlob ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      onClick={recording.startCountdown}
                      disabled={recording.isRecording || recording.countdown !== null || !camera.cameraReady || !pose.isPoseValid}
                    >
                      {recording.isRecording ? (
                        <>جاري التسجيل...</>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 ml-2" />
                          ابدأ التسجيل
                        </>
                      )}
                    </Button>
                    <Button variant="outline" className="h-12 border hover:bg-gray-50 rounded-lg" onClick={handleSkip}>
                      <SkipForward className="w-4 h-4 ml-2" />
                      تخطي
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 border hover:bg-gray-50 rounded-lg"
                      onClick={() => {
                        recording.resetRecording()
                        upload.resetUpload()
                      }}
                    >
                      <RotateCcw className="w-4 h-4 ml-2" />
                      إعادة
                    </Button>
                    <Button
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      onClick={handleUploadAndAdvance}
                      disabled={upload.uploadStatus === "uploading"}
                    >
                      {upload.uploadStatus === "uploading" ? (
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

                {!recording.recordedBlob && pose.poseFeedback && (
                  <div className="p-3 rounded-lg text-sm text-center bg-red-50 text-red-800 border border-red-200">
                    {pose.poseFeedback}
                  </div>
                )}

                {upload.statusMessage && (
                  <div
                    className={cn(
                      "p-3 rounded-lg text-sm text-center",
                      upload.uploadStatus === "success" && "bg-green-50 text-green-800 border border-green-200",
                      upload.uploadStatus === "error" && "bg-red-50 text-red-800 border border-red-200",
                      upload.uploadStatus === "uploading" && "bg-blue-50 text-blue-800 border border-blue-200",
                    )}
                  >
                    {upload.statusMessage}
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
          <Button variant="ghost" className="text-gray-400 hover:text-gray-600" onClick={() => setShowExitDialog(true)}>
            <LogOut className="w-4 h-4 ml-2" />
            إنهاء الجلسة
          </Button>
        </div>
      </div>

      {showExitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full border shadow-lg rounded-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">إنهاء الجلسة؟</h3>
              <p className="text-sm text-gray-600 mb-6">
                لقد سجلت {navigation.totalRecorded} إشارات. هل أنت متأكد من إنهاء الجلسة؟
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-10 border" onClick={() => setShowExitDialog(false)}>
                  إلغاء
                </Button>
                <Button
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    setShowExitDialog(false)
                    logger.info("session_ended", { totalRecorded: navigation.totalRecorded, totalSkipped: navigation.totalSkipped, currentWord: navigation.currentSign?.word })
                    onComplete()
                  }}
                >
                  إنهاء الجلسة
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
