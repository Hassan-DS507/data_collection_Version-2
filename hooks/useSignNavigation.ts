"use client"

import { useState, useCallback, useEffect } from "react"
import { type Sign } from "@/config/signs"

export type NavResult = "continue" | "complete"

export function useSignNavigation() {
  const [signs, setSigns] = useState<Sign[]>([])
  const [signsLoading, setSignsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalRecorded, setTotalRecorded] = useState(0)
  const [totalSkipped, setTotalSkipped] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reference-videos")
        const data = await res.json()
        if (data.videos && data.videos.length > 0) setSigns(data.videos)
      } catch (err) {
        console.error("Failed to load reference videos:", err)
      } finally {
        setSignsLoading(false)
      }
    }
    load()
  }, [])

  const currentSign: Sign | undefined = signs[currentIndex]
  const totalSigns = signs.length
  const progress = totalSigns > 0 ? ((currentIndex + 1) / totalSigns) * 100 : 0

  const nextWord = useCallback((): NavResult => {
    if (currentIndex + 1 >= totalSigns) return "complete"
    setCurrentIndex((prev) => prev + 1)
    return "continue"
  }, [currentIndex, totalSigns])

  const skipWord = useCallback((): NavResult => {
    setTotalSkipped((prev) => prev + 1)
    if (currentIndex + 1 >= totalSigns) return "complete"
    setCurrentIndex((prev) => prev + 1)
    return "continue"
  }, [currentIndex, totalSigns])

  const recordWord = useCallback(() => {
    setTotalRecorded((prev) => prev + 1)
  }, [])

  const resetSession = useCallback(() => {
    setCurrentIndex(0)
    setTotalRecorded(0)
    setTotalSkipped(0)
    setSigns([])
    setSignsLoading(true)
  }, [])

  return {
    signs,
    signsLoading,
    currentIndex,
    currentSign,
    totalSigns,
    totalRecorded,
    totalSkipped,
    progress,
    nextWord,
    skipWord,
    recordWord,
    resetSession,
    setCurrentIndex,
  }
}
