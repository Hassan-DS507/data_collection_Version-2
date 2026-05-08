import { NextRequest, NextResponse } from "next/server"
import { appendFile, readFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const LOG_FILE = path.join(process.cwd(), "data", "logs.ndjson")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { logs } = body as { logs: Record<string, unknown>[] }
    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ error: "No logs provided" }, { status: 400 })
    }

    const dir = path.dirname(LOG_FILE)
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })

    const lines = logs.map((l) => JSON.stringify(l)).join("\n") + "\n"
    await appendFile(LOG_FILE, lines, "utf-8")

    return NextResponse.json({ accepted: logs.length })
  } catch (error: any) {
    console.error("[Logs] Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
