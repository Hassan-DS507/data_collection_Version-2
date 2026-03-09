# Arabic Sign Language Dataset Collection Platform

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Node.js (for serving frontend in development)
- Google Cloud Platform account with Drive API enabled

### Backend Setup

1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install fastapi uvicorn python-multipart google-auth google-auth-oauthlib google-api-python-client python-dotenv
   ```

3. Configure Google Drive API:
   - Go to Google Cloud Console
   - Create a new project or select existing
   - Enable Google Drive API
   - Create a Service Account
   - Download the JSON key file
   - Copy credentials to config/env.example and rename to .env

4. Share Google Drive folders with service account:
   - Share the reference folder with your service account email (read access)
   - Share the upload folder with your service account email (write access)

5. Run the backend:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

The frontend is static HTML/CSS/JS. You can:

1. Serve directly with Python:
   ```bash
   cd frontend
   python -m http.server 3000
   ```

2. Or open index.html directly in a browser (some features may be limited)

### Recording Guidelines for Volunteers

#### Good Recording Conditions
- Plain background (white or light grey wall)
- Good lighting from front or side
- Camera fixed on tripod or stable surface
- Dark clothing (black, navy, dark grey)
- Upper body visible (waist to head)
- Both hands visible at all times

#### Bad Recording Conditions (Avoid)
- Busy or cluttered background
- Light source behind the person (backlit)
- Handheld camera (shaky footage)
- Very bright or patterned clothing
- Hands leaving the video frame
- Other people appearing in the video

#### Recording Timing
- 1-2 seconds pause before the sign
- Perform the sign clearly
- 1-2 seconds pause after the sign
- Total duration: 5 seconds

### File Naming Convention

- Reference videos: `word#contributor.mp4` (e.g., `هدية#Dalia.mp4`)
- Uploaded videos: `word#username.mp4` (e.g., `هدية#Ali.mp4`)

### Troubleshooting

**Camera not working:**
- Check browser permissions for camera access
- Try a different browser (Chrome recommended)
- Ensure no other app is using the camera

**Upload failing:**
- Check internet connection
- Verify backend server is running
- Check Google Drive API credentials

**Video quality issues:**
- Ensure adequate lighting
- Keep camera steady
- Maintain proper distance from camera
