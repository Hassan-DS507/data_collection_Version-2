// Camera Controller for Arabic Sign Language Dataset Collection
// Handles camera access, MediaRecorder, and video recording

const Camera = {
  // State
  stream: null,
  mediaRecorder: null,
  recordedChunks: [],
  recordedBlob: null,
  isRecording: false,
  countdownTimer: null,
  recordingTimer: null,
  startTime: null,
  
  // Mobile detection
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  // Get optimal video constraints based on device
  getVideoConstraints() {
    const isMobile = this.isMobile();
    
    console.log(`[System] Device detected: ${isMobile ? 'Mobile' : 'Desktop'}`);
    
    // Base constraints for all devices
    const constraints = {
      video: {
        facingMode: "user",
        audio: false
      }
    };
    
    if (isMobile) {
      // Mobile-optimized settings
      constraints.video = {
        width: { ideal: 480 },  // Lower resolution for better performance
        height: { ideal: 640 },  // 3:4 aspect ratio (portrait)
        aspectRatio: { ideal: 3/4 },  // 3:4 shows more of the body
        facingMode: "user",
        frameRate: { ideal: 24, min: 15 }  // Lower frame rate for stability
      };
    } else {
      // Desktop settings
      constraints.video = {
        width: { ideal: 640 },   // 4:3 aspect ratio
        height: { ideal: 480 },  // Shows upper body well
        aspectRatio: { ideal: 4/3 },
        facingMode: "user",
        frameRate: { ideal: 30 }
      };
    }
    
    return constraints;
  },
  
  // Initialize camera
  async init() {
    console.log('[System] Initializing camera...');
    
    try {
      // Check for media devices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('كاميرا API غير مدعومة في هذا المتصفح');
      }
      
      // Get device-specific constraints
      const constraints = this.getVideoConstraints();
      console.log('[System] Using constraints:', constraints);
      
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Attach to preview element
      const preview = document.getElementById('camera-preview');
      if (!preview) {
        throw new Error('عنصر معاينة الكاميرا غير موجود');
      }
      
      preview.srcObject = this.stream;
      
      // Apply mobile-specific styling
      if (this.isMobile()) {
        preview.style.objectFit = 'cover'; // Ensures full coverage on mobile
        preview.style.transform = 'scaleX(-1)'; // Mirror effect for natural feel
      }
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        preview.onloadedmetadata = () => {
          preview.play()
            .then(() => {
              console.log('[System] Video playback started');
              resolve();
            })
            .catch((err) => {
              console.error('[System] Playback error:', err);
              reject(err);
            });
        };
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('تأخر تحميل الفيديو')), 5000);
      });
      
      console.log('[System] Camera ready');
      
      // Ensure video is actually playing
      if (preview.paused) {
        await preview.play();
      }
      
      UI.onCameraReady();
      
    } catch (error) {
      console.error('[System] Camera error:', error);
      this.handleCameraError(error);
    }
  },
  
  // Handle camera errors with Arabic messages
  handleCameraError(error) {
    let message = 'تعذر الوصول إلى الكاميرا';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      message = 'تم رفض إذن الكاميرا. يرجى السماح بالوصول إلى الكاميرا وتحديث الصفحة.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      message = 'لم يتم العثور على كاميرا. يرجى توصيل كاميرا وتحديث الصفحة.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      message = 'الكاميرا قيد الاستخدام من قبل تطبيق آخر. يرجى إغلاق التطبيقات الأخرى.';
    } else if (error.name === 'OverconstrainedError') {
      message = 'الكاميرا لا تدعم الإعدادات المطلوبة. جاري المحاولة بالإعدادات الافتراضية...';
      this.initWithFallback();
      return;
    } else if (error.message.includes('تأخر تحميل الفيديو')) {
      message = 'تأخر تشغيل الكاميرا. يرجى تحديث الصفحة والمحاولة مرة أخرى.';
    }
    
    UI.onCameraError(message);
  },
  
  // Fallback initialization with minimal constraints
  async initWithFallback() {
    console.log('[System] Trying fallback camera settings...');
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      
      const preview = document.getElementById('camera-preview');
      if (!preview) return;
      
      preview.srcObject = this.stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        preview.onloadedmetadata = () => {
          preview.play().then(resolve).catch(resolve);
        };
      });
      
      console.log('[System] Camera ready (fallback mode)');
      UI.onCameraReady();
      
    } catch (error) {
      console.error('[System] Fallback camera error:', error);
      UI.onCameraError('تعذر الوصول إلى الكاميرا. يرجى التحقق من الصلاحيات والمحاولة مرة أخرى.');
    }
  },
  
  // Get supported MIME type
  getSupportedMimeType() {
    // Prioritize MP4 for better mobile compatibility
    const preferredTypes = [
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    
    for (const mimeType of preferredTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('[System] Using MIME type:', mimeType);
        return mimeType;
      }
    }
    
    console.log('[System] Using default MIME type');
    return '';
  },
  
  // Start countdown before recording with visual feedback
  startCountdown() {
    // Determine countdown from config, default to 3
    let count = (CONFIG.countdownDuration ? CONFIG.countdownDuration / 1000 : 3);
    
    // Show countdown with visual feedback
    UI.showCountdown(count);
    
    // Add countdown sound/vibration for mobile
    if (this.isMobile() && navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    this.countdownTimer = setInterval(() => {
      count--;
      
      if (count > 0) {
        UI.showCountdown(count);
        
        // Haptic feedback on mobile for each count
        if (this.isMobile() && navigator.vibrate) {
          navigator.vibrate(50);
        }
      } else {
        clearInterval(this.countdownTimer);
        UI.hideCountdown();
        
        // Final haptic feedback
        if (this.isMobile() && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        
        this.startRecording();
      }
    }, 1000);
  },
  
  // Start recording
  startRecording() {
    console.log('[System] Starting recording...');
    
    if (!this.stream) {
      UI.showError('الكاميرا غير مهيأة. يرجى تحديث الصفحة.');
      return;
    }
    
    try {
      // Reset state
      this.recordedChunks = [];
      this.recordedBlob = null;
      
      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      
      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        console.log('[System] Recording stopped, chunks:', this.recordedChunks.length);
        this.processRecording();
      };
      
      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        console.error('[System] MediaRecorder error:', event.error);
        UI.showError('خطأ في التسجيل. يرجى المحاولة مرة أخرى.');
        this.isRecording = false;
      };
      
      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      this.startTime = Date.now();
      
      UI.showRecordingStarted();
      
      // Add recording indicator class to body for full-screen effects
      document.body.classList.add('recording-active');
      
      // Start timer updates
      this.recordingTimer = setInterval(() => {
        const elapsed = Date.now() - this.startTime;
        UI.updateTimer(elapsed, CONFIG.recordingDuration);
        
        // Auto-stop when duration reached
        if (elapsed >= CONFIG.recordingDuration) {
          this.stopRecording();
        }
      }, 100);
      
    } catch (error) {
      console.error('[System] Recording start error:', error);
      UI.showError('فشل بدء التسجيل. يرجى المحاولة مرة أخرى.');
    }
  },
  
  // Stop recording
  stopRecording() {
    console.log('[System] Stopping recording...');
    
    // Remove recording indicator
    document.body.classList.remove('recording-active');
    
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    this.isRecording = false;
  },
  
  // Process recorded video
  processRecording() {
    console.log('[System] Processing recording...');
    
    if (this.recordedChunks.length === 0) {
      UI.showError('لم يتم تسجيل أي بيانات. يرجى المحاولة مرة أخرى.');
      return;
    }
    
    // Create blob from chunks
    const mimeType = this.mediaRecorder.mimeType || 'video/mp4';
    this.recordedBlob = new Blob(this.recordedChunks, { type: mimeType });
    
    console.log('[System] Recorded blob size:', this.recordedBlob.size, 'bytes');
    
    // Check if recording is too small (likely empty)
    if (this.recordedBlob.size < 1024) { // Less than 1KB
      UI.showError('الفيديو المسجل صغير جداً. يرجى المحاولة مرة أخرى.');
      return;
    }
    
    UI.showRecordingComplete(this.recordedBlob);
  },
  
  // Reset recording state
  resetRecording() {
    console.log('[System] Resetting recording state...');
    
    // Clear any timers
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    // Remove recording indicator
    document.body.classList.remove('recording-active');
    
    // Reset state
    this.recordedChunks = [];
    this.recordedBlob = null;
    this.isRecording = false;
    
    // Ensure preview is showing
    const preview = document.getElementById('camera-preview');
    if (this.stream && preview) {
      preview.srcObject = this.stream;
      preview.play().catch(() => {});
    }
  },
  
  // Upload recording
  async uploadRecording(filename) {
    if (!this.recordedBlob) {
      console.error('[System] No recording to upload');
      UI.showError('لا يوجد تسجيل للرفع');
      return false;
    }
    
    console.log('[System] Uploading recording:', filename);
    
    try {
      // Show upload progress
      UI.showUploadProgress(0);
      
      const formData = new FormData();
      formData.append('video', this.recordedBlob, filename);
      formData.append('filename', filename);
      
      // Add user metadata if available
      if (window.userData) {
        formData.append('username', window.userData.name);
        formData.append('email', window.userData.email);
      }
      
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'فشل الرفع بسبب خطأ في الخادم');
      }
      
      console.log('[System] Upload successful:', result);
      UI.showUploadProgress(100);
      return true;
      
    } catch (error) {
      console.error('[System] Upload error:', error);
      UI.showError(`فشل الرفع: ${error.message}`);
      return false;
    }
  },
  
  // Stop camera and clean up
  stop() {
    console.log('[System] Stopping camera...');
    
    // Remove recording indicator
    document.body.classList.remove('recording-active');
    
    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }
    
    // Clear timers
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    // Stop media tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
    
    // Clear preview
    const preview = document.getElementById('camera-preview');
    if (preview) {
      preview.srcObject = null;
    }
    
    // Reset state
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordedBlob = null;
    this.isRecording = false;
  },
  
  // Check camera permissions
  async checkPermissions() {
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' });
      console.log('[System] Camera permission state:', permissions.state);
      return permissions.state;
    } catch (error) {
      console.warn('[System] Permission query not supported');
      return 'prompt';
    }
  }
};