"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, ArrowRight } from "lucide-react"
import Image from "next/image"

interface CompletionScreenProps {
  username: string
  totalRecorded: number
  totalSkipped: number
  onNewSession: () => void
}

export function CompletionScreen({ username, totalRecorded, totalSkipped, onNewSession }: CompletionScreenProps) {
  return (
    <div className="max-w-md mx-auto">
      <Card className="border shadow-sm rounded-2xl bg-white">
        <div className="p-8 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="bg-green-100 rounded-full p-5">
              <Heart className="w-14 h-14 text-green-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">شكراً لك، {username}!</h2>

          <p className="text-gray-600 mb-8 leading-relaxed">
            لقد ساهمت بنجاح في الحفاظ على لغة الإشارة العربية. مساهمتك ستساعد في تطوير تطبيقات تخدم الصم وضعاف السمع.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalRecorded}</p>
                <p className="text-sm text-gray-500">إشارات مسجلة</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalSkipped}</p>
                <p className="text-sm text-gray-500">تم تخطيها</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              onClick={onNewSession}
            >
              جلسة جديدة
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
            <Button variant="outline" className="w-full h-12 border hover:bg-gray-50 rounded-xl" onClick={() => window.close()}>
              إغلاق
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-6">© ٢٠٢٦ وِصال - مشروع الحفاظ على لغة الإشارة العربية</p>
        </div>
      </Card>
    </div>
  )
}
