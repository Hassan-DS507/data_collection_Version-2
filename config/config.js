/*
Configuration file for Arabic Sign Language Dataset Collection Platform
All system settings are centralized here
*/

const CONFIG = {

// ===============================
// GOOGLE DRIVE SETTINGS
// ===============================

// Folder containing reference videos
referenceFolderId: "11shPc0TSFYMsS_qN3CUO51If2oK9FcTH",

// Folder where recorded videos will be uploaded
uploadFolderId: "1P0dHu0ukQG-2qtNjh-_lWeCVuA1BC5jo",

// ===============================
// RECORDING SETTINGS
// ===============================

// Recording duration (milliseconds)
recordingDuration: 5000,

// Countdown before recording starts
countdownDuration: 3000,

// ===============================
// API SETTINGS
// ===============================

// Upload endpoint
apiEndpoint: "/api/upload",

// ===============================
// CAMERA SETTINGS
// ===============================

videoConstraints: {
video: {
width: { ideal: 1280 },
height: { ideal: 720 },
facingMode: "user"
},
audio: false
},

// ===============================
// VIDEO FORMAT SUPPORT
// ===============================

mimeTypes: [
"video/webm;codecs=vp9",
"video/webm;codecs=vp8",
"video/webm",
"video/mp4"
],

// ===============================
// GOOGLE DRIVE URL TEMPLATES
// ===============================

driveEmbedUrl: "https://drive.google.com/file/d/{fileId}/preview",

driveDownloadUrl: "https://drive.google.com/uc?export=download&id={fileId}",

// ===============================
// REFERENCE VIDEOS
// ===============================
// IMPORTANT:
// Replace fileId with actual Google Drive file IDs
// extracted from each video link

referenceVideos: [
  {
    "word": "زعلان",
    "filename": "زعلان#داليا.mp4",
    "fileId": "1wYvnRxSj1-oDTtAXyV5xPUoTHKoLi71f"
  },
  {
    "word": "متضايق",
    "filename": "متضايق#داليا.mp4",
    "fileId": "1QFdfuGHSNngiFsueBn7jvtmFpI8lper-"
  },
  {
    "word": "مبسوط",
    "filename": "مبسوط#داليا.mp4",
    "fileId": "1Mf_PF1gYhOYnt5CGBbD2jssnrz0R5Eqn"
  },
  {
    "word": "مياه",
    "filename": "مياه#داليا.mp4",
    "fileId": "1mFZu6ZGq98I3JFsrbRw9PgM1TkAn-XmH"
  },
  {
    "word": "احفظ",
    "filename": "احفظ#داليا.mp4",
    "fileId": "1fbGbSk92oywYwabYEEuWcA7XdqIitbQb"
  },
  {
    "word": "اقف",
    "filename": "اقف#داليا.mp4",
    "fileId": "1lBvlnzWjMhOauMs1bmok6JI6jgj8p2Du"
  },
  {
    "word": "اقعد",
    "filename": "اقعد#داليا.mp4",
    "fileId": "1Mx0PSZMSs-FVhjdPjaACsb9nYG5muPAI"
  },
  {
    "word": "كرسى",
    "filename": "كرسى#داليا.mp4",
    "fileId": "1VE5MHac_b63Y4zAg-lJZadY0fFJcjoJy"
  },
  {
    "word": "مراية",
    "filename": "مراية#داليا.mp4",
    "fileId": "1Mqfixi-M6_STH5VMV1c1GCoIWTk2Jtvj"
  },
  {
    "word": "براية",
    "filename": "براية#داليا.mp4",
    "fileId": "1ms1863EbSGGG0w9qkrX01gD-lJfuJHW9"
  },
  {
    "word": "استيكة",
    "filename": "استيكة#داليا.mp4",
    "fileId": "13vlE0OG6xWC5nzMv3UHMnhMxCPPCYClE"
  },
  {
    "word": "قلم",
    "filename": "قلم#داليا.mp4",
    "fileId": "1HJ7O1A5u4oFBxfVylbYtNfTukfIFWXF8"
  },
  {
    "word": "كراسة",
    "filename": "كراسة#داليا.mp4",
    "fileId": "1UWEvnfSu39o4se9J4OHgjK7l6Id3FxOT"
  },
  {
    "word": "كتاب",
    "filename": "كتاب#داليا.mp4",
    "fileId": "1lU0_WXulsP_L8evJ2YSF6AzLdmNy5-M5"
  },
  {
    "word": "عيد",
    "filename": "عيد#داليا.mp4",
    "fileId": "1Ax8bdnRfya3t8dS_PIYV8c8mHJfuFp_a"
  },
  {
    "word": "رمضان",
    "filename": "رمضان#داليا.mp4",
    "fileId": "1rt1ctQXHJlOOD3pP4UodDRKFgD1C4sie"
  },
  {
    "word": "فاطر",
    "filename": "فاطر#داليا.mp4",
    "fileId": "1_eo1ZaaxMbJP2-7iNyl4YlrjoXHmHO30"
  },
  {
    "word": "صائم",
    "filename": "صائم#داليا.mp4",
    "fileId": "115s6VeQmNxaxPMlnKX-2EhEhQcyL9uFw"
  },
  {
    "word": "لا",
    "filename": "لا#داليا.mp4",
    "fileId": "11vCdggScwdBAqcw9j5c7QkdgMqybhL5a"
  },
  {
    "word": "ايوه",
    "filename": "ايوه#داليا.mp4",
    "fileId": "1M5j_ZUSVmfY0f-YZC6ptcSuone63UcWq"
  },
  {
    "word": "تليغون",
    "filename": "تليغون#داليا.mp4",
    "fileId": "1etCFDKoJZ7cUi5H6GQpu5yFnvtSVE2K-"
  },
  {
    "word": "حرام",
    "filename": "حرام#داليا.mp4",
    "fileId": "1242ld3ACYtYpYHgIQGD4Z1tuGVTwF4sp"
  },
  {
    "word": "عيب",
    "filename": "عيب#داليا.mp4",
    "fileId": "1REbAxmGJiXJ9dKUE33rKUthmGEVOgF3g"
  },
  {
    "word": "قران",
    "filename": "قران#داليا.mp4",
    "fileId": "1oLKfkoK013iTa00xwIpugREsfkeiG1Vd"
  },
  {
    "word": "هدوم",
    "filename": "هدوم#داليا.mp4",
    "fileId": "1hZ50yi2FRESPFFWNDGocS58VIrklgXiH"
  },
  {
    "word": "العشاء",
    "filename": "العشاء#داليا.mp4",
    "fileId": "1X0iaoX7k1C-oez2C5jwbyZG7vdk4Jr7L"
  },
  {
    "word": "المغرب",
    "filename": "المغرب#داليا.mp4",
    "fileId": "1kzDDuZ3Iss64Mb87Ks3OLnAaw2LHCMG_"
  },
  {
    "word": "العصر",
    "filename": "العصر#داليا.mp4",
    "fileId": "1hksx-oyzfsZGUojEnxKXViJsJiTCmLFN"
  },
  {
    "word": "الظهر",
    "filename": "الظهر#داليا.mp4",
    "fileId": "1IZ_Ca-dj-uKny3sLMWOV3qtmxldLpgiu"
  },
  {
    "word": "الفجر",
    "filename": "الفجر#داليا.mp4",
    "fileId": "1ptKhkoQfAFR7QkH3sXmkJ1cpgqNZiez2"
  },
  {
    "word": "صلاة",
    "filename": "صلاة#داليا.mp4",
    "fileId": "1XXncLLbMAn4nCB_1CEywcgK9tIeIhb_T"
  },
  {
    "word": "بارد",
    "filename": "بارد#داليا.mp4",
    "fileId": "1GXhRXaOftm9X0Xrgpv_eaFFqCjLypOo3"
  },
  {
    "word": "برد",
    "filename": "برد#داليا(1).mp4",
    "fileId": "1NM9eLqYPBSjyaQsG9ALdZMRmfFRZecz-"
  },
  {
    "word": "حر",
    "filename": "حر#داليا.mp4",
    "fileId": "1U9dh1tM2Pvh_UufKczbWWRyUm1qtwQT2"
  },
  {
    "word": "مطر",
    "filename": "مطر#داليا.mp4",
    "fileId": "1HiEQ8s45PH-J7iNzs9VCG0duo9vNqPyV"
  },
  {
    "word": "استاذ",
    "filename": "استاذ#داليا.mp4",
    "fileId": "1gHdpLmaZLFm71IFWyMAucQyiP_Nn2lQf"
  },
  {
    "word": "فصل",
    "filename": "فصل#داليا.mp4",
    "fileId": "1cqhrIbwkl3g_kfl96HUq1aRhyZXNPfZf"
  },
  {
    "word": "مدرسة",
    "filename": "مدرسة#داليا.mp4",
    "fileId": "1SRSCe8QdzAaTmUXAClZgaqUW_MXxCqqz"
  },
  {
    "word": "كلب",
    "filename": "كلب#داليا.mp4",
    "fileId": "1hMVDSBLFPr-HZW2Effvg-en16dbUVl90"
  },
  {
    "word": "قطه",
    "filename": "قطه#داليا.mp4",
    "fileId": "1ge11rBFMAYnH6q89z2AFs-YyasnIuVbT"
  },
  {
    "word": "عطشان",
    "filename": "عطشان#داليا.mp4",
    "fileId": "1shnFobUBjeyeK0f1AWnaUWW8ZtELAGcm"
  },
  {
    "word": "جعان",
    "filename": "جعان#داليا.mp4",
    "fileId": "1SXuZpPrF3ax98j9HP4EY4PoeU7n-xTOS"
  },
  {
    "word": "فراخ",
    "filename": "فراخ#داليا.mp4",
    "fileId": "1tpXPvjtk3sLnuCZ8WCkSFURNsQciNyvp"
  },
  {
    "word": "لحمه",
    "filename": "لحمه#داليا.mp4",
    "fileId": "1F1-Sk4oOkjE5N_SRQMcZKm0s38I36BVG"
  },
  {
    "word": "ارز",
    "filename": "ارز#داليا.mp4",
    "fileId": "1VVPdBp6Ql8aCOzkYx3o9DtBWfvLXnwZK"
  },
  {
    "word": "طعمية",
    "filename": "طعمية#داليا.mp4",
    "fileId": "10VrmXEYGbzFsalp2KiE9MjeBv4BGRPbE"
  },
  {
    "word": "فول",
    "filename": "فول#داليا.mp4",
    "fileId": "1WCl1d3k4W5-HLw5bqN5G7t1daxQPj1Md"
  },
  {
    "word": "مساء",
    "filename": "مساء#داليا.mp4",
    "fileId": "1fcTKqd7QHCW1ZmQGACCy-soeRH0DnIMx"
  },
  {
    "word": "صباح",
    "filename": "صباح#داليا.mp4",
    "fileId": "1z5MHsJaJ_8MHV0fpOyCAU6Ev4Hn435io"
  },
  {
    "word": "بنى",
    "filename": "بنى#داليا.mp4",
    "fileId": "1Zx5oq4-GygH_516RnwHVLxLuz8Evnq4Y"
  },
  {
    "word": "ذهبى",
    "filename": "ذهبى#داليا.mp4",
    "fileId": "1R19B_8Ll0EkFVp-AY3U0nERgO-kv9ATy"
  },
  {
    "word": "فضى",
    "filename": "فضى#داليا.mp4",
    "fileId": "1Cfv8T84XsxDNHrQgF1y9dqpf4C29hGdk"
  },
  {
    "word": "وردى",
    "filename": "وردى#داليا.mp4",
    "fileId": "1oCVM1pZKSKnZSC-HZ-hu8Y4ARXy0Fx9Y"
  },
  {
    "word": "ازرق",
    "filename": "ازرق#داليا.mp4",
    "fileId": "1xUak5PVdWC6LhWagxCY_jtzS2ZkygkmP"
  },
  {
    "word": "اسود",
    "filename": "اسود#داليا.mp4",
    "fileId": "1uRg3HSpR-1_e9W6JUORF2Idi7sRl_rKx"
  },
  {
    "word": "ابيض",
    "filename": "ابيض#داليا.mp4",
    "fileId": "1BSa6vn3AL0BbU6fTPFDDUsX1s4VtR8Z9"
  },
  {
    "word": "اخضر",
    "filename": "اخضر#داليا.mp4",
    "fileId": "1FqaJm4r4E6HlA_WHxLC186xs2J_vXA8-"
  },
  {
    "word": "احمر",
    "filename": "احمر#داليا.mp4",
    "fileId": "1_siQ4dK2FV0E89cQjznTvqSry3WMxIFm"
  },
  {
    "word": "لون",
    "filename": "لون#داليا.mp4",
    "fileId": "1EE__0a_dO8o9aNK5dlEgT_RQDJT0ErPq"
  },
  {
    "word": "بسم الله الرحمن الرحيم",
    "filename": "بسم الله الرحمن الرحيم#داليا.mp4",
    "fileId": "1ecG0E9k9aUIxdqUjBsi9tViO5TYCr-_X"
  },
  {
    "word": "اتعرف",
    "filename": "اتعرف#داليا.mp4",
    "fileId": "1dOYM9b7GMVJTsZ4N2Ub-zDK2iT-BKf8v"
  },
  {
    "word": "عاوز",
    "filename": "عاوز#داليا.mp4",
    "fileId": "1YNjSxP81EEBLwVEHNsNMt9cXUXvo5uuz"
  },
  {
    "word": "السلام عليكم ورحمة الله وبركاته",
    "filename": "السلام عليكم ورحمة الله وبركاته#داليا.mp4",
    "fileId": "1Lvn80E3sA5dZuTpiKBJovs-SemRtMy_3"
  },
  {
    "word": "مساء الخير",
    "filename": "مساء الخير#داليا.mp4",
    "fileId": "1_1cPWHy_6gyqcNu6LNWMxm191aeAClr0"
  },
  {
    "word": "صباح الخير",
    "filename": "صباح الخير#داليا.mp4",
    "fileId": "1XFnzEqRR34NN1uHOHIjxj7qphvAKTjvR"
  },
  {
    "word": "احنا",
    "filename": "احنا#داليا.mp4",
    "fileId": "1_6c6LNHLV9dP0Q7uo-0przO2smWyrnWN"
  },
  {
    "word": "هو",
    "filename": "هو#داليا.mp4",
    "fileId": "1p3WGYv5y8XGp1Znasq804BKTiajMxGoz"
  },
  {
    "word": "انا",
    "filename": "انا#داليا.mp4",
    "fileId": "1-LWBCQOsNzuxz4aOf3ou8cxfEvT6wL-M"
  },
  {
    "word": "انت",
    "filename": "انت#داليا.mp4",
    "fileId": "1KzTwA0rN4Fsni7YCXE9_fbMnDTlQKbX8"
  },
  {
    "word": "اتفضل",
    "filename": "اتفضل#داليا.mp4",
    "fileId": "1NeLsoy6TfP69x9Jh1HWSsA0hZ5KG3Osg"
  },
  {
    "word": "شكرا",
    "filename": "شكرا#داليا.mp4",
    "fileId": "1be5RYUgdK5tDnJWdhMQgrAzLWyFYNUnn"
  },
  {
    "word": "هدية",
    "filename": "هدية#داليا.mp4",
    "fileId": "1gvdrySqZQ66LS4XsKdA2I8xD5oXHDHGD"
  },
  {
    "word": "ضيف",
    "filename": "ضيف#داليا.mp4",
    "fileId": "1JhCHfoIfTh9yZgpT4rHDz8pJcub1vWvu"
  },
  {
    "word": "جار",
    "filename": "جار#داليا.mp4",
    "fileId": "1oG-rTsgSnhih_jt3zcvSMUhilEVXxXP7"
  },
  {
    "word": "صديق",
    "filename": "صديق#داليا.mp4",
    "fileId": "1NfgLlKki2V59qZHslSmckyEnXfMHisnh"
  },
  {
    "word": "وجه",
    "filename": "وجه#داليا.mp4",
    "fileId": "1mnFDGbyGDz09DAPXwXouJLCdA5AS9IHb"
  },
  {
    "word": "صيدلية",
    "filename": "صيدلية#داليا.mp4",
    "fileId": "1a6e4P135vl0plusaBGSCEvRycnULTBt3"
  },
  {
    "word": "مريض",
    "filename": "مريض#داليا.mp4",
    "fileId": "1B6ZVI9-MKiMZDk2y_EqNaAISPewoBBgC"
  },
  {
    "word": "دواء",
    "filename": "دواء#داليا.mp4",
    "fileId": "1SZjNhy84EbdOyW85uh87Qfu8tyQUVL7U"
  },
  {
    "word": "برد",
    "filename": "برد#داليا.mp4",
    "fileId": "1GHwE-XR_I3hwkz0tan6k2-D6oh_OmjhU"
  },
  {
    "word": "وجع",
    "filename": "وجع#داليا.mp4",
    "fileId": "1tvtQkooLlqjrZY5PJNVYRR3JPmASsweB"
  },
  {
    "word": "ضيوف",
    "filename": "ضيوف#داليا.mp4",
    "fileId": "18O2meSqFKkTwa55ripX-sEM0kGXQN04p"
  },
  {
    "word": "اوضة نوم",
    "filename": "اوضة نوم#داليا.mp4",
    "fileId": "1zX4rdKapLpcI40Kk7HPcfZltaN5cxWPI"
  },
  {
    "word": "سرير",
    "filename": "سرير#داليا.mp4",
    "fileId": "1mPCqN0MUO2w5M6QvGvlTsZEnMHL5Snzu"
  },
  {
    "word": "بيت",
    "filename": "بيت#داليا.mp4",
    "fileId": "1G2EHP4B9x-zilqxcUmwxLh5xct4s7FI-"
  },
  {
    "word": "طفل",
    "filename": "طفل#داليا.mp4",
    "fileId": "1ImNOPLlqwDhcWtoaKkXK1vOKItXIoJ4E"
  },
  {
    "word": "اخ",
    "filename": "اخ#داليا.mp4",
    "fileId": "1lb-kzRURoViFCE51H-73fpEVy42JyeNZ"
  },
  {
    "word": "اخت",
    "filename": "اخت#داليا.mp4",
    "fileId": "1c6Y0fPIAY0D4HeNB18Yml5B_TKfxL8JW"
  },
  {
    "word": "حمام",
    "filename": "حمام#داليا.mp4",
    "fileId": "1EGWBF2srh2Rqlfb3rDoexgU6sPu26t7M"
  },
  {
    "word": "نظارة",
    "filename": "نظارة#داليا.mp4",
    "fileId": "10Hza5XJuufHp6GSr0ay0KwZtu6zj7K0p"
  },
  {
    "word": "موضوع",
    "filename": "موضوع#داليا.mp4",
    "fileId": "1QbWRweOE0Qiykf2p_tnrgK5w3CySb8FN"
  },
  {
    "word": "مهم",
    "filename": "مهم#داليا.mp4",
    "fileId": "1EY4Fp2rQJpVskIR8Wp8K-BC3M31SqXmC"
  },
  {
    "word": "مشغول",
    "filename": "مشغول#داليا.mp4",
    "fileId": "15D3DlXZXXFVwfqY2o8jq7F3yVr31pAAk"
  },
  {
    "word": "مستعجل",
    "filename": "مستعجل#داليا.mp4",
    "fileId": "1IkXCQbfzBMiPotOlYjzx_gRIlIbnlJRC"
  },
  {
    "word": "زميل",
    "filename": "زميل#داليا.mp4",
    "fileId": "1-ea5DFVcp0nupR__kZLmCaiuNwBvBYY6"
  },
  {
    "word": "طلاب",
    "filename": "طلاب#داليا.mp4",
    "fileId": "1d-W21c56-IhPkLNF_yE4GGXCQWD0d4GK"
  },
  {
    "word": "عيد ميلاد",
    "filename": "عيد ميلاد#داليا.mp4",
    "fileId": "1mMq8k2Hyda4mSEcCtwk1OeIcvDnvg6GM"
  },
  {
    "word": "الشهر الماضى",
    "filename": "الشهر الماضى#داليا.mp4",
    "fileId": "1m2NzHwTcgcYteGr6aLDsXWx2zhJq5-7r"
  },
  {
    "word": "الاسبوع الماضى",
    "filename": "الاسبوع الماضى#داليا.mp4",
    "fileId": "1XSrsEgxzQHdc_dLrj8n1S_9KvFZ1QoDq"
  },
  {
    "word": "سنة",
    "filename": "سنة#داليا.mp4",
    "fileId": "1-oRM6qT5R_m_XeAYfe7j34cQmKI1ZW1_"
  }
]

};

// Export configuration
export default CONFIG;
