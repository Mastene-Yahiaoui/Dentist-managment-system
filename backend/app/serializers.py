
# Serializers for the app.

# These serializers work with Supabase PostgreSQL dictionary data.
# They handle serialization and validation for the REST API.

# All data is stored in Supabase PostgreSQL tables:
# - patients
# - appointments
# - treatments
# - invoices
# - inventory


from rest_framework import serializers
from .models import (
    GENDER_CHOICES,
    APPOINTMENT_STATUS_CHOICES,
    INVOICE_STATUS_CHOICES,
    compute_inventory_status,
)


class PatientSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    gender = serializers.ChoiceField(choices=GENDER_CHOICES)
    birth_date = serializers.DateField()
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    medical_history = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def to_representation(self, instance):
        if isinstance(instance, dict):
            data = instance.copy()
            for field in ['created_at', 'updated_at', 'birth_date']:
                if field in data and data[field] is not None:
                    if hasattr(data[field], 'isoformat'):
                        data[field] = data[field].isoformat()
            return data
        return super().to_representation(instance)


class AppointmentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    patient_id = serializers.CharField(required=True)
    patient_name = serializers.SerializerMethodField(read_only=True)
    date = serializers.DateField()
    time = serializers.TimeField()
    status = serializers.ChoiceField(
        choices=APPOINTMENT_STATUS_CHOICES,
        default='Pending'
    )
    reason = serializers.CharField(max_length=255)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def get_patient_name(self, obj):
        if isinstance(obj, dict):
            if 'patient_name' in obj:
                return obj['patient_name']
            return ''
        return ""
    
    def to_representation(self, instance):
        if isinstance(instance, dict):
            data = instance.copy()
            for field in ['created_at', 'updated_at']:
                if field in data and data[field] is not None:
                    if hasattr(data[field], 'isoformat'):
                        data[field] = data[field].isoformat()
            for field in ['date']:
                if field in data and data[field] is not None:
                    if hasattr(data[field], 'isoformat'):
                        data[field] = data[field].isoformat()
            for field in ['time']:
                if field in data and data[field] is not None:
                    if hasattr(data[field], 'isoformat'):
                        data[field] = data[field].isoformat()
            if 'patient_name' not in data:
                data['patient_name'] = self.get_patient_name(instance)
            return data
        return super().to_representation(instance)


class TreatmentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    patient_id = serializers.CharField(required=True)
    patient_name = serializers.SerializerMethodField(read_only=True)
    appointment_id = serializers.CharField(required=False, allow_null=True)
    description = serializers.CharField(required=True)
    cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=True, min_value=0)
    date = serializers.DateField(required=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def get_patient_name(self, obj):
        if isinstance(obj, dict):
            if 'patient_name' in obj:
                return obj['patient_name']
            return ''
        return ""
    
    def validate_cost(self, value):
        if value is None:
            raise serializers.ValidationError("Cost cannot be empty")
        if value <= 0:
            raise serializers.ValidationError("Cost must be greater than 0")
        return value
    
    def to_representation(self, instance):
        if isinstance(instance, dict):
            data = instance.copy()
            for field in ['created_at', 'updated_at', 'date']:
                if field in data and data[field] is not None:
                    if hasattr(data[field], 'isoformat'):
                        data[field] = data[field].isoformat()
            if 'cost' in data and data['cost'] is not None:
                data['cost'] = str(data['cost'])
            if 'patient_name' not in data:
                data['patient_name'] = self.get_patient_name(instance)
            return data
        return super().to_representation(instance)


class InvoiceSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    patient_id = serializers.CharField(required=True)
    patient_name = serializers.SerializerMethodField(read_only=True)
    treatment_id = serializers.CharField(required=True)
    treatment_description = serializers.SerializerMethodField(read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=True, min_value=0)
    status = serializers.ChoiceField(
        choices=INVOICE_STATUS_CHOICES,
        default='Unpaid'
    )
    issued_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def get_patient_name(self, obj):
        if isinstance(obj, dict):
            if 'patient_name' in obj:
                return obj['patient_name']
            return ''
        return ""
    
    def get_treatment_description(self, obj):
        if isinstance(obj, dict):
            if 'treatment_description' in obj:
                return obj['treatment_description']
            desc = obj.get('description', '')
            return desc[:100] if desc else ''
        return ""
    
    def validate_amount(self, value):
        if value is None:
            raise serializers.ValidationError("Amount cannot be empty")
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
    
    def to_representation(self, instance):
        if isinstance(instance, dict):
            data = instance.copy()
            for field in ['issued_at', 'updated_at']:
                if field in data and data[field] is not None:
                    if hasattr(data[field], 'isoformat'):
                        data[field] = data[field].isoformat()
            if 'amount' in data and data['amount'] is not None:
                data['amount'] = str(data['amount'])
            if 'patient_name' not in data:
                data['patient_name'] = self.get_patient_name(instance)
            if 'treatment_description' not in data:
                data['treatment_description'] = self.get_treatment_description(instance)
            return data
        return super().to_representation(instance)


class InventorySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    item = serializers.CharField(max_length=255)
    quantity = serializers.IntegerField(min_value=0, default=0)
    status = serializers.SerializerMethodField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def get_status(self, obj):
        if isinstance(obj, dict):
            quantity = obj.get('quantity', 0)
        else:
            quantity = 0
        return compute_inventory_status(quantity)
    
    def to_representation(self, instance):
        if isinstance(instance, dict):
            data = instance.copy()
            for field in ['created_at', 'updated_at']:
                if field in data and data[field] is not None:
                    if hasattr(data[field], 'isoformat'):
                        data[field] = data[field].isoformat()
            if 'status' not in data or data.get('_compute_status', True):
                data['status'] = compute_inventory_status(data.get('quantity', 0))
            return data
        return super().to_representation(instance)


class XraySerializer(serializers.Serializer):
    """Serializer for patient X-ray/scan images."""
    id = serializers.CharField(read_only=True)
    patient_id = serializers.CharField(required=True)
    image_url = serializers.CharField(read_only=True)
    image_name = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    image_type = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date_taken = serializers.DateField(required=False, allow_null=True)
    signed_url = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def to_representation(self, instance):
        if isinstance(instance, dict):
            data = instance.copy()
            for field in ['created_at', 'updated_at']:
                if field in data and data[field] is not None:
                    if hasattr(data[field], 'isoformat'):
                        data[field] = data[field].isoformat()
            for field in ['date_taken']:
                if field in data and data[field] is not None:
                    if hasattr(data[field], 'isoformat'):
                        data[field] = data[field].isoformat()
            return data
        return super().to_representation(instance)
