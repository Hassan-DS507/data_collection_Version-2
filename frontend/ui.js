// UI Controller for Arabic Sign Language Dataset Collection
// Handles step navigation, user interactions, and state management

const UI = {
  // State
  currentStep: 'welcome',
  username: '',
  currentWordIndex: 0,
  totalRecorded: 0,
  referenceVideos: [],
  
  // DOM Elements (cached on init)
  elements: {},
  
  // Initialize UI
  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadReferenceVideos();
    console.log('[System] UI initialized');
  },
  
  // Cache DOM elements for performance
  cacheElements() {
    this.elements = {
      // Steps
      stepWelcome: document.getElementById('step-welcome'),
      stepInstructions: document.getElementById('step-instructions'),
      stepRecording: document.getElementById('step-recording'),
      stepComplete: document.getElementById('step-complete'),
      
      // Welcome step
      usernameInput: document.getElementById('username'),
      btnStart: document.getElementById('btn-start'),
      
      // Instructions step
      btnContinue: document.getElementById('btn-continue'),
      
      // Recording step
      currentWord: document.getElementById('current-word'),
      referenceVideo: document.getElementById('reference-video'),
      referenceLoading: document.getElementById('reference-loading'),
      cameraPreview: document.getElementById('camera-preview'),
      playbackVideo: document.getElementById('playback-video'),
      cameraLoading: document.getElementById('camera-loading'),
      recordingIndicator: document.getElementById('recording-indicator'),
      countdownOverlay: document.getElementById('countdown-overlay'),
      countdownNumber: document.getElementById('countdown-number'),
      timerOverlay: document.getElementById('timer-overlay'),
      timerProgress: document.getElementById('timer-progress'),
      timerText: document.getElementById('timer-text'),
      btnRecord: document.getElementById('btn-record'),
      btnRetry: document.getElementById('btn-retry'),
      btnUpload: document.getElementById('btn-upload'),
      statusMessage: document.getElementById('status-message'),
      btnSkip: document.getElementById('btn-skip'),
      progressText: document.getElementById('progress-text'),
      
      // Complete step
      totalRecordedDisplay: document.getElementById('total-recorded'),
      btnNewSession: document.getElementById('btn-new-session'),
      
      // Error modal
      errorModal: document.getElementById('error-modal'),
      errorMessage: document.getElementById('error-message'),
      btnCloseError: document.getElementById('btnClose-error'),
    };
  },
  
  // Bind event listeners
  bindEvents() {
    // Username input
    if(this.elements.usernameInput) {
      this.elements.usernameInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        this.elements.btnStart.disabled = value.length === 0;
      });
      
      // Enter key on username input
      this.elements.usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !this.elements.btnStart.disabled) {
          this.elements.btnStart.click();
        }
      });
    }
    
    // Start button
    if(this.elements.btnStart) {
      this.elements.btnStart.addEventListener('click', () => {
        this.username = this.elements.usernameInput.value.trim();
        if (this.username) {
          this.goToStep('instructions');
        }
      });
    }
    
    // Continue button
    if(this.elements.btnContinue) {
      this.elements.btnContinue.addEventListener('click', () => {
        this.goToStep('recording');
        this.startRecordingSession();
      });
    }
    
    // Record button
    if(this.elements.btnRecord) {
      this.elements.btnRecord.addEventListener('click', () => {
        Camera.startCountdown();
      });
    }
    
    // Retry button
    if(this.elements.btnRetry) {
      this.elements.btnRetry.addEventListener('click', () => {
        this.resetRecordingUI();
        Camera.resetRecording();
      });
    }
    
    // Upload button
    if(this.elements.btnUpload) {
      this.elements.btnUpload.addEventListener('click', () => {
        this.uploadRecording();
      });
    }
    
    // Skip button
    if(this.elements.btnSkip) {
      this.elements.btnSkip.addEventListener('click', () => {
        this.nextWord();
      });
    }
    
    // New session button
    if(this.elements.btnNewSession) {
      this.elements.btnNewSession.addEventListener('click', () => {
        this.resetSession();
      });
    }
    
    // Error modal close
    if(this.elements.btnCloseError) {
      this.elements.btnCloseError.addEventListener('click', () => {
        this.hideError();
      });
    }
  },
  
  // Load reference videos from configuration directly
  loadReferenceVideos() {
    if (typeof CONFIG !== 'undefined' && CONFIG.referenceVideos) {
      this.referenceVideos = CONFIG.referenceVideos;
      console.log(`[System] Loaded ${this.referenceVideos.length} references directly from CONFIG`);
    } else {
      console.error('[System] CONFIG is missing or referenceVideos not found!');
      this.showError('Unable to load configuration. Please ensure config.js is properly loaded.');
    }
  },
  
  // Navigate to a step
  goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(el => {
      el.classList.remove('active');
    });
    
    // Show target step
    const stepElement = document.getElementById(`step-${step}`);
    if (stepElement) {
      stepElement.classList.add('active');
      this.currentStep = step;
    }
  },
  
  // Start recording session
  async startRecordingSession() {
    this.currentWordIndex = 0;
    this.updateProgress();
    await this.loadCurrentWord();
    if(typeof Camera !== 'undefined') {
      await Camera.init();
    } else {
      console.error('[System] Camera object is not defined. Make sure camera.js is loaded.');
    }
  },
  
  // Load current word and reference video
  async loadCurrentWord() {
    if (this.currentWordIndex >= this.referenceVideos.length) {
      this.completeSession();
      return;
    }
    
    const current = this.referenceVideos[this.currentWordIndex];
    if(this.elements.currentWord) this.elements.currentWord.textContent = current.word;
    if(this.elements.referenceLoading) this.elements.referenceLoading.classList.remove('hidden');
    
    // Using direct Google Drive download link with cache-buster
    const videoUrl = `https://drive.google.com/uc?export=download&id=${current.fileId}`;
    
    if(this.elements.referenceVideo) {
      this.elements.referenceVideo.src = `${videoUrl}&t=${new Date().getTime()}`;
      this.elements.referenceVideo.crossOrigin = "anonymous";
      this.elements.referenceVideo.load();
      
      this.elements.referenceVideo.onloadeddata = () => {
        if(this.elements.referenceLoading) this.elements.referenceLoading.classList.add('hidden');
      };
      
      this.elements.referenceVideo.onerror = () => {
        if(this.elements.referenceLoading) {
          this.elements.referenceLoading.innerHTML = `
            <p style="color: white;">Error loading video from Google Drive.</p>
            <p style="color: #888; font-size: 0.875rem;">Sign: ${current.word}</p>
            <p style="color: #ff6b6b; font-size: 0.75rem; margin-top: 5px;">Verify the Google Drive folder is set to "Anyone with the link can view".</p>
          `;
        }
      };
    }
    
    this.updateProgress();
  },
  
  // Update progress display
  updateProgress() {
    const total = this.referenceVideos.length;
    const current = this.currentWordIndex + 1;
    if(this.elements.progressText) this.elements.progressText.textContent = `Sign ${current} of ${total}`;
  },
  
  // Reset recording UI for new recording
  resetRecordingUI() {
    if(this.elements.btnRecord) {
      this.elements.btnRecord.style.display = 'inline-flex';
      this.elements.btnRecord.disabled = false;
      this.elements.btnRecord.innerHTML = 'Record';
    }
    if(this.elements.btnRetry) this.elements.btnRetry.style.display = 'none';
    if(this.elements.btnUpload) this.elements.btnUpload.style.display = 'none';
    if(this.elements.playbackVideo) this.elements.playbackVideo.style.display = 'none';
    if(this.elements.cameraPreview) this.elements.cameraPreview.style.display = 'block';
    this.clearStatus();
  },
  
  // Show recording started state
  showRecordingStarted() {
    if(this.elements.btnRecord) {
      this.elements.btnRecord.disabled = true;
      this.elements.btnRecord.innerHTML = '<span class="record-icon"></span> Recording...';
    }
    if(this.elements.recordingIndicator) this.elements.recordingIndicator.style.display = 'flex';
    if(this.elements.timerOverlay) this.elements.timerOverlay.style.display = 'flex';
  },
  
  // Show countdown
  showCountdown(number) {
    if(this.elements.countdownOverlay) {
      this.elements.countdownOverlay.style.display = 'flex';
      if(this.elements.countdownNumber) {
        this.elements.countdownNumber.textContent = number;
        this.elements.countdownNumber.style.animation = 'none';
        // Trigger reflow
        this.elements.countdownNumber.offsetHeight;
        this.elements.countdownNumber.style.animation = 'countdownPulse 1s ease-out';
      }
    }
  },
  
  // Hide countdown
  hideCountdown() {
    if(this.elements.countdownOverlay) this.elements.countdownOverlay.style.display = 'none';
  },
  
  // Update timer
  updateTimer(elapsed, duration) {
    const remaining = Math.max(0, (duration - elapsed) / 1000);
    const progress = (elapsed / duration) * 100;
    if(this.elements.timerProgress) this.elements.timerProgress.style.width = `${progress}%`;
    if(this.elements.timerText) this.elements.timerText.textContent = `${remaining.toFixed(1)}s`;
  },
  
  // Show recording complete state
  showRecordingComplete(videoBlob) {
    if(this.elements.recordingIndicator) this.elements.recordingIndicator.style.display = 'none';
    if(this.elements.timerOverlay) this.elements.timerOverlay.style.display = 'none';
    if(this.elements.btnRecord) this.elements.btnRecord.style.display = 'none';
    if(this.elements.btnRetry) this.elements.btnRetry.style.display = 'inline-flex';
    if(this.elements.btnUpload) this.elements.btnUpload.style.display = 'inline-flex';
    
    // Show playback video
    if(this.elements.cameraPreview) this.elements.cameraPreview.style.display = 'none';
    if(this.elements.playbackVideo) {
      this.elements.playbackVideo.style.display = 'block';
      this.elements.playbackVideo.src = URL.createObjectURL(videoBlob);
      this.elements.playbackVideo.load();
    }
    
    this.showStatus('Recording complete. Review and upload, or try again.', 'info');
  },
  
  // Upload recording
  async uploadRecording() {
    const current = this.referenceVideos[this.currentWordIndex];
    const filename = `${current.word}#${this.username}.mp4`;
    
    if(this.elements.btnUpload) this.elements.btnUpload.disabled = true;
    if(this.elements.btnRetry) this.elements.btnRetry.disabled = true;
    this.showStatus('Uploading...', 'info');
    
    try {
      if(typeof Camera !== 'undefined') {
        const success = await Camera.uploadRecording(filename);
        
        if (success) {
          this.totalRecorded++;
          this.showStatus('Upload successful!', 'success');
          
          // Auto-advance after a short delay
          setTimeout(() => {
            this.nextWord();
          }, 1500);
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (error) {
      console.error('[System] Upload error:', error);
      this.showStatus('Upload failed. Please try again.', 'error');
      if(this.elements.btnUpload) this.elements.btnUpload.disabled = false;
      if(this.elements.btnRetry) this.elements.btnRetry.disabled = false;
    }
  },
  
  // Move to next word
  nextWord() {
    this.currentWordIndex++;
    
    if (this.currentWordIndex >= this.referenceVideos.length) {
      this.completeSession();
    } else {
      this.resetRecordingUI();
      if(typeof Camera !== 'undefined') Camera.resetRecording();
      this.loadCurrentWord();
    }
  },
  
  // Complete the session
  completeSession() {
    if(typeof Camera !== 'undefined') Camera.stop();
    if(this.elements.totalRecordedDisplay) this.elements.totalRecordedDisplay.textContent = this.totalRecorded;
    this.goToStep('complete');
  },
  
  // Reset for new session
  resetSession() {
    this.currentWordIndex = 0;
    this.totalRecorded = 0;
    this.username = '';
    if(this.elements.usernameInput) this.elements.usernameInput.value = '';
    if(this.elements.btnStart) this.elements.btnStart.disabled = true;
    this.goToStep('welcome');
  },
  
  // Status messages
  showStatus(message, type = 'info') {
    if(this.elements.statusMessage) {
      this.elements.statusMessage.textContent = message;
      this.elements.statusMessage.className = `status-message ${type}`;
    }
  },
  
  clearStatus() {
    if(this.elements.statusMessage) {
      this.elements.statusMessage.textContent = '';
      this.elements.statusMessage.className = 'status-message';
    }
  },
  
  // Error modal
  showError(message) {
    if(this.elements.errorMessage) this.elements.errorMessage.textContent = message;
    if(this.elements.errorModal) this.elements.errorModal.style.display = 'flex';
  },
  
  hideError() {
    if(this.elements.errorModal) this.elements.errorModal.style.display = 'none';
  },
  
  // Camera state callbacks
  onCameraReady() {
    if(this.elements.cameraLoading) this.elements.cameraLoading.classList.add('hidden');
    if(this.elements.btnRecord) this.elements.btnRecord.disabled = false;
  },
  
  onCameraError(message) {
    if(this.elements.cameraLoading) {
      this.elements.cameraLoading.innerHTML = `
        <p style="color: #ff6b6b;">Camera Error</p>
        <p style="color: #888; font-size: 0.875rem;">${message}</p>
      `;
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});