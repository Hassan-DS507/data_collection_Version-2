import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const LOG_FILE = path.join(process.cwd(), "data", "logs.ndjson")
const ADMIN_SECRET = process.env.ADMIN_SECRET || ""

interface LogEntry {
  level: string
  event: string
  data?: Record<string, unknown>
  uuid: string | null
  browser: { userAgent: string; screenWidth: number; screenHeight: number }
  timestamp: string
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("x-admin-secret")
  if (!ADMIN_SECRET || auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const logs: LogEntry[] = []
    if (existsSync(LOG_FILE)) {
      const raw = await readFile(LOG_FILE, "utf-8")
      for (const line of raw.trim().split("\n")) {
        if (line) logs.push(JSON.parse(line))
      }
    }

    const today = new Date().toISOString().slice(0, 10)

    const uploadSuccess = logs.filter((l) => l.event === "upload_success")
    const uploadFailed = logs.filter((l) => l.event === "upload_failed")
    const uploadToday = uploadSuccess.filter((l) => l.timestamp.slice(0, 10) === today)
    const totalUploads = uploadSuccess.length + uploadFailed.length
    const successRate = totalUploads > 0 ? uploadSuccess.length / totalUploads : 0

    const sessionsByUUID: Record<string, { start?: string; end?: string }> = {}
    for (const log of logs) {
      if (!log.uuid) continue
      if (!sessionsByUUID[log.uuid]) sessionsByUUID[log.uuid] = {}
      if (log.event === "session_started") sessionsByUUID[log.uuid].start = log.timestamp
      if (log.event === "session_ended" || log.event === "session_completed") {
        if (!sessionsByUUID[log.uuid].end || log.timestamp > sessionsByUUID[log.uuid].end!) {
          sessionsByUUID[log.uuid].end = log.timestamp
        }
      }
    }

    const durations: number[] = []
    for (const s of Object.values(sessionsByUUID)) {
      if (s.start && s.end) {
        durations.push(new Date(s.end).getTime() - new Date(s.start).getTime())
      }
    }
    const avgDurationMs =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0

    const dropCounts: Record<string, number> = {}
    for (const log of logs) {
      if (log.event === "session_ended" && log.data?.currentWord) {
        const word = String(log.data.currentWord)
        dropCounts[word] = (dropCounts[word] || 0) + 1
      }
    }
    const topDropped = Object.entries(dropCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }))

    return NextResponse.json({
      totalVideosToday: uploadToday.length,
      totalVideosAllTime: uploadSuccess.length,
      uploadSuccessRate: Math.round(successRate * 10_000) / 100,
      averageSessionDurationMs: Math.round(avgDurationMs),
      topDroppedSigns: topDropped,
      totalSessions: Object.keys(sessionsByUUID).length,
    })
  } catch (error: any) {
    console.error("[Admin Stats] Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
