
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..serializers import PatientSerializer
from ..supabase_service import patient_service
from ..views_utils import SupabaseEnabledViewSetMixin, handle_supabase_exception


class PatientViewSet(SupabaseEnabledViewSetMixin, viewsets.ViewSet):
    permission_classes = [AllowAny]
    serializer_class = PatientSerializer
    basename = 'patient'
    
    def list(self, request, *args, **kwargs):
        try:
            # Support limit query parameter for pagination (default 100, max 500)
            limit = int(request.query_params.get('limit', 100))
            limit = min(max(limit, 1), 500) 
            
            patients = patient_service.get_all_patients(limit=limit)
            serializer = PatientSerializer(patients, many=True)
            # Return consistent format with results and count for frontend compatibility
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            })
        except Exception as e:
            return handle_supabase_exception(e)
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = PatientSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            patient_id = patient_service.create_patient(serializer.validated_data)
            patient = patient_service.get_patient(patient_id)
            return Response(patient, status=status.HTTP_201_CREATED)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def retrieve(self, request, pk=None, *args, **kwargs):
        try:
            patient = patient_service.get_patient(pk)
            if not patient:
                return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
            serializer = PatientSerializer(patient)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def update(self, request, pk=None, *args, **kwargs):
        try:
            serializer = PatientSerializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            success = patient_service.update_patient(pk, serializer.validated_data)
            if not success:
                return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
            
            patient = patient_service.get_patient(pk)
            return Response(patient)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def partial_update(self, request, pk=None, *args, **kwargs):
        return self.update(request, pk=pk, *args, **kwargs)
    
    def destroy(self, request, pk=None, *args, **kwargs):
        try:
            success = patient_service.delete_patient(pk)
            if not success:
                return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_supabase_exception(e)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        try:
            search_term = request.query_params.get('q', '')
            if not search_term:
                return Response({'error': 'Search term required'}, status=status.HTTP_400_BAD_REQUEST)
            
            patients = patient_service.search_patients(search_term)
            serializer = PatientSerializer(patients, many=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
