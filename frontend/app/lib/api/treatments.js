import { API_BASE_URL, fetchWithErrorHandling, handleResponse, normalizeListResponse } from './client.js';

export const treatments_api = {
  async getTreatments() {
    const url = `${API_BASE_URL}/treatments/`;
    const res = await fetchWithErrorHandling(url);
    const data = await handleResponse(res, url, 'Failed to fetch treatments');
    return normalizeListResponse(data);
  },

  async getTreatment(id) {
    const url = `${API_BASE_URL}/treatments/${id}/`;
    const res = await fetchWithErrorHandling(url);
    return handleResponse(res, url, 'Failed to fetch treatment');
  },

  async createTreatment(data) {
    const url = `${API_BASE_URL}/treatments/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to create treatment');
  },

  async updateTreatment(id, data) {
    const url = `${API_BASE_URL}/treatments/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to update treatment');
  },

  async deleteTreatment(id) {
    const url = `${API_BASE_URL}/treatments/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'DELETE',
    });
    return handleResponse(res, url, 'Failed to delete treatment');
  },
};