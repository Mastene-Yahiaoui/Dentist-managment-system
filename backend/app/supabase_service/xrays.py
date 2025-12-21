# X-ray/Image CRUD operations for Supabase.
# Handles both Storage (for files) and Database (for metadata).

import logging
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
from .base import BaseSupabaseService, SupabaseServiceError

logger = logging.getLogger(__name__)

# Storage bucket name for X-ray images
XRAY_BUCKET = 'x_rays'


class XrayService(BaseSupabaseService):
    table_name = 'xrays'
    
    def _get_storage_path(self, patient_id: str, filename: str) -> str:
        """Generate a unique storage path for the image."""
        # Structure: patient_id/uuid_filename
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = filename.replace(' ', '_')
        return f"{patient_id}/{unique_id}_{safe_filename}"
    
    def upload_image(
        self, 
        patient_id: str, 
        file_data: bytes, 
        filename: str, 
        content_type: str, 
        description: str = '', 
        date_taken: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload an image to Supabase Storage and save metadata to the database.
        
        Args:
            patient_id: The patient's ID
            file_data: The binary file content
            filename: Original filename
            content_type: MIME type (e.g., 'image/png')
            description: Optional description of the image
            date_taken: Optional date when the image was taken (ISO format)
            
        Returns:
            The created xray record with signed URL
        """
        storage_path = ""
        try:
            # Generate storage path
            storage_path = self._get_storage_path(patient_id, filename)
            
            # Upload to Supabase Storage
            logger.info(f"Uploading image to storage bucket '{XRAY_BUCKET}': {storage_path}")
            try:
                self.client.storage.from_(XRAY_BUCKET).upload(
                    path=storage_path,
                    file=file_data,
                    file_options={"content-type": content_type}
                )
            except Exception as storage_error:
                error_msg = str(storage_error)
                logger.error(f"Storage upload error: {error_msg}")
                if 'Bucket not found' in error_msg or 'bucket' in error_msg.lower():
                    raise SupabaseServiceError(
                        f"Storage bucket '{XRAY_BUCKET}' not found. Please create it in Supabase Dashboard."
                    )
                raise SupabaseServiceError(f"Storage upload failed: {error_msg}")
            
            logger.info(f"Image uploaded successfully to: {storage_path}")
            
            # Prepare metadata record - match Supabase xrays table schema
            record_data: Dict[str, Any] = {
                'id': str(uuid.uuid4()),
                'patient_id': patient_id,
                'image_url': storage_path,
                'image_name': filename,
                'image_type': content_type,
                'description': description if description else None,
                'date_taken': date_taken if date_taken else datetime.utcnow().date().isoformat(),
            }
            
            # Save metadata to database
            logger.info(f"Saving metadata to database: {record_data}")
            try:
                response = self.client.table(self.table_name).insert(record_data).execute()
            except Exception as db_error:
                # Rollback: delete uploaded file if DB insert fails
                logger.error(f"Database insert error: {db_error}")
                self._delete_from_storage(storage_path)
                raise SupabaseServiceError(f"Database error: {str(db_error)}")
            
            if not response.data or len(response.data) == 0:
                # Rollback: delete uploaded file if DB insert fails
                logger.error(f"Database insert returned no data. Response: {response}")
                self._delete_from_storage(storage_path)
                raise SupabaseServiceError("Failed to save image metadata to database")
            
            result: Dict[str, Any] = dict(response.data[0])  # type: ignore
            
            # Generate signed URL for immediate display
            result['signed_url'] = self._get_signed_url(storage_path)
            
            logger.info(f"Created xray record: {result.get('id')}")
            return result
            
        except SupabaseServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to upload image: {e}", exc_info=True)
            if storage_path:
                self._delete_from_storage(storage_path)
            raise SupabaseServiceError(f"Failed to upload image: {str(e)}")
    
    def _delete_from_storage(self, storage_path: str) -> None:
        """Helper to delete a file from storage."""
        try:
            self.client.storage.from_(XRAY_BUCKET).remove([storage_path])
        except Exception as e:
            logger.warning(f"Could not delete from storage: {e}")
    
    def _get_signed_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """Generate a signed URL for secure image access."""
        try:
            response = self.client.storage.from_(XRAY_BUCKET).create_signed_url(
                path=storage_path,
                expires_in=expires_in
            )
            logger.info(f"Signed URL response for {storage_path}: {response} (type: {type(response)})")
            
            # Handle different response formats from supabase-py
            if response:
                # If response is a string URL directly
                if isinstance(response, str) and response.startswith('http'):
                    return response
                # If response is a dict with signedURL or signedUrl
                if isinstance(response, dict):
                    if 'signedURL' in response:
                        return str(response['signedURL'])
                    elif 'signedUrl' in response:
                        return str(response['signedUrl'])
                    elif 'signed_url' in response:
                        return str(response['signed_url'])
                # If response has a signedUrl attribute (object)
                if hasattr(response, 'signed_url'):
                    return str(response.signed_url) # type: ignore
                if hasattr(response, 'signedUrl'):
                    return str(response.signedUrl) # type: ignore
                if hasattr(response, 'signedURL'):
                    return str(response.signedURL) # type: ignore
            
            # Fallback to public URL if signed URL fails
            logger.warning(f"Could not extract signed URL for {storage_path}, using public URL")
            return self._get_public_url(storage_path)
        except Exception as e:
            logger.error(f"Error generating signed URL: {e}")
            # Fallback to public URL
            return self._get_public_url(storage_path)
    
    def _get_public_url(self, storage_path: str) -> str:
        """Generate a public URL for the image (for public buckets)."""
        try:
            response = self.client.storage.from_(XRAY_BUCKET).get_public_url(storage_path)
            logger.info(f"Public URL response for {storage_path}: {response} (type: {type(response)})")
            
            if response:
                # If it's already a string URL
                if isinstance(response, str) and response.startswith('http'):
                    return response
                # If it's a dict
                if isinstance(response, dict) and 'publicUrl' in response:
                    return str(response['publicUrl']) # type: ignore
                if isinstance(response, dict) and 'publicURL' in response:
                    return str(response['publicURL']) # type: ignore
                # If it has an attribute
                if hasattr(response, 'public_url'):
                    return str(response.public_url) # type: ignore
                # Last resort - convert to string
                url_str = str(response)
                if url_str.startswith('http'):
                    return url_str
            return ''
        except Exception as e:
            logger.error(f"Error generating public URL: {e}")
            return ''
    
    def get_patient_images(self, patient_id: str) -> List[Dict[str, Any]]:
        """
        Get all images for a patient with signed URLs.
        
        Args:
            patient_id: The patient's ID
            
        Returns:
            List of xray records with signed URLs
        """
        try:
            response = self.client.table(self.table_name)\
                .select("*")\
                .eq('patient_id', patient_id)\
                .order('date_taken', desc=True)\
                .execute()
            
            raw_results = response.data or []
            results: List[Dict[str, Any]] = []
            
            # Add signed URLs to each result
            for item in raw_results:
                if isinstance(item, dict):
                    record: Dict[str, Any] = dict(item)
                    image_url = record.get('image_url')
                    if image_url and isinstance(image_url, str):
                        record['signed_url'] = self._get_signed_url(image_url)
                    results.append(record)
            
            logger.debug(f"Retrieved {len(results)} images for patient {patient_id}")
            return results
            
        except Exception as e:
            logger.error(f"Failed to get patient images: {e}", exc_info=True)
            raise SupabaseServiceError(f"Failed to retrieve images: {str(e)}")
    
    def get_image(self, image_id: str) -> Optional[Dict[str, Any]]:
        """Get a single image by ID with signed URL."""
        try:
            response = self.client.table(self.table_name)\
                .select("*")\
                .eq('id', image_id)\
                .execute()
            
            if response.data and len(response.data) > 0:
                item = response.data[0]
                if isinstance(item, dict):
                    record: Dict[str, Any] = dict(item)
                    image_url = record.get('image_url')
                    if image_url and isinstance(image_url, str):
                        record['signed_url'] = self._get_signed_url(image_url)
                    return record
            return None
            
        except Exception as e:
            logger.error(f"Failed to get image {image_id}: {e}")
            raise SupabaseServiceError(f"Failed to retrieve image: {str(e)}")
    
    def delete_image(self, image_id: str) -> bool:
        """
        Delete an image from both Storage and Database.
        
        Args:
            image_id: The xray record ID
            
        Returns:
            True if deletion was successful
        """
        try:
            # First, get the record to find the storage path
            record = self.get_image(image_id)
            if not record:
                logger.warning(f"Image {image_id} not found for deletion")
                return False
            
            storage_path = record.get('image_url')
            
            # Delete from Storage first
            if storage_path and isinstance(storage_path, str):
                self._delete_from_storage(storage_path)
                logger.info(f"Deleted image from storage: {storage_path}")
            
            # Delete from Database
            response = self.client.table(self.table_name)\
                .delete()\
                .eq('id', image_id)\
                .execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"Deleted xray record: {image_id}")
                return True
            
            return False
            
        except SupabaseServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to delete image {image_id}: {e}", exc_info=True)
            raise SupabaseServiceError(f"Failed to delete image: {str(e)}")
    
    def update_image_metadata(
        self, 
        image_id: str, 
        data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update image metadata (description, date_taken)."""
        try:
            update_data: Dict[str, Any] = {
                k: v for k, v in data.items() 
                if k in ['description', 'date_taken']
            }
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            response = self.client.table(self.table_name)\
                .update(update_data)\
                .eq('id', image_id)\
                .execute()
            
            if response.data and len(response.data) > 0:
                item = response.data[0]
                if isinstance(item, dict):
                    record: Dict[str, Any] = dict(item)
                    image_url = record.get('image_url')
                    if image_url and isinstance(image_url, str):
                        record['signed_url'] = self._get_signed_url(image_url)
                    return record
            return None
            
        except Exception as e:
            logger.error(f"Failed to update image {image_id}: {e}")
            raise SupabaseServiceError(f"Failed to update image: {str(e)}")
