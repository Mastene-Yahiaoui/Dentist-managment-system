export { patients_api } from './api/patients.js';
export { appointments_api } from './api/appointments.js';
export { treatments_api } from './api/treatments.js';
export { invoices_api } from './api/invoices.js';
export { inventory_api } from './api/inventory.js';
export { ApiError, API_BASE_URL } from './api/client.js';

// Export as unified api object for backward compatibility
import { patients_api } from './api/patients.js';
import { appointments_api } from './api/appointments.js';
import { treatments_api } from './api/treatments.js';
import { invoices_api } from './api/invoices.js';
import { inventory_api } from './api/inventory.js';

export const api = {
  ...patients_api,
  ...appointments_api,
  ...treatments_api,
  ...invoices_api,
  ...inventory_api,
};