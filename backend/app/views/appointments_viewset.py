
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
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            limit = int(request.query_params.get('limit', 100))
            limit = min(max(limit, 1), 500)
            
            # Get all appointments and filter by user_id
            all_appointments = appointment_service.get_all_appointments(limit=limit)
            appointments = [a for a in all_appointments if a.get('user_id') == user_id]
            
            serializer = AppointmentSerializer(appointments, many=True)
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
            
            serializer = AppointmentSerializer(data=data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            appointment_id = appointment_service.create_appointment(serializer.validated_data)
            appointment = appointment_service.get_appointment(appointment_id)
            return Response(appointment, status=status.HTTP_201_CREATED)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def retrieve(self, request, pk=None, *args, **kwargs):
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            appointment = appointment_service.get_appointment(pk)
            if not appointment:
                return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if appointment belongs to current user
            if appointment.get('user_id') != user_id:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def update(self, request, pk=None, *args, **kwargs):
        try:
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Get existing appointment for validation context and ownership check
            existing_appointment = appointment_service.get_appointment(pk)
            if not existing_appointment:
                return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if appointment belongs to current user
            if existing_appointment.get('user_id') != user_id:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = AppointmentSerializer(instance=existing_appointment, data=request.data, partial=True)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Prevent user_id modification
            validated_data = serializer.validated_data.copy() if isinstance(serializer.validated_data, dict) else dict(serializer.validated_data)
            validated_data.pop('user_id', None)
            
            success = appointment_service.update_appointment(pk, validated_data)
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
            # Get current user from token
            user_id = request.user.id if hasattr(request.user, 'id') else None
            
            if not user_id:
                return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if appointment exists and belongs to user
            appointment = appointment_service.get_appointment(pk)
            if not appointment:
                return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            if appointment.get('user_id') != user_id:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
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
