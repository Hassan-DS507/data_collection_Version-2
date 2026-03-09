"""
Arabic Sign Language Dataset Collection Platform - Backend API
FastAPI server for handling video uploads and Google Drive integration
"""

import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from upload import UploadHandler
from drive_service import GoogleDriveService

# Load environment variables
load_dotenv()

# Configuration
UPLOAD_FOLDER_ID = os.getenv("UPLOAD_FOLDER_ID", "1P0dHu0ukQG-2qtNjh-_lWeCVuA1BC5jo")
REFERENCE_FOLDER_ID = os.getenv("REFERENCE_FOLDER_ID", "11shPc0TSFYMsS_qN3CUO51If2oK9FcTH")

# Initialize services
drive_service = GoogleDriveService()
upload_handler = UploadHandler(drive_service, UPLOAD_FOLDER_ID)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("[ArSL API] Starting up...")
    if drive_service.is_initialized():
        print("[ArSL API] Google Drive service initialized")
    else:
        print("[ArSL API] Google Drive service not configured (running in demo mode)")
    yield
    # Shutdown
    print("[ArSL API] Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Arabic Sign Language Dataset Collection API",
    description="API for collecting and managing Arabic Sign Language video recordings",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Arabic Sign Language Dataset Collection API",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "drive_connected": drive_service.is_initialized(),
        "upload_folder_id": UPLOAD_FOLDER_ID,
        "reference_folder_id": REFERENCE_FOLDER_ID
    }


@app.get("/api/reference-videos")
async def get_reference_videos():
    """Get list of reference videos from Google Drive"""
    try:
        if not drive_service.is_initialized():
            # Return demo data when Drive is not configured
            return {
                "videos": [
                    {"word": "هدية", "filename": "هدية#Dalia.mp4", "fileId": "demo1"},
                    {"word": "نظر", "filename": "نظر#Dalia.mp4", "fileId": "demo2"},
                    {"word": "روح", "filename": "روح#Dalia.mp4", "fileId": "demo3"},
                    {"word": "شكراً", "filename": "شكراً#Dalia.mp4", "fileId": "demo4"},
                    {"word": "مرحبا", "filename": "مرحبا#Dalia.mp4", "fileId": "demo5"},
                ],
                "source": "demo"
            }
        
        # Get files from Google Drive
        files = await drive_service.list_files(REFERENCE_FOLDER_ID)
        
        videos = []
        for file in files:
            filename = file.get("name", "")
            if "#" in filename and filename.endswith(".mp4"):
                word = filename.split("#")[0]
                videos.append({
                    "word": word,
                    "filename": filename,
                    "fileId": file.get("id")
                })
        
        return {"videos": videos, "source": "google_drive"}
        
    except Exception as e:
        print(f"[ArSL API] Error fetching reference videos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch reference videos")


@app.post("/api/upload")
async def upload_video(
    video: UploadFile = File(...),
    filename: str = Form(...)
):
    """
    Upload a recorded sign language video
    
    - video: The recorded video file
    - filename: Expected format: word#username.mp4
    """
    try:
        # Validate filename format
        if "#" not in filename or not filename.endswith(".mp4"):
            raise HTTPException(
                status_code=400,
                detail="Invalid filename format. Expected: word#username.mp4"
            )
        
        # Validate file type
        content_type = video.content_type or ""
        if not content_type.startswith("video/"):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only video files are accepted."
            )
        
        # Read file content
        content = await video.read()
        
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty video file"
            )
        
        # Upload to Google Drive
        result = await upload_handler.upload(content, filename)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Video uploaded successfully",
                "filename": filename,
                "file_id": result.get("file_id"),
                "size": len(content)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ArSL API] Upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload video")


@app.get("/api/stats")
async def get_stats():
    """Get dataset statistics"""
    try:
        if not drive_service.is_initialized():
            return {
                "total_videos": 0,
                "unique_words": 0,
                "unique_contributors": 0,
                "source": "demo"
            }
        
        # Get files from upload folder
        files = await drive_service.list_files(UPLOAD_FOLDER_ID)
        
        words = set()
        contributors = set()
        
        for file in files:
            filename = file.get("name", "")
            if "#" in filename:
                parts = filename.replace(".mp4", "").split("#")
                if len(parts) >= 2:
                    words.add(parts[0])
                    contributors.add(parts[1])
        
        return {
            "total_videos": len(files),
            "unique_words": len(words),
            "unique_contributors": len(contributors),
            "source": "google_drive"
        }
        
    except Exception as e:
        print(f"[ArSL API] Stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")


# Mount static files for frontend (optional, for single-server deployment)
# Uncomment if serving frontend from this server
# app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    print(f"[ArSL API] Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, reload=True)
