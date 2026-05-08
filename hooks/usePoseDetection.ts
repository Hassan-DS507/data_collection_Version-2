"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import { logger } from "@/services/logger"

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"

const KEYPOINT_INDICES = [11, 12, 13, 14, 15, 16]
const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [11, 23], [12, 24],
]

export function usePoseDetection() {
  const [isPoseValid, setIsPoseValid] = useState(true)
  const [poseFeedback, setPoseFeedback] = useState("")
  const [isModelLoaded, setIsModelLoaded] = useState(false)

  const poseRef = useRef<PoseLandmarker | null>(null)
  const animFrameRef = useRef(0)
  const lastDetectRef = useRef(0)
  const fpsIntervalRef = useRef(200)
  const containerRef = useRef<{ video: HTMLVideoElement; canvas: HTMLCanvasElement } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
        if (cancelled) return
        poseRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        })
        if (!cancelled) setIsModelLoaded(true)
      } catch (e) {
        console.warn("[PoseDetection] Model load failed, pose check disabled:", e)
        logger.warn("mediapipe_load_failed", { error: String(e) })
      }
    }
    init()
    return () => {
      cancelled = true
      poseRef.current?.close()
    }
  }, [])

  const drawPose = useCallback((landmarks: any[], isValid: boolean) => {
    const el = containerRef.current
    if (!el) return
    const { canvas } = el
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const color = isValid ? "#22c55e" : "#ef4444"

    for (const [i, j] of SKELETON_CONNECTIONS) {
      const p1 = landmarks[i]
      const p2 = landmarks[j]
      if (p1 && p2 && p1.visibility! > 0.5 && p2.visibility! > 0.5) {
        ctx.beginPath()
        ctx.moveTo(p1.x * w, p1.y * h)
        ctx.lineTo(p2.x * w, p2.y * h)
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.7
        ctx.stroke()
      }
    }

    for (const idx of KEYPOINT_INDICES) {
      const p = landmarks[idx]
      if (p && p.visibility! > 0.5) {
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, 6, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.globalAlpha = 0.9
        ctx.fill()
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    ctx.globalAlpha = 1
  }, [])

  const detectionLoop = useCallback(() => {
    const el = containerRef.current
    if (!el || !poseRef.current) {
      animFrameRef.current = requestAnimationFrame(detectionLoop)
      return
    }

    const { video, canvas } = el
    const ctx = canvas.getContext("2d")
    if (!ctx || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectionLoop)
      return
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const now = performance.now()
    if (now - lastDetectRef.current > fpsIntervalRef.current) {
      lastDetectRef.current = now
      const result = poseRef.current.detectForVideo(video, now)

      if (result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0]
        const keypoints = KEYPOINT_INDICES.map((i) => landmarks[i])
        const isValid = keypoints.every((k) => k && k.visibility! >= 0.5)

        setIsPoseValid(isValid)
        setPoseFeedback(
          isValid
            ? ""
            : "خليك في الكادر! تأكد من ظهور كتفيك ويديك بالكامل",
        )

        drawPose(landmarks, isValid)
      } else {
        setIsPoseValid(false)
        setPoseFeedback("لم يتم التعرف على جسمك. تأكد من الوقوف في منتصف الكادر")
      }
    }

    animFrameRef.current = requestAnimationFrame(detectionLoop)
  }, [drawPose])

  const startDetection = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      containerRef.current = { video, canvas }
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = requestAnimationFrame(detectionLoop)
    },
    [detectionLoop],
  )

  const stopDetection = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    const el = containerRef.current
    if (el) {
      const ctx = el.canvas.getContext("2d")
      if (ctx) ctx.clearRect(0, 0, el.canvas.width, el.canvas.height)
    }
    containerRef.current = null
  }, [])

  const enhanceForRecording = useCallback(() => {
    fpsIntervalRef.current = 66
  }, [])

  return { isPoseValid, poseFeedback, isModelLoaded, startDetection, stopDetection, enhanceForRecording }
}
