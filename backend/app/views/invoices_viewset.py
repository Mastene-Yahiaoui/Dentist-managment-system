
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..serializers import InvoiceSerializer
from ..supabase_service import invoice_service
from ..views_utils import SupabaseEnabledViewSetMixin, handle_supabase_exception
from rest_framework.permissions import AllowAny

class InvoiceViewSet(SupabaseEnabledViewSetMixin, viewsets.ViewSet):
    
    permission_classes = [AllowAny]
    serializer_class = InvoiceSerializer
    basename = 'invoice'
    
    def list(self, request, *args, **kwargs):
        #List all invoices with optional pagination limit.
        try:
            limit = int(request.query_params.get('limit', 100))
            limit = min(max(limit, 1), 500) 
            
            invoices = invoice_service.get_all_invoices(limit=limit)
            serializer = InvoiceSerializer(invoices, many=True)
            # Return consistent format with results and count for frontend compatibility
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            })
        except Exception as e:
            return handle_supabase_exception(e)
    
    def create(self, request, *args, **kwargs):
        """Create a new invoice."""
        try:
            serializer = InvoiceSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            invoice_id = invoice_service.create_invoice(serializer.validated_data)
            invoice = invoice_service.get_invoice(invoice_id)
            return Response(invoice, status=status.HTTP_201_CREATED)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def retrieve(self, request, pk=None, *args, **kwargs):
        try:
            invoice = invoice_service.get_invoice(pk)
            if not invoice:
                return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
            serializer = InvoiceSerializer(invoice)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def update(self, request, pk=None, *args, **kwargs):
        try:
            serializer = InvoiceSerializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            success = invoice_service.update_invoice(pk, serializer.validated_data)
            if not success:
                return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
            
            invoice = invoice_service.get_invoice(pk)
            return Response(invoice)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def partial_update(self, request, pk=None, *args, **kwargs):
        return self.update(request, pk=pk, *args, **kwargs)
    
    def destroy(self, request, pk=None, *args, **kwargs):
        try:
            success = invoice_service.delete_invoice(pk)
            if not success:
                return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_supabase_exception(e)
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        try:
            status_filter = request.query_params.get('status')
            if not status_filter:
                return Response({'error': 'Status parameter required'}, status=status.HTTP_400_BAD_REQUEST)
            
            invoices = invoice_service.get_invoices_by_status(status_filter)
            serializer = InvoiceSerializer(invoices, many=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
    
    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        try:
            patient_id = request.query_params.get('patient_id')
            if not patient_id:
                return Response({'error': 'Patient ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            invoices = invoice_service.get_patient_invoices(patient_id)
            serializer = InvoiceSerializer(invoices, many=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
