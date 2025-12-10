import logging
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .views import (
    PatientViewSet,
    AppointmentViewSet,
    TreatmentViewSet,
    InvoiceViewSet,
    InventoryViewSet,
)

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint to verify the API is running.
    
    Returns status information about the backend service.
    No authentication required.
    
    Query Parameters:
        - deep: If 'true', includes Supabase connection status (slower)
    """
    response_data = {
        'status': 'healthy',
        'service': 'app-backend',
        'database': 'supabase-postgresql',
        'version': '1.0.0',
    }
    
    # Deep health check includes Supabase connection test
    if request.query_params.get('deep', '').lower() == 'true':
        try:
            from app_backend.supabase_utils import (
                check_supabase_connection,
                is_supabase_configured,
                is_supabase_available,
            )
            
            response_data['supabase'] = {
                'sdk_available': is_supabase_available(),
                'credentials_configured': is_supabase_configured(),
            }
            
            if is_supabase_available() and is_supabase_configured():
                try:
                    conn_status = check_supabase_connection()
                    response_data['supabase'].update({
                        'connection_status': conn_status['status'],
                        'url': conn_status['url'],
                        'response_time_ms': conn_status['response_time_ms'],
                    })
                except Exception as e:
                    logger.warning(f"Supabase connection check failed: {e}")
                    response_data['supabase'].update({
                        'connection_status': 'error',
                        'error': str(e),
                    })
                    response_data['status'] = 'degraded'
        except ImportError:
            response_data['supabase'] = {
                'sdk_available': False,
                'error': 'supabase package not installed',
            }
            response_data['status'] = 'degraded'
    
    return Response(response_data)


router = DefaultRouter()
# Register viewsets with explicit basenames since we're using ViewSet (not ModelViewSet)
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'treatments', TreatmentViewSet, basename='treatment')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'inventory', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('', include(router.urls)),
]
