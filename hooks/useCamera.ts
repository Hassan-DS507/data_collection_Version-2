"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { logger } from "@/services/logger"

export function useCamera() {
  const streamRef = useRef<MediaStream | null>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          window.innerWidth <= 768,
      )
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const initCamera = useCallback(async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })

      if (stream.getVideoTracks().length === 0) throw new Error("No video track found")

      streamRef.current = stream
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        previewRef.current.setAttribute("playsinline", "true")
        try {
          await previewRef.current.play()
        } catch (playError) {
          console.warn("Autoplay failed:", playError)
        }
      }
      setCameraReady(true)
    } catch (error: any) {
      console.error("Camera initialization error:", error)
      logger.error("camera_init_failed", { errorCode: error.name, errorMessage: error.message })
      let msg = "لا يمكن الوصول للكاميرا. يرجى التحقق من الصلاحيات."
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")
        msg = "تم رفض الوصول للكاميرا. يرجى السماح بالوصول في إعدادات المتصفح."
      else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError")
        msg = "لم يتم العثور على كاميرا. تأكد من توصيل كاميرا بجهازك."
      else if (error.name === "NotReadableError" || error.name === "TrackStartError")
        msg = "الكاميرا مشغولة بتطبيق آخر. يرجى إغلاق التطبيقات الأخرى."
      else if (error.name === "OverconstrainedError")
        msg = "لا يمكن تلبية متطلبات الكاميرا. حاول مرة أخرى."
      setCameraError(msg)
      setCameraReady(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  return { streamRef, previewRef, cameraReady, cameraError, isMobile, initCamera, stopCamera }
}
