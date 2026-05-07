export interface Sign {
  word: string
  fileId: string
}

export const WORD_LIST: string[] = [
  "انا", "انت", "هو", "احنا", "عاوز",
  "اقعد", "اقف", "احفظ", "جعان", "عطشان",
  "مبسوط", "زعلان", "مياه", "بيت", "مدرسة",
  "صديق", "اخت", "اخ", "ضيف", "شكرا", "اتفضل",
]

export function getDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}
