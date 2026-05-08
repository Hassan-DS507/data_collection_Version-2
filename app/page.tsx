"use client"

import { useState } from "react"
import { Header } from "@/components/recording/Header"
import { WelcomeScreen } from "@/components/recording/WelcomeScreen"
import { InstructionsScreen } from "@/components/recording/InstructionsScreen"
import { RecordingView } from "@/components/recording/RecordingView"
import { CompletionScreen } from "@/components/recording/CompletionScreen"
import { useCamera } from "@/hooks/useCamera"
import { useRecording } from "@/hooks/useRecording"
import { useUpload } from "@/hooks/useUpload"
import { useSignNavigation } from "@/hooks/useSignNavigation"

type Step = "welcome" | "instructions" | "recording" | "complete"

export default function ArSLDatasetCollection() {
  const [step, setStep] = useState<Step>("welcome")
  const [username, setUsername] = useState("")
  const [usernameError, setUsernameError] = useState("")

  const camera = useCamera()
  const navigation = useSignNavigation()
  const recording = useRecording(camera.streamRef)
  const upload = useUpload()

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
        visible={step !== "welcome" && step !== "instructions"}
      />

      <main className="container mx-auto px-4 py-12">
        {step === "welcome" && (
          <WelcomeScreen
            username={username}
            usernameError={usernameError}
            onUsernameChange={handleUsernameChange}
            onStart={() => setStep("instructions")}
          />
        )}

        {step === "instructions" && (
          <InstructionsScreen
            onStart={() => {
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
            onComplete={() => {
              camera.stopCamera()
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
