"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowRight, User, AlertCircle } from "lucide-react"
import Image from "next/image"

interface WelcomeScreenProps {
  username: string
  usernameError: string
  onUsernameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onStart: () => void
}

export function WelcomeScreen({ username, usernameError, onUsernameChange, onStart }: WelcomeScreenProps) {
  return (
    <div className="max-w-md mx-auto">
      <Card className="border shadow-sm rounded-2xl bg-white">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Image src="/wasal-logo.png" alt="وصال" fill className="object-contain" priority />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">مرحباً بك في وصال</h2>
            <div className="text-gray-600 leading-relaxed text-center" dir="rtl">
              <p className="mb-2">
                مشروع يهدف إلى مساعدة الصم وضعاف السمع من خلال بناء مجموعة بيانات للغة الإشارة العربية.
              </p>
              <p className="text-gray-900 font-bold text-lg bg-blue-50 py-2 px-4 rounded-lg inline-block mt-1">
                مشاركتك البسيطة تصنع فرقاً كبيراً في حياتهم!
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                الاسم
              </label>
              <Input
                placeholder="أدخل اسمك"
                value={username}
                onChange={onUsernameChange}
                className="h-12 text-right border-gray-200"
                dir="rtl"
              />
              {usernameError && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {usernameError}
                </p>
              )}
            </div>

            <Button
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              disabled={!username || !!usernameError}
              onClick={onStart}
            >
              ابدأ المساهمة
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>

            <p className="text-xs text-center text-gray-400">
              بالاستمرار، أنت توافق على المساهمة في مجموعة بيانات لغة الإشارة العربية
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
