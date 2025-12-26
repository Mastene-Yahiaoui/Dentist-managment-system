
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..serializers import TreatmentSerializer
from ..supabase_service import treatment_service
from ..views_utils import SupabaseEnabledViewSetMixin, handle_supabase_exception
from rest_framework.permissions import AllowAny

class TreatmentViewSet(SupabaseEnabledViewSetMixin, viewsets.ViewSet):
    
    permission_classes = [AllowAny]
    serializer_class = TreatmentSerializer
    basename = 'treatment'
    
    def list(self, request, *args, **kwargs):
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Support limit query parameter for pagination (default 100, max 500)
            limit = int(request.query_params.get('limit', 100))
            limit = min(max(limit, 1), 500)  
            
            # Get all treatments and filter by user_id
            all_treatments = treatment_service.get_all_treatments(limit=limit)
            treatments = [t for t in all_treatments if t.get('user_id') == user_id]
            
            serializer = TreatmentSerializer(treatments, many=True)
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            })
        except Exception as e:
            return handle_supabase_exception(e)
    
    def create(self, request, *args, **kwargs):
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Add user_id to the request data
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            data['user_id'] = user_id
            
            serializer = TreatmentSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            
            treatment_id = treatment_service.create_treatment(serializer.validated_data)
            treatment = treatment_service.get_treatment(treatment_id)
            return Response(treatment, status=status.HTTP_201_CREATED)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def retrieve(self, request, pk=None, *args, **kwargs):
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            treatment = treatment_service.get_treatment(pk)
            if not treatment:
                return Response({'error': 'Treatment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if treatment belongs to user
            if treatment.get('user_id') != user_id:
                return Response({'error': 'Not authorized to access this treatment'}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = TreatmentSerializer(treatment)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def update(self, request, pk=None, *args, **kwargs):
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if treatment exists and belongs to user
            treatment = treatment_service.get_treatment(pk)
            if not treatment:
                return Response({'error': 'Treatment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            if treatment.get('user_id') != user_id:
                return Response({'error': 'Not authorized to access this treatment'}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = TreatmentSerializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # Prevent user_id modification
            validated_data = serializer.validated_data.copy() if isinstance(serializer.validated_data, dict) else dict(serializer.validated_data)
            validated_data.pop('user_id', None)
            
            success = treatment_service.update_treatment(pk, validated_data)
            if not success:
                return Response({'error': 'Treatment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            treatment = treatment_service.get_treatment(pk)
            return Response(treatment)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def partial_update(self, request, pk=None, *args, **kwargs):
        return self.update(request, pk=pk, *args, **kwargs)
    
    def destroy(self, request, pk=None, *args, **kwargs):
        """Delete a treatment."""
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if treatment exists and belongs to user
            treatment = treatment_service.get_treatment(pk)
            if not treatment:
                return Response({'error': 'Treatment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            if treatment.get('user_id') != user_id:
                return Response({'error': 'Not authorized to access this treatment'}, status=status.HTTP_403_FORBIDDEN)
            
            success = treatment_service.delete_treatment(pk)
            if not success:
                return Response({'error': 'Treatment not found'}, status=status.HTTP_404_NOT_FOUND)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_supabase_exception(e)
    
    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        try:
            patient_id = request.query_params.get('patient_id')
            if not patient_id:
                return Response({'error': 'Patient ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            treatments = treatment_service.get_patient_treatments(patient_id)
            serializer = TreatmentSerializer(treatments, many=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
