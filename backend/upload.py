"""
Upload Handler for Arabic Sign Language Dataset Collection
Handles video processing and upload to Google Drive
"""

import os
import tempfile
from typing import Optional
from datetime import datetime


class UploadHandler:
    """Handles video upload processing and storage"""
    
    def __init__(self, drive_service, upload_folder_id: str):
        """
        Initialize upload handler
        
        Args:
            drive_service: GoogleDriveService instance
            upload_folder_id: Google Drive folder ID for uploads
        """
        self.drive_service = drive_service
        self.upload_folder_id = upload_folder_id
        self.temp_dir = tempfile.gettempdir()
    
    async def upload(self, content: bytes, filename: str) -> dict:
        """
        Upload video content to Google Drive
        
        Args:
            content: Video file content as bytes
            filename: Target filename (format: word#username.mp4)
        
        Returns:
            dict with upload result including file_id
        """
        print(f"[UploadHandler] Processing upload: {filename} ({len(content)} bytes)")
        
        # Validate filename
        if not self._validate_filename(filename):
            raise ValueError(f"Invalid filename format: {filename}")
        
        # Process the video
        processed_content = await self._process_video(content)
        
        # Ensure filename ends with .mp4
        if not filename.lower().endswith('.mp4'):
            # Replace extension with .mp4
            base_name = os.path.splitext(filename)[0]
            filename = f"{base_name}.mp4"
        
        # Check if Drive service is available
        if not self.drive_service.is_initialized():
            print("[UploadHandler] Drive not initialized, saving locally")
            return await self._save_locally(processed_content, filename)
        
        # Upload to Google Drive
        try:
            file_id = await self.drive_service.upload_file(
                content=processed_content,
                filename=filename,
                folder_id=self.upload_folder_id,
                mime_type="video/mp4"
            )
            
            print(f"[UploadHandler] Upload successful: {file_id}")
            
            return {
                "success": True,
                "file_id": file_id,
                "filename": filename,
                "size": len(processed_content),
                "storage": "google_drive"
            }
            
        except Exception as e:
            print(f"[UploadHandler] Drive upload failed, saving locally: {e}")
            return await self._save_locally(processed_content, filename)
    
    def _validate_filename(self, filename: str) -> bool:
        """
        Validate filename format
        Expected format: word#username.mp4 or word#username.webm
        """
        if not filename:
            return False
        
        # Remove extension for validation
        base_name = os.path.splitext(filename)[0]
        
        # Must contain exactly one #
        parts = base_name.split("#")
        if len(parts) != 2:
            return False
        
        word, username = parts
        
        # Both parts must be non-empty
        if not word or not username:
            return False
        
        return True
    
    async def _process_video(self, content: bytes) -> bytes:
        """
        Process video content (placeholder for future enhancements)
        
        Could include:
        - Format conversion
        - Compression
        - Thumbnail generation
        - Quality validation
        
        For now, returns content as-is
        """
        # TODO: Add video processing (ffmpeg conversion to mp4 if needed)
        return content
    
    async def _save_locally(self, content: bytes, filename: str) -> dict:
        """
        Save video locally when Drive is not available
        
        Args:
            content: Video content bytes
            filename: Target filename
        
        Returns:
            dict with save result
        """
        # Create uploads directory
        uploads_dir = os.path.join(self.temp_dir, "arsl_uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(filename)[0]
        unique_filename = f"{base_name}_{timestamp}.mp4"
        
        file_path = os.path.join(uploads_dir, unique_filename)
        
        # Write file
        with open(file_path, "wb") as f:
            f.write(content)
        
        print(f"[UploadHandler] Saved locally: {file_path}")
        
        return {
            "success": True,
            "file_id": f"local_{timestamp}",
            "filename": unique_filename,
            "path": file_path,
            "size": len(content),
            "storage": "local"
        }
    
    def get_upload_stats(self) -> dict:
        """Get statistics about local uploads"""
        uploads_dir = os.path.join(self.temp_dir, "arsl_uploads")
        
        if not os.path.exists(uploads_dir):
            return {"local_files": 0, "total_size": 0}
        
        files = os.listdir(uploads_dir)
        total_size = sum(
            os.path.getsize(os.path.join(uploads_dir, f))
            for f in files
            if os.path.isfile(os.path.join(uploads_dir, f))
        )
        
        return {
            "local_files": len(files),
            "total_size": total_size,
            "directory": uploads_dir
        }
