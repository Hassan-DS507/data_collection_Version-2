"use client"

import { User, HelpCircle, RefreshCw } from "lucide-react"
import Image from "next/image"

interface HeaderProps {
  username: string
  totalRecorded: number
  pendingCount: number
  visible: boolean
}

export function Header({ username, totalRecorded, pendingCount, visible }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/wasal-logo.png" alt="وصال" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-xl">وصال</h1>
              <p className="text-xs text-gray-500">مشروع الحفاظ على لغة الإشارة العربية</p>
            </div>
          </div>

          {visible && (
            <div className="flex items-center gap-3">
              <a
                href="/ArSL_Recording_Guidelines_v2.html"
                target="_blank"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors rounded-full"
                title="دليل التصوير"
              >
                <HelpCircle className="w-4 h-4 text-yellow-700" />
                <span className="text-sm font-medium text-yellow-800">دليل التصوير</span>
              </a>
              {pendingCount > 0 && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full"
                  title="فيديوهات بانتظار الرفع"
                >
                  <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
                  <span className="text-sm font-medium text-amber-700">{pendingCount}</span>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{username}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <span className="text-sm font-medium text-blue-700">{totalRecorded}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
