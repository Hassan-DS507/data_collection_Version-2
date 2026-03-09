import CONFIG from "./config"

export interface Sign {
  word: string
  video: string
}

function getDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export const SIGNS: Sign[] = CONFIG.referenceVideos.map((item:any) => ({
  word: item.word,
  video: getDrivePreviewUrl(item.fileId)
}))