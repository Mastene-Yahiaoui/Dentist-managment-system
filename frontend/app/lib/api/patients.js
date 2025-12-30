import { API_BASE_URL, fetchWithErrorHandling, handleResponse, normalizeListResponse } from './client.js';

export const patients_api = {
  async getPatients() {
    const url = `${API_BASE_URL}/patients/`;
    const res = await fetchWithErrorHandling(url);
    const data = await handleResponse(res, url, 'Failed to fetch patients');
    return normalizeListResponse(data);
  },

  async getPatient(id) {
    const url = `${API_BASE_URL}/patients/${id}/`;
    const res = await fetchWithErrorHandling(url);
    return handleResponse(res, url, 'Failed to fetch patient');
  },

  async createPatient(data) {
    const url = `${API_BASE_URL}/patients/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to create patient');
  },

  async updatePatient(id, data) {
    const url = `${API_BASE_URL}/patients/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to update patient');
  },

  async deletePatient(id) {
    const url = `${API_BASE_URL}/patients/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'DELETE',
    });
    return handleResponse(res, url, 'Failed to delete patient');
  },
};