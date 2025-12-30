#Invoice CRUD operations for Supabase.
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Any, Optional
from .base import BaseSupabaseService


class InvoiceService(BaseSupabaseService):
    
    table_name = 'invoices'
    
    def _convert_decimal_in_result(self, invoice: Dict[str, Any]) -> Dict[str, Any]:
        if invoice and 'amount' in invoice and invoice['amount'] is not None:
            if isinstance(invoice['amount'], (Decimal, float, int)):
                # Convert to Decimal first to preserve precision, then to string
                if not isinstance(invoice['amount'], Decimal):
                    invoice['amount'] = Decimal(str(invoice['amount']))
                invoice['amount'] = str(invoice['amount'])
        return invoice
    
    def _convert_decimals_in_results(self, invoices: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        converted_results = []
        for invoice in invoices:
            invoice_copy = invoice.copy()
            self._convert_decimal_in_result(invoice_copy)
            converted_results.append(invoice_copy)
        return converted_results
    
    def _add_timestamps(self, data: Dict[str, Any], created: bool = True) -> Dict[str, Any]:
        # First convert any existing date/time objects
        data = self._convert_dates_to_strings(data)
        # Convert Decimals to strings for JSON serialization
        data = self._convert_decimals_to_strings(data)
        
        # Add timestamps as ISO strings
        now = datetime.utcnow().isoformat()
        if created:
            data['issued_at'] = now
        data['updated_at'] = now
        return data
    
    def create_invoice(self, invoice_data: Dict[str, Any]) -> str:
        return self.create(invoice_data)
    
    def get_invoice(self, invoice_id: str) -> Optional[Dict[str, Any]]:
        invoice = self.get(invoice_id)
        return self._convert_decimal_in_result(invoice) if invoice else None
    
    def get_all_invoices(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        results = self.get_all(limit=limit, order_by='issued_at')
        return self._convert_decimals_in_results(results)
    
    def get_patient_invoices(self, patient_id: str) -> List[Dict[str, Any]]:
        results = self.query_by_field('patient_id', patient_id)
        return self._convert_decimals_in_results(results)
    
    def get_invoices_by_status(self, status: str) -> List[Dict[str, Any]]:
        results = self.query_by_field('status', status)
        return self._convert_decimals_in_results(results)
    
    def update_invoice(self, invoice_id: str, invoice_data: Dict[str, Any]) -> bool:
        return self.update(invoice_id, invoice_data)
    
    def delete_invoice(self, invoice_id: str) -> bool:
        return self.delete(invoice_id)
