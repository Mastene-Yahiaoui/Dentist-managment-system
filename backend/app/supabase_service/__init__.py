# Supabase service modules for managing PostgreSQL CRUD operations.

# This package provides lazy-initialized service classes for each entity:
# - base.py: Base service class with generic CRUD operations
# - patients.py: Patient CRUD operations
# - appointments.py: Appointment CRUD operations
# - treatments.py: Treatment CRUD operations
# - invoices.py: Invoice CRUD operations
# - inventory.py: Inventory CRUD operations

# Services use lazy initialization to avoid connecting to Supabase until
# the first actual database operation is performed.


from .base import (
    BaseSupabaseService,
    SupabaseServiceError,
    SupabaseDatabaseError,
    SupabaseConnectionError,
    SupabaseDocumentNotFoundError,
)
from .patients import PatientService
from .appointments import AppointmentService
from .treatments import TreatmentService
from .invoices import InvoiceService
from .inventory import InventoryService
from .xrays import XrayService


# Lazy singleton instances - created once when first accessed
_patient_service = None
_appointment_service = None
_treatment_service = None
_invoice_service = None
_inventory_service = None
_xray_service = None


def get_patient_service():
    global _patient_service
    if _patient_service is None:
        _patient_service = PatientService()
    return _patient_service


def get_appointment_service():
    global _appointment_service
    if _appointment_service is None:
        _appointment_service = AppointmentService()
    return _appointment_service


def get_treatment_service():
    global _treatment_service
    if _treatment_service is None:
        _treatment_service = TreatmentService()
    return _treatment_service


def get_invoice_service():
    global _invoice_service
    if _invoice_service is None:
        _invoice_service = InvoiceService()
    return _invoice_service


def get_inventory_service():
    global _inventory_service
    if _inventory_service is None:
        _inventory_service = InventoryService()
    return _inventory_service


def get_xray_service():
    global _xray_service
    if _xray_service is None:
        _xray_service = XrayService()
    return _xray_service


class _LazyService:
    
    def __init__(self, getter):
        self._getter = getter
        self._instance = None
    
    def __getattr__(self, name):
        if self._instance is None:
            self._instance = self._getter()
        return getattr(self._instance, name)


# Lazy service instances for backward compatibility with existing code
patient_service = _LazyService(get_patient_service)
appointment_service = _LazyService(get_appointment_service)
treatment_service = _LazyService(get_treatment_service)
invoice_service = _LazyService(get_invoice_service)
inventory_service = _LazyService(get_inventory_service)
xray_service = _LazyService(get_xray_service)


__all__ = [
    'BaseSupabaseService',
    'SupabaseServiceError',
    'SupabaseDatabaseError',
    'SupabaseConnectionError',
    'SupabaseDocumentNotFoundError',
    'PatientService',
    'AppointmentService',
    'TreatmentService',
    'InvoiceService',
    'InventoryService',
    'XrayService',
    'get_patient_service',
    'get_appointment_service',
    'get_treatment_service',
    'get_invoice_service',
    'get_inventory_service',
    'get_xray_service',
    'patient_service',
    'appointment_service',
    'treatment_service',
    'invoice_service',
    'inventory_service',
    'xray_service',
]
