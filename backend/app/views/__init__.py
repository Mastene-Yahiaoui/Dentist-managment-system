
#Views package for DentNotion clinic app.

from .auth_viewset import AuthViewSet
from .patients_viewset import PatientViewSet
from .appointments_viewset import AppointmentViewSet
from .treatments_viewset import TreatmentViewSet
from .invoices_viewset import InvoiceViewSet
from .inventory_viewset import InventoryViewSet
from .xrays_viewset import XraysViewSet

__all__ = [
    'AuthViewSet',
    'PatientViewSet',
    'AppointmentViewSet',
    'TreatmentViewSet',
    'InvoiceViewSet',
    'InventoryViewSet',
    'XraysViewSet',
]
