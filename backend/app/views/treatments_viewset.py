
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
            # Support limit query parameter for pagination (default 100, max 500)
            limit = int(request.query_params.get('limit', 100))
            limit = min(max(limit, 1), 500)  
            
            treatments = treatment_service.get_all_treatments(limit=limit)
            serializer = TreatmentSerializer(treatments, many=True)
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            })
        except Exception as e:
            return handle_supabase_exception(e)
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = TreatmentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            treatment_id = treatment_service.create_treatment(serializer.validated_data)
            treatment = treatment_service.get_treatment(treatment_id)
            return Response(treatment, status=status.HTTP_201_CREATED)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def retrieve(self, request, pk=None, *args, **kwargs):
        try:
            treatment = treatment_service.get_treatment(pk)
            if not treatment:
                return Response({'error': 'Treatment not found'}, status=status.HTTP_404_NOT_FOUND)
            serializer = TreatmentSerializer(treatment)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def update(self, request, pk=None, *args, **kwargs):
        try:
            serializer = TreatmentSerializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            success = treatment_service.update_treatment(pk, serializer.validated_data)
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
