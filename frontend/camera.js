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
  
  // Initialize camera
  async init() {
    console.log('[System] Initializing camera...');
    
    try {
      // Check for media devices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia(CONFIG.videoConstraints);
      
      // Attach to preview element
      const preview = document.getElementById('camera-preview');
      preview.srcObject = this.stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        preview.onloadedmetadata = () => {
          preview.play().then(resolve).catch(resolve);
        };
      });
      
      console.log('[System] Camera ready');
      UI.onCameraReady();
      
    } catch (error) {
      console.error('[System] Camera error:', error);
      this.handleCameraError(error);
    }
  },
  
  // Handle camera errors
  handleCameraError(error) {
    let message = 'Unable to access camera';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      message = 'Camera permission denied. Please allow camera access and refresh the page.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      message = 'No camera found. Please connect a camera and refresh the page.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      message = 'Camera is in use by another application. Please close other apps using the camera.';
    } else if (error.name === 'OverconstrainedError') {
      message = 'Camera does not meet the required constraints. Trying with default settings...';
      // Try again with minimal constraints
      this.initWithFallback();
      return;
    }
    
    UI.onCameraError(message);
  },
  
  // Fallback initialization with minimal constraints
  async initWithFallback() {
    console.log('[System] Trying fallback camera settings...');
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      const preview = document.getElementById('camera-preview');
      preview.srcObject = this.stream;
      await preview.play();
      
      console.log('[System] Camera ready (fallback mode)');
      UI.onCameraReady();
      
    } catch (error) {
      console.error('[System] Fallback camera error:', error);
      UI.onCameraError('Unable to access camera. Please check your permissions and try again.');
    }
  },
  
  // Get supported MIME type
  getSupportedMimeType() {
    for (const mimeType of CONFIG.mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('[System] Using MIME type:', mimeType);
        return mimeType;
      }
    }
    // Return empty string to use browser default
    console.log('[System] Using default MIME type');
    return '';
  },
  
  // Start countdown before recording
  startCountdown() {
    // Determine countdown from config, default to 3
    let count = (CONFIG.countdownDuration ? CONFIG.countdownDuration / 1000 : 3);
    UI.showCountdown(count);
    
    this.countdownTimer = setInterval(() => {
      count--;
      
      if (count > 0) {
        UI.showCountdown(count);
      } else {
        clearInterval(this.countdownTimer);
        UI.hideCountdown();
        this.startRecording();
      }
    }, 1000);
  },
  
  // Start recording
  startRecording() {
    console.log('[System] Starting recording...');
    
    if (!this.stream) {
      UI.showError('Camera not initialized. Please refresh the page.');
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
        UI.showError('Recording error. Please try again.');
        this.isRecording = false;
      };
      
      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      this.startTime = Date.now();
      
      UI.showRecordingStarted();
      
      // Start timer updates
      this.recordingTimer = setInterval(() => {
        const elapsed = Date.now() - this.startTime;
        UI.updateTimer(elapsed, CONFIG.recordingDuration);
        
        if (elapsed >= CONFIG.recordingDuration) {
          this.stopRecording();
        }
      }, 100);
      
    } catch (error) {
      console.error('[System] Recording start error:', error);
      UI.showError('Failed to start recording. Please try again.');
    }
  },
  
  // Stop recording
  stopRecording() {
    console.log('[System] Stopping recording...');
    
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
      UI.showError('No video data recorded. Please try again.');
      return;
    }
    
    // Create blob from chunks
    const mimeType = this.mediaRecorder.mimeType || 'video/webm';
    this.recordedBlob = new Blob(this.recordedChunks, { type: mimeType });
    
    console.log('[System] Recorded blob size:', this.recordedBlob.size, 'bytes');
    
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
      return false;
    }
    
    console.log('[System] Uploading recording:', filename);
    
    try {
      const formData = new FormData();
      formData.append('video', this.recordedBlob, filename);
      formData.append('filename', filename);
      
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed due to server error');
      }
      
      console.log('[System] Upload successful:', result);
      return true;
      
    } catch (error) {
      // Removed the demo simulation block. We want real errors to fail properly.
      console.error('[System] Upload error:', error);
      return false;
    }
  },
  
  // Stop camera and clean up
  stop() {
    console.log('[System] Stopping camera...');
    
    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }
    
    // Clear timers
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
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
  }
};