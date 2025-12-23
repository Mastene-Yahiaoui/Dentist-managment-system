
#Provides CRUD operations for appointments

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..serializers import AppointmentSerializer
from ..supabase_service import appointment_service
from ..views_utils import SupabaseEnabledViewSetMixin, handle_supabase_exception
from rest_framework.permissions import AllowAny

class AppointmentViewSet(SupabaseEnabledViewSetMixin, viewsets.ViewSet):
    permission_classes = [AllowAny]
    serializer_class = AppointmentSerializer
    basename = 'appointment'
    
    def list(self, request, *args, **kwargs):
        try:
            limit = int(request.query_params.get('limit', 100))
            limit = min(max(limit, 1), 500)
            
            appointments = appointment_service.get_all_appointments(limit=limit)
            serializer = AppointmentSerializer(appointments, many=True)
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            })
        except Exception as e:
            return handle_supabase_exception(e)
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = AppointmentSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            appointment_id = appointment_service.create_appointment(serializer.validated_data)
            appointment = appointment_service.get_appointment(appointment_id)
            return Response(appointment, status=status.HTTP_201_CREATED)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def retrieve(self, request, pk=None, *args, **kwargs):
        try:
            appointment = appointment_service.get_appointment(pk)
            if not appointment:
                return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def update(self, request, pk=None, *args, **kwargs):
        try:
            # Get existing appointment for validation context
            existing_appointment = appointment_service.get_appointment(pk)
            if not existing_appointment:
                return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            serializer = AppointmentSerializer(instance=existing_appointment, data=request.data, partial=True)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            success = appointment_service.update_appointment(pk, serializer.validated_data)
            if not success:
                return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            appointment = appointment_service.get_appointment(pk)
            return Response(appointment)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def partial_update(self, request, pk=None, *args, **kwargs):
        return self.update(request, pk=pk, *args, **kwargs)
    
    def destroy(self, request, pk=None, *args, **kwargs):
        try:
            success = appointment_service.delete_appointment(pk)
            if not success:
                return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_supabase_exception(e)
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        try:
            status_filter = request.query_params.get('status')
            if not status_filter:
                return Response({'error': 'Status parameter required'}, status=status.HTTP_400_BAD_REQUEST)
            
            appointments = appointment_service.get_appointments_by_status(status_filter)
            serializer = AppointmentSerializer(appointments, many=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
    
    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        try:
            patient_id = request.query_params.get('patient_id')
            if not patient_id:
                return Response({'error': 'Patient ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            appointments = appointment_service.get_patient_appointments(patient_id)
            serializer = AppointmentSerializer(appointments, many=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
