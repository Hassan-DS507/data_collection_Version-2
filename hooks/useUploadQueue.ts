"use client"

import { useState, useRef, useCallback, useEffect } from "react"

const DB_NAME = "ArSLUploadQueue"
const STORE_NAME = "pending"

export interface QueueItem {
  id?: number
  blob: Blob
  filename: string
  word: string
  username: string
  timestamp: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true })
      }
    }
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror = () => reject(req.error)
  })
}

export function useUploadQueue() {
  const [pendingCount, setPendingCount] = useState(0)
  const dbRef = useRef<IDBDatabase | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    openDB().then((db) => {
      dbRef.current = db
      setReady(true)
      countPending()
    })
    return () => dbRef.current?.close()
  }, [])

  const countPending = useCallback(() => {
    const db = dbRef.current
    if (!db) return
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).count()
    req.onsuccess = () => setPendingCount(req.result)
  }, [])

  const addToQueue = useCallback(
    async (blob: Blob, filename: string, word: string, username: string) => {
      const db = dbRef.current
      if (!db) return
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).add({ blob, filename, word, username, timestamp: Date.now() } as QueueItem)
      await new Promise<void>((resolve) => { tx.oncomplete = () => resolve() })
      countPending()
    },
    [countPending],
  )

  const getAll = useCallback((): Promise<QueueItem[]> => {
    const db = dbRef.current
    if (!db) return Promise.resolve([])
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result || [])
    })
  }, [])

  const removeFromQueue = useCallback((id: number) => {
    const db = dbRef.current
    if (!db) return
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => countPending()
  }, [countPending])

  const clearQueue = useCallback(() => {
    const db = dbRef.current
    if (!db) return
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => countPending()
  }, [countPending])

  return { pendingCount, ready, addToQueue, getAll, removeFromQueue, clearQueue }
}
