"""
Google Drive Service for Arabic Sign Language Dataset Collection
Handles authentication and file operations with Google Drive API
"""

import os
import io
from typing import Optional, List, Dict, Any

# Google API imports (installed via pip)
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseUpload
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False
    print("[DriveService] Google API libraries not installed. Running in demo mode.")


class GoogleDriveService:
    """
    Google Drive service for file operations
    
    Handles:
    - Authentication via service account
    - File listing from folders
    - File upload with proper naming
    - File download/streaming
    """
    
    # Required scopes for Drive operations
    SCOPES = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly'
    ]
    
    def __init__(self):
        """Initialize Google Drive service"""
        self.service = None
        self._initialized = False
        
        if GOOGLE_API_AVAILABLE:
            self._initialize_service()
    
    def _initialize_service(self):
        """Initialize the Drive API service with service account credentials"""
        try:
            # Get credentials from environment variables
            service_account_email = os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL")
            private_key = os.getenv("GOOGLE_PRIVATE_KEY")
            project_id = os.getenv("GOOGLE_PROJECT_ID")
            
            # Check if using JSON key file path
            key_file_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            
            if key_file_path and os.path.exists(key_file_path):
                # Use key file
                credentials = service_account.Credentials.from_service_account_file(
                    key_file_path,
                    scopes=self.SCOPES
                )
                print("[DriveService] Initialized with service account key file")
                
            elif service_account_email and private_key and project_id:
                # Use environment variables
                # Fix newlines in private key (often escaped in env vars)
                if "\\n" in private_key:
                    private_key = private_key.replace("\\n", "\n")
                
                service_account_info = {
                    "type": "service_account",
                    "project_id": project_id,
                    "private_key": private_key,
                    "client_email": service_account_email,
                    "token_uri": "https://oauth2.googleapis.com/token"
                }
                
                credentials = service_account.Credentials.from_service_account_info(
                    service_account_info,
                    scopes=self.SCOPES
                )
                print("[DriveService] Initialized with environment credentials")
                
            else:
                print("[DriveService] No credentials found, running in demo mode")
                return
            
            # Build the Drive service
            self.service = build('drive', 'v3', credentials=credentials)
            self._initialized = True
            print("[DriveService] Google Drive API initialized successfully")
            
        except Exception as e:
            print(f"[DriveService] Initialization error: {e}")
            self._initialized = False
    
    def is_initialized(self) -> bool:
        """Check if the service is properly initialized"""
        return self._initialized and self.service is not None
    
    async def list_files(
        self,
        folder_id: str,
        file_type: Optional[str] = None,
        page_size: int = 100
    ) -> List[Dict[str, Any]]:
        """
        List files in a Google Drive folder
        
        Args:
            folder_id: Google Drive folder ID
            file_type: Optional MIME type filter (e.g., "video/mp4")
            page_size: Maximum number of files to return
        
        Returns:
            List of file metadata dictionaries
        """
        if not self.is_initialized():
            return []
        
        try:
            # Build query
            query = f"'{folder_id}' in parents and trashed = false"
            if file_type:
                query += f" and mimeType = '{file_type}'"
            
            # Execute query
            results = self.service.files().list(
                q=query,
                pageSize=page_size,
                fields="files(id, name, mimeType, size, createdTime, modifiedTime)"
            ).execute()
            
            files = results.get('files', [])
            print(f"[DriveService] Found {len(files)} files in folder {folder_id}")
            
            return files
            
        except Exception as e:
            print(f"[DriveService] List files error: {e}")
            return []
    
    async def upload_file(
        self,
        content: bytes,
        filename: str,
        folder_id: str,
        mime_type: str = "video/mp4"
    ) -> str:
        """
        Upload a file to Google Drive
        
        Args:
            content: File content as bytes
            filename: Target filename
            folder_id: Target folder ID
            mime_type: File MIME type
        
        Returns:
            Uploaded file ID
        """
        if not self.is_initialized():
            raise Exception("Google Drive service not initialized")
        
        try:
            # Prepare file metadata
            file_metadata = {
                'name': filename,
                'parents': [folder_id]
            }
            
            # Create media object
            media = MediaIoBaseUpload(
                io.BytesIO(content),
                mimetype=mime_type,
                resumable=True
            )
            
            # Upload file
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink'
            ).execute()
            
            file_id = file.get('id')
            print(f"[DriveService] Uploaded file: {filename} (ID: {file_id})")
            
            return file_id
            
        except Exception as e:
            print(f"[DriveService] Upload error: {e}")
            raise
    
    async def get_file_metadata(self, file_id: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a specific file
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            File metadata dictionary or None
        """
        if not self.is_initialized():
            return None
        
        try:
            file = self.service.files().get(
                fileId=file_id,
                fields='id, name, mimeType, size, webViewLink, webContentLink'
            ).execute()
            
            return file
            
        except Exception as e:
            print(f"[DriveService] Get file error: {e}")
            return None
    
    async def delete_file(self, file_id: str) -> bool:
        """
        Delete a file from Google Drive
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            True if successful
        """
        if not self.is_initialized():
            return False
        
        try:
            self.service.files().delete(fileId=file_id).execute()
            print(f"[DriveService] Deleted file: {file_id}")
            return True
            
        except Exception as e:
            print(f"[DriveService] Delete error: {e}")
            return False
    
    def get_embed_url(self, file_id: str) -> str:
        """
        Get the embed URL for a file (for video preview)
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            Embed URL string
        """
        return f"https://drive.google.com/file/d/{file_id}/preview"
    
    def get_download_url(self, file_id: str) -> str:
        """
        Get the direct download URL for a file
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            Download URL string
        """
        return f"https://drive.google.com/uc?export=download&id={file_id}"
