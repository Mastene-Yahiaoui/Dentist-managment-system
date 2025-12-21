import { API_BASE_URL, fetchWithErrorHandling, handleResponse, normalizeListResponse } from './client.js';

export const xrays_api = {
  /**
   * Get all X-ray images for a specific patient.
   * @param {string} patientId - The patient ID to fetch images for
   * @returns {Promise<Array>} - Array of xray image objects with signed URLs
   */
  async getPatientXrays(patientId) {
    const url = `${API_BASE_URL}/xrays/?patient_id=${patientId}`;
    const res = await fetchWithErrorHandling(url);
    const data = await handleResponse(res, url, 'Failed to fetch patient X-rays');
    return normalizeListResponse(data);
  },

  /**
   * Get a single X-ray image by ID.
   * @param {string} id - The X-ray image ID
   * @returns {Promise<Object>} - The xray image object with signed URL
   */
  async getXray(id) {
    const url = `${API_BASE_URL}/xrays/${id}/`;
    const res = await fetchWithErrorHandling(url);
    return handleResponse(res, url, 'Failed to fetch X-ray');
  },

  /**
   * Upload a new X-ray image for a patient.
   * @param {string} patientId - The patient ID
   * @param {File} file - The image file to upload
   * @param {Object} metadata - Optional metadata (description, date_taken)
   * @returns {Promise<Object>} - The created xray image object
   */
  async uploadXray(patientId, file, metadata = {}) {
    const url = `${API_BASE_URL}/xrays/`;
    
    const formData = new FormData();
    formData.append('patient_id', patientId);
    formData.append('file', file);
    
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    if (metadata.date_taken) {
      formData.append('date_taken', metadata.date_taken);
    }
    
    // Don't set Content-Type header - browser will set it with boundary for multipart
    const res = await fetchWithErrorHandling(url, {
      method: 'POST',
      body: formData,
      timeout: 30000, // 30 seconds for file upload
    });
    
    return handleResponse(res, url, 'Failed to upload X-ray');
  },

  /**
   * Update X-ray metadata (description, date_taken).
   * @param {string} id - The X-ray image ID
   * @param {Object} data - The metadata to update
   * @returns {Promise<Object>} - The updated xray image object
   */
  async updateXray(id, data) {
    const url = `${API_BASE_URL}/xrays/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to update X-ray');
  },

  /**
   * Delete an X-ray image.
   * @param {string} id - The X-ray image ID to delete
   * @returns {Promise<void>}
   */
  async deleteXray(id) {
    const url = `${API_BASE_URL}/xrays/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'DELETE',
    });
    return handleResponse(res, url, 'Failed to delete X-ray');
  },
};
