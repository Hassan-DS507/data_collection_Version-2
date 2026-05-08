"use client"

import { useState, useCallback } from "react"
import { type Sign } from "@/config/signs"

export function useUpload() {
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const uploadRecording = useCallback(async (blob: Blob, currentSign: Sign, username: string): Promise<boolean> => {
    const safeWordId = currentSign.word.trim().replace(/\s+/g, "_")
    const baseUsername = username.trim().replace(/\s+/g, "_")

    let userUuid = localStorage.getItem("user_uuid")
    if (!userUuid) {
      userUuid = Math.random().toString(36).substring(2, 6)
      localStorage.setItem("user_uuid", userUuid)
    }

    const safeUsername = `${baseUsername}_${userUuid}`
    const storageKey = `take_${safeWordId}_${safeUsername}`
    let currentTake = parseInt(localStorage.getItem(storageKey) || "0")
    currentTake += 1
    localStorage.setItem(storageKey, currentTake.toString())

    const formattedTake = currentTake.toString().padStart(2, "0")
    const filename = `${safeWordId}_${safeUsername}_${formattedTake}.mp4`

    setUploadStatus("uploading")
    setStatusMessage("جاري رفع الفيديو...")

    try {
      const formData = new FormData()
      formData.append("video", blob)
      formData.append("filename", filename)
      formData.append("username", username)
      formData.append("word", currentSign.word)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "فشل الرفع")

      setUploadStatus("success")
      setStatusMessage("تم حفظ الفيديو بنجاح!")
      return true
    } catch (error: any) {
      console.error("Upload error:", error)
      setUploadStatus("error")
      setStatusMessage(`فشل الرفع: ${error.message}`)
      return false
    }
  }, [])

  const resetUpload = useCallback(() => {
    setUploadStatus("idle")
    setStatusMessage("")
  }, [])

  return { uploadStatus, statusMessage, uploadRecording, resetUpload }
}
