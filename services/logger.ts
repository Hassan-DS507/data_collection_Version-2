"use client"

type LogLevel = "INFO" | "WARN" | "ERROR"

interface LogEntry {
  level: LogLevel
  event: string
  data?: Record<string, unknown>
  uuid: string | null
  browser: { userAgent: string; screenWidth: number; screenHeight: number }
  timestamp: string
}

const isBrowser = typeof window !== "undefined"
const FLUSH_INTERVAL = 60_000
const BATCH_SIZE = 10

class BatchLogger {
  private buffer: LogEntry[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    if (!isBrowser) return
    window.addEventListener("beforeunload", () => this.flushSync())
  }

  private getUUID(): string | null {
    try {
      return localStorage.getItem("user_uuid")
    } catch {
      return null
    }
  }

  private getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    }
  }

  private log(level: LogLevel, event: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      event,
      data,
      uuid: this.getUUID(),
      browser: this.getBrowserInfo(),
      timestamp: new Date().toISOString(),
    }
    this.buffer.push(entry)
    this.scheduleFlush()
    if (this.buffer.length >= BATCH_SIZE) this.flush()
  }

  info(event: string, data?: Record<string, unknown>) {
    this.log("INFO", event, data)
  }

  warn(event: string, data?: Record<string, unknown>) {
    this.log("WARN", event, data)
  }

  error(event: string, data?: Record<string, unknown>) {
    this.log("ERROR", event, data)
  }

  private scheduleFlush() {
    if (this.flushTimer) return
    this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL)
  }

  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    if (this.buffer.length === 0) return
    const batch = this.buffer.splice(0)
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: batch }),
      })
    } catch {
      this.buffer.unshift(...batch)
    }
  }

  private flushSync() {
    if (this.buffer.length === 0) return
    const batch = this.buffer.splice(0)
    try {
      const blob = new Blob([JSON.stringify({ logs: batch })], { type: "application/json" })
      navigator.sendBeacon("/api/logs", blob)
    } catch {}
  }
}

export const logger = new BatchLogger()
