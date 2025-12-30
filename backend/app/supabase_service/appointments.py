#Appointment CRUD operations for Supabase.
from typing import Dict, List, Any, Optional
from .base import BaseSupabaseService


class AppointmentService(BaseSupabaseService):  
    table_name = 'appointments'
    
    def create_appointment(self, appointment_data: Dict[str, Any]) -> str:
        return self.create(appointment_data)
    
    def get_appointment(self, appointment_id: str) -> Optional[Dict[str, Any]]:
        return self.get(appointment_id)
    
    def get_all_appointments(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        return self.get_all(limit=limit, order_by='date')
    
    def get_patient_appointments(self, patient_id: str) -> List[Dict[str, Any]]:
        return self.query_by_field('patient_id', patient_id)
    
    def get_appointments_by_status(self, status: str) -> List[Dict[str, Any]]:
        return self.query_by_field('status', status)
    
    def update_appointment(self, appointment_id: str, appointment_data: Dict[str, Any]) -> bool:
        return self.update(appointment_id, appointment_data)
    
    def delete_appointment(self, appointment_id: str) -> bool:
        return self.delete(appointment_id)
