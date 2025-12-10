#Inventory CRUD operations for Supabase.
from typing import Dict, List, Any, Optional
from .base import BaseSupabaseService


def compute_inventory_status(quantity: int) -> str:
    qty = int(quantity) if quantity is not None else 0
    if qty == 0:
        return "Out of stock"
    elif qty <= 3:
        return "Low stock"
    else:
        return "In stock"


class InventoryService(BaseSupabaseService):
    
    table_name = 'inventory'  
    def _add_status_to_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        if item:
            item['status'] = compute_inventory_status(item.get('quantity', 0))
        return item
    
    def create_item(self, item_data: Dict[str, Any]) -> str:
        if 'quantity' in item_data:
            item_data['quantity'] = int(item_data['quantity'])
        return self.create(item_data)
    
    def get_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        item = self.get(item_id)
        return self._add_status_to_item(item)
    
    def get_all_items(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        items = self.get_all(limit=limit, order_by='created_at')
        return [self._add_status_to_item(item) for item in items]
    
    def get_items_by_status(self, status: str) -> List[Dict[str, Any]]:
        all_items = self.get_all_items()
        return [item for item in all_items if item.get('status') == status]
    
    def get_low_stock_items(self) -> List[Dict[str, Any]]:
        all_items = self.get_all_items()
        return [item for item in all_items if item.get('status') in ["Out of stock", "Low stock"]]
    
    def update_item(self, item_id: str, item_data: Dict[str, Any]) -> bool:
        if 'quantity' in item_data:
            item_data['quantity'] = int(item_data['quantity'])
        return self.update(item_id, item_data)
    
    def delete_item(self, item_id: str) -> bool:
        return self.delete(item_id)
    
    def update_quantity(self, item_id: str, quantity: int) -> bool:
        return self.update(item_id, {'quantity': int(quantity)})
