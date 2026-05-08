const CONFIG = {
  recordingDuration: 5000,
  countdownDuration: 3000,
  apiEndpoint: "/api/upload",

  videoConstraints: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user"
    },
    audio: false
  },

  mimeTypes: [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4"
  ],
}

export default CONFIG
