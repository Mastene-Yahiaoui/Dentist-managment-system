
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..serializers import InventorySerializer
from ..supabase_service import inventory_service
from ..views_utils import SupabaseEnabledViewSetMixin, handle_supabase_exception
from rest_framework.permissions import AllowAny

class InventoryViewSet(SupabaseEnabledViewSetMixin, viewsets.ViewSet):
    permission_classes = [AllowAny]
    serializer_class = InventorySerializer
    basename = 'inventory'
    
    def list(self, request, *args, **kwargs):
        try:
            limit = int(request.query_params.get('limit', 100))
            limit = min(max(limit, 1), 500)  
            
            items = inventory_service.get_all_items(limit=limit)
            serializer = InventorySerializer(items, many=True)
            # Return consistent format with results and count for frontend compatibility
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            })
        except Exception as e:
            return handle_supabase_exception(e)
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = InventorySerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            item_id = inventory_service.create_item(serializer.validated_data)
            item = inventory_service.get_item(item_id)
            return Response(item, status=status.HTTP_201_CREATED)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def retrieve(self, request, pk=None, *args, **kwargs):
        try:
            item = inventory_service.get_item(pk)
            if not item:
                return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
            serializer = InventorySerializer(item)
            return Response(serializer.data)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def update(self, request, pk=None, *args, **kwargs):
        try:
            serializer = InventorySerializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            success = inventory_service.update_item(pk, serializer.validated_data)
            if not success:
                return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
            
            item = inventory_service.get_item(pk)
            return Response(item)
        except Exception as e:
            return handle_supabase_exception(e)
    
    def partial_update(self, request, pk=None, *args, **kwargs):
        return self.update(request, pk=pk, *args, **kwargs)
    
    def destroy(self, request, pk=None, *args, **kwargs):
        try:
            success = inventory_service.delete_item(pk)
            if not success:
                return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_supabase_exception(e)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        try:
            items = inventory_service.get_low_stock_items()
            serializer = InventorySerializer(items, many=True)
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            })
        except Exception as e:
            return handle_supabase_exception(e)
    
    @action(detail=True, methods=['post'])
    def update_quantity(self, request, pk=None):
        quantity = request.data.get('quantity')
        if quantity is None:
            return Response({'error': 'quantity is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            quantity = int(quantity)
            if quantity < 0:
                return Response({'error': 'quantity must be non-negative'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'quantity must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            success = inventory_service.update_quantity(pk, quantity)
            if not success:
                return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
            item = inventory_service.get_item(pk)
            return Response(item)
        except Exception as e:
            return handle_supabase_exception(e)
