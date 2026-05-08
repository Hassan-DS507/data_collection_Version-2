"use client"

import { useState, useCallback, useEffect } from "react"
import { type Sign } from "@/config/signs"

export type NavResult = "continue" | "complete"

const SESSION_KEY = "arsl_session"

export interface SessionData {
  username: string
  currentIndex: number
  totalRecorded: number
  totalSkipped: number
  timestamp: number
}

export function useSignNavigation() {
  const [signs, setSigns] = useState<Sign[]>([])
  const [signsLoading, setSignsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalRecorded, setTotalRecorded] = useState(0)
  const [totalSkipped, setTotalSkipped] = useState(0)
  const [hasSavedSession, setHasSavedSession] = useState(false)

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

    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      try {
        const s = JSON.parse(raw)
        if (s && typeof s.currentIndex === "number" && s.username) {
          setHasSavedSession(true)
        }
      } catch {}
    }

    load()
  }, [])

  const currentSign: Sign | undefined = signs[currentIndex]
  const totalSigns = signs.length
  const progress = totalSigns > 0 ? ((currentIndex + 1) / totalSigns) * 100 : 0

  const saveSession = useCallback(
    (username: string) => {
      const data: SessionData = {
        username,
        currentIndex,
        totalRecorded,
        totalSkipped,
        timestamp: Date.now(),
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(data))
    },
    [currentIndex, totalRecorded, totalSkipped],
  )

  const loadSession = useCallback((): SessionData | null => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }, [])

  const restoreSession = useCallback((data: SessionData) => {
    setCurrentIndex(data.currentIndex)
    setTotalRecorded(data.totalRecorded)
    setTotalSkipped(data.totalSkipped)
    setHasSavedSession(false)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setHasSavedSession(false)
  }, [])

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
    clearSession()
  }, [clearSession])

  return {
    signs,
    signsLoading,
    currentIndex,
    currentSign,
    totalSigns,
    totalRecorded,
    totalSkipped,
    progress,
    hasSavedSession,
    nextWord,
    skipWord,
    recordWord,
    resetSession,
    saveSession,
    loadSession,
    restoreSession,
    clearSession,
    setCurrentIndex,
  }
}
