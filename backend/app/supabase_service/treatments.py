#Treatment CRUD operations for Supabase.

from decimal import Decimal
from typing import Dict, List, Any, Optional
from .base import BaseSupabaseService


class TreatmentService(BaseSupabaseService):    
    table_name = 'treatments'
    
    def _convert_decimal_in_result(self, treatment: Dict[str, Any]) -> Dict[str, Any]:
        if treatment and 'cost' in treatment and treatment['cost'] is not None:
            if isinstance(treatment['cost'], (Decimal, float, int)):
                # Convert to Decimal first to preserve precision, then to string
                if not isinstance(treatment['cost'], Decimal):
                    treatment['cost'] = Decimal(str(treatment['cost']))
                treatment['cost'] = str(treatment['cost'])
        return treatment
    
    def _convert_decimals_in_results(self, treatments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        converted_results = []
        for treatment in treatments:
            treatment_copy = treatment.copy()
            self._convert_decimal_in_result(treatment_copy)
            converted_results.append(treatment_copy)
        return converted_results
    
    def create_treatment(self, treatment_data: Dict[str, Any]) -> str:
        return self.create(treatment_data)
    
    def get_treatment(self, treatment_id: str) -> Optional[Dict[str, Any]]:
        treatment = self.get(treatment_id)
        return self._convert_decimal_in_result(treatment) if treatment else None
    
    def get_all_treatments(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        results = self.get_all(limit=limit, order_by='date')
        return self._convert_decimals_in_results(results)
    
    def get_patient_treatments(self, patient_id: str) -> List[Dict[str, Any]]:
        results = self.query_by_field('patient_id', patient_id)
        return self._convert_decimals_in_results(results)
    
    def update_treatment(self, treatment_id: str, treatment_data: Dict[str, Any]) -> bool:
        return self.update(treatment_id, treatment_data)
    
    def delete_treatment(self, treatment_id: str) -> bool:
        return self.delete(treatment_id)
