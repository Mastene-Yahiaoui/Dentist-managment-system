
#Patient CRUD operations for Supabase.

from typing import Dict, List, Any, Optional
from .base import BaseSupabaseService

class PatientService(BaseSupabaseService):
    table_name = 'patients'
    
    def create_patient(self, patient_data: Dict[str, Any]) -> str:
        return self.create(patient_data)
    
    def get_patient(self, patient_id: str) -> Optional[Dict[str, Any]]:
        return self.get(patient_id)
    
    def get_all_patients(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        return self.get_all(limit=limit, order_by='created_at')
    
    def search_patients(self, search_term: str) -> List[Dict[str, Any]]:
        all_patients = self.get_all()
        search_term_lower = search_term.lower()
        
        results = []
        for patient in all_patients:
            if any([
                search_term_lower in (patient.get('first_name') or '').lower(),
                search_term_lower in (patient.get('last_name') or '').lower(),
                search_term_lower in (patient.get('phone') or '').lower(),
                search_term_lower in (patient.get('email') or '').lower(),
            ]):
                results.append(patient)   
        return results
    
    def update_patient(self, patient_id: str, patient_data: Dict[str, Any]) -> bool:
        return self.update(patient_id, patient_data)
    
    def delete_patient(self, patient_id: str) -> bool:
        return self.delete(patient_id)
