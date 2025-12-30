
GENDER_CHOICES = [
    ('M', 'Male'),
    ('F', 'Female'),
]

APPOINTMENT_STATUS_CHOICES = [
    ('Pending', 'Pending'),
    ('Confirmed', 'Confirmed'),
    ('Completed', 'Completed'),
    ('Cancelled', 'Cancelled'),
]


INVOICE_STATUS_CHOICES = [
    ('Paid', 'Paid'),
    ('Unpaid', 'Unpaid'),
]

def compute_inventory_status(quantity):

    qty = int(quantity) if quantity is not None else 0
    if qty == 0:
        return "Out of stock"
    elif qty <= 3:
        return "Low stock"
    else:
        return "In stock"
