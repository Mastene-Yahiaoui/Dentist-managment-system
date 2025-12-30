"""ViewSet for managing patient X-ray/scan images."""

from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from ..serializers import XraySerializer
from ..supabase_service import xray_service
from ..views_utils import SupabaseEnabledViewSetMixin, handle_supabase_exception


class XraysViewSet(SupabaseEnabledViewSetMixin, viewsets.ViewSet):
    """ViewSet for X-ray image CRUD operations with file upload support."""
    permission_classes = [AllowAny]
    serializer_class = XraySerializer
    basename = 'xray'
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def list(self, request, *args, **kwargs):
        """
        List all X-ray images, optionally filtered by patient_id.
        
        Query Parameters:
            patient_id: Filter images by patient ID (optional but recommended)
            limit: Maximum number of results (default 100, max 500)
        """
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            patient_id = request.query_params.get('patient_id')
            limit = int(request.query_params.get('limit', 100))
            limit = min(max(limit, 1), 500)
            
            if patient_id:
                xrays = xray_service.get_patient_images(patient_id)
            else:
                # Get all images (use base service method)
                xrays = xray_service.get_all()
            
            # Filter by user_id and apply limit
            xrays = [x for x in (xrays or []) if x.get('user_id') == user_id]
            xrays = xrays[:limit] if xrays else []
            
            serializer = XraySerializer(xrays, many=True)
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            })
        except Exception as e:
            return handle_supabase_exception(e)
    
    def create(self, request, *args, **kwargs):
        """
        Upload a new X-ray image.
        
        Expected multipart/form-data:
            - file: The image file (required)
            - patient_id: Patient ID (required)
            - description: Image description (optional)
            - date_taken: Date the image was taken (optional, format: YYYY-MM-DD)
        """
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Validate required fields
            patient_id = request.data.get('patient_id')
            if not patient_id:
                return Response(
                    {'error': 'patient_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the uploaded file
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                return Response(
                    {'error': 'No file provided. Please upload an image file.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file type
            allowed_types = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'image/bmp', 'image/tiff', 'application/dicom'
            ]
            content_type = uploaded_file.content_type
            if content_type not in allowed_types:
                return Response(
                    {'error': f'Invalid file type: {content_type}. Allowed types: JPEG, PNG, GIF, WEBP, BMP, TIFF, DICOM'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file size (max 10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            if uploaded_file.size > max_size:
                return Response(
                    {'error': 'File size exceeds maximum allowed size of 10MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Read file content
            file_data = uploaded_file.read()
            filename = uploaded_file.name
            
            # Get optional fields
            description = request.data.get('description', '')
            date_taken = request.data.get('date_taken')
            
            # Upload to Supabase Storage and save metadata with user_id
            xray = xray_service.upload_image(
                patient_id=patient_id,
                user_id=user_id,
                file_data=file_data,
                filename=filename,
                content_type=content_type,
                description=description,
                date_taken=date_taken
            )
            
            serializer = XraySerializer(xray)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return handle_supabase_exception(e)
    
    def retrieve(self, request, pk=None, *args, **kwargs):
        """Get a specific X-ray image by ID."""
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            xray = xray_service.get_image(pk)
            if not xray:
                return Response(
                    {'error': 'X-ray image not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if xray belongs to current user
            if xray.get('user_id') != user_id:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = XraySerializer(xray)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def update(self, request, pk=None, *args, **kwargs):
        """
        Update X-ray metadata (not the image file itself).
        
        Updatable fields:
            - description
            - date_taken
        """
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if xray exists and belongs to user
            xray = xray_service.get_image(pk)
            if not xray:
                return Response(
                    {'error': 'X-ray image not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if xray.get('user_id') != user_id:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            # Only allow updating metadata, not the image itself
            update_data = {}
            
            if 'description' in request.data:
                update_data['description'] = request.data['description']
            
            if 'date_taken' in request.data:
                update_data['date_taken'] = request.data['date_taken']
            
            if not update_data:
                return Response(
                    {'error': 'No valid fields to update'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            success = xray_service.update(pk, update_data)
            if not success:
                return Response(
                    {'error': 'X-ray image not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            xray = xray_service.get_image(pk)
            serializer = XraySerializer(xray)
            return Response(serializer.data)
            
        except Exception as e:
            return handle_supabase_exception(e)
    
    def partial_update(self, request, pk=None, *args, **kwargs):
        """Partial update for X-ray metadata."""
        return self.update(request, pk=pk, *args, **kwargs)
    
    def destroy(self, request, pk=None, *args, **kwargs):
        """Delete an X-ray image (from both Storage and database)."""
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if xray exists and belongs to user
            xray = xray_service.get_image(pk)
            if not xray:
                return Response(
                    {'error': 'X-ray image not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if xray.get('user_id') != user_id:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            success = xray_service.delete_image(pk)
            if not success:
                return Response(
                    {'error': 'X-ray image not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_supabase_exception(e)
