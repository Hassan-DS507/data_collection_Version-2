"use client"

import { useState, useRef, useCallback } from "react"

const RECORDING_DURATION = 5000
const COUNTDOWN_DURATION = 3
const MIME_TYPES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"]

export function useRecording(streamRef: React.MutableRefObject<MediaStream | null>) {
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const playbackRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    chunksRef.current = []
    setRecordedBlob(null)
    setRecordingProgress(0)

    const mimeType = MIME_TYPES.find((m) => MediaRecorder.isTypeSupported(m)) || ""
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
      setRecordingProgress(Math.min((elapsed / RECORDING_DURATION) * 100, 100))
      if (elapsed >= RECORDING_DURATION) {
        clearInterval(timerRef.current!)
        mediaRecorder.stop()
      }
    }, 100)
  }, [streamRef])

  const startCountdown = useCallback(() => {
    let count = COUNTDOWN_DURATION
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
  }, [startRecording])

  const resetRecording = useCallback(() => {
    setRecordedBlob(null)
    setRecordingProgress(0)
    setCountdown(null)
    setIsRecording(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    isRecording,
    countdown,
    recordingProgress,
    recordedBlob,
    playbackRef,
    startCountdown,
    resetRecording,
  }
}
