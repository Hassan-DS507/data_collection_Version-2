"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/recording/Header"
import { WelcomeScreen } from "@/components/recording/WelcomeScreen"
import { InstructionsScreen } from "@/components/recording/InstructionsScreen"
import { RecordingView } from "@/components/recording/RecordingView"
import { CompletionScreen } from "@/components/recording/CompletionScreen"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCamera } from "@/hooks/useCamera"
import { useRecording } from "@/hooks/useRecording"
import { useUpload } from "@/hooks/useUpload"
import { useSignNavigation } from "@/hooks/useSignNavigation"
import { useUploadQueue } from "@/hooks/useUploadQueue"
import { logger } from "@/services/logger"

type Step = "welcome" | "instructions" | "recording" | "complete"

export default function ArSLDatasetCollection() {
  const [step, setStep] = useState<Step>("welcome")
  const [username, setUsername] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  const camera = useCamera()
  const navigation = useSignNavigation()
  const recording = useRecording(camera.streamRef)
  const upload = useUpload()
  const uploadQueue = useUploadQueue()

  const validateUsername = (name: string) => {
    if (name.includes(" ")) {
      setUsernameError("لا يمكن استخدام مسافات في الاسم")
      return false
    }
    setUsernameError("")
    return true
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    validateUsername(value)
  }

  const retryAll = useCallback(async () => {
    const items = await uploadQueue.getAll()
    for (const item of items) {
      try {
        const formData = new FormData()
        formData.append("video", item.blob)
        formData.append("filename", item.filename)
        formData.append("username", item.username)
        formData.append("word", item.word)
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (res.ok) {
          await uploadQueue.removeFromQueue(item.id!)
          logger.info("retry_success", { filename: item.filename })
        } else {
          logger.warn("retry_failed", { filename: item.filename })
        }
      } catch {
        logger.warn("retry_failed", { filename: item.filename })
      }
    }
  }, [uploadQueue])

  useEffect(() => {
    if (uploadQueue.ready) retryAll()
  }, [uploadQueue.ready, retryAll])

  useEffect(() => {
    const handler = () => { if (uploadQueue.pendingCount > 0) retryAll() }
    window.addEventListener("online", handler)
    return () => window.removeEventListener("online", handler)
  }, [uploadQueue.pendingCount, retryAll])

  useEffect(() => {
    if (navigation.hasSavedSession && !navigation.signsLoading) {
      setShowResumeDialog(true)
    }
  }, [navigation.hasSavedSession, navigation.signsLoading])

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {step === "recording" && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${navigation.progress}%` }}
          />
        </div>
      )}

      <Header
        username={username}
        totalRecorded={navigation.totalRecorded}
        pendingCount={uploadQueue.pendingCount}
        visible={step !== "welcome" && step !== "instructions"}
      />

      <main className="container mx-auto px-4 py-12">
        {step === "welcome" && (
          <>
            {showResumeDialog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="max-w-sm w-full border shadow-lg rounded-xl">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">استكمال الجلسة السابقة؟</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      لديك جلسة سابقة مسجلة بـ {navigation.loadSession()?.totalRecorded || 0} إشارات. هل تريد
                      الاستمرار من حيث توقفت؟
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 h-10 border"
                        onClick={() => {
                          navigation.clearSession()
                          setShowResumeDialog(false)
                        }}
                      >
                        بدء جديد
                      </Button>
                      <Button
                        className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          const session = navigation.loadSession()
                          if (!session) return
                          navigation.restoreSession(session)
                          setUsername(session.username)
                          setShowResumeDialog(false)
                          setStep("recording")
                          camera.initCamera()
                        }}
                      >
                        استكمال
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            <WelcomeScreen
              username={username}
              usernameError={usernameError}
              onUsernameChange={handleUsernameChange}
              onStart={() => {
                if (validateUsername(username) && username.trim()) setStep("instructions")
              }}
            />
          </>
        )}

        {step === "instructions" && (
          <InstructionsScreen
            onStart={() => {
              logger.info("session_started", { totalSigns: navigation.totalSigns })
              setStep("recording")
              camera.initCamera()
            }}
          />
        )}

        {step === "recording" && (
          <RecordingView
            camera={camera}
            recording={recording}
            upload={upload}
            navigation={navigation}
            username={username}
            onQueueForRetry={(blob, filename, word, uname) => {
              uploadQueue.addToQueue(blob, filename, word, uname)
            }}
            onComplete={() => {
              camera.stopCamera()
              logger.info("session_completed", { totalRecorded: navigation.totalRecorded, totalSkipped: navigation.totalSkipped, totalSigns: navigation.totalSigns })
              navigation.clearSession()
              setStep("complete")
            }}
          />
        )}

        {step === "complete" && (
          <CompletionScreen
            username={username}
            totalRecorded={navigation.totalRecorded}
            totalSkipped={navigation.totalSkipped}
            onNewSession={() => {
              setUsername("")
              setUsernameError("")
              navigation.resetSession()
              setStep("welcome")
            }}
          />
        )}
      </main>
    </div>
  )
}
