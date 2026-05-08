"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface InstructionsScreenProps {
  onStart: () => void
}

const PAGES = [
  {
    title: "مرحباً بك في وصال",
    description:
      "وصال يهدف إلى مساعدة الصم وضعاف السمع على التواصل بسهولة أكبر مع الآخرين من خلال استخدام تقنيات الذكاء الاصطناعي الحديثة.",
    points: [
      "مشاركتك البسيطة تساعد في تطوير تطبيقات تترجم لغة الإشارة",
      "كل فيديو تسجله يقربنا خطوة من عالم أكثر تواصلاً",
      "لا تحتاج أي خبرة مسبقة، فقط بضع دقائق من وقتك",
    ],
  },
  {
    title: "كيف ستساعد؟",
    description: "ثلاث خطوات بسيطة تصنع الفرق",
    points: [
      "تشاهد فيديو قصير للإشارة المطلوبة",
      "تسجل فيديو لنفسك وأنت تؤدي الإشارة",
      "يتم حفظ الفيديو تلقائياً في قاعدة البيانات",
    ],
  },
  {
    title: "طريقة التسجيل الصحيحة",
    description: "اتبع هذه الخطوات لتسجيل مثالي",
    points: [
      "تأكد من ظهور الجزء العلوي من الجسم واليدين بوضوح",
      "انتظر ثانية قبل بدء الإشارة (عد تنازلي)",
      "أدِّ الإشارة بوضوح كالمعتاد",
      "بعد الانتهاء، أنزل يديك وابقَ ثابتاً حتى انتهاء الوقت",
      "يمكنك مشاهدة الفيديو المرجعي في أي وقت",
    ],
  },
  {
    title: "مراجعة التسجيل",
    description: "تأكد من جودة التسجيل قبل الحفظ",
    points: [
      "بعد التسجيل، يمكنك مشاهدة الفيديو الذي سجلته",
      "إذا كان صحيحاً، اضغط حفظ والتالي",
      "إذا أخطأت، يمكنك الضغط إعادة وتسجيل الإشارة مرة أخرى",
      "يمكنك تخطي أي إشارة لا تستطيع تأديتها",
    ],
  },
]

export function InstructionsScreen({ onStart }: InstructionsScreenProps) {
  const [page, setPage] = useState(0)

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border shadow-sm rounded-2xl bg-white">
        <div className="p-8">
          <div className="flex justify-center gap-2 mb-8">
            {PAGES.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === page ? "w-8 bg-blue-600" : "w-2 bg-gray-200",
                )}
              />
            ))}
          </div>

          <div className="space-y-6">
            <div className="p-6 border border-gray-100 rounded-xl bg-gray-50">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">{PAGES[page].title}</h2>
                <p className="text-gray-600 mt-1">{PAGES[page].description}</p>
              </div>
              <ul className="space-y-3">
                {PAGES[page].points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-blue-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            {page > 0 && (
              <Button
                variant="outline"
                className="flex-1 h-12 border hover:bg-gray-50 rounded-xl"
                onClick={() => setPage((p) => p - 1)}
              >
                السابق
              </Button>
            )}
            <Button
              className={cn("flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl", page === 0 && "w-full")}
              onClick={() => {
                if (page < PAGES.length - 1) setPage((p) => p + 1)
                else onStart()
              }}
            >
              {page === PAGES.length - 1 ? "ابدأ التسجيل" : "التالي"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
