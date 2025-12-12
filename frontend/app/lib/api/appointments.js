import { API_BASE_URL, fetchWithErrorHandling, handleResponse, normalizeListResponse } from './client.js';

export const appointments = {
  async getAppointments() {
    const url = `${API_BASE_URL}/appointments/`;
    const res = await fetchWithErrorHandling(url);
    const data = await handleResponse(res, url, 'Failed to fetch appointments');
    return normalizeListResponse(data);
  },

  async getAppointment(id) {
    const url = `${API_BASE_URL}/appointments/${id}/`;
    const res = await fetchWithErrorHandling(url);
    return handleResponse(res, url, 'Failed to fetch appointment');
  },

  async createAppointment(data) {
    const url = `${API_BASE_URL}/appointments/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to create appointment');
  },

  async updateAppointment(id, data) {
    const url = `${API_BASE_URL}/appointments/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to update appointment');
  },

  async deleteAppointment(id) {
    const url = `${API_BASE_URL}/appointments/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'DELETE',
    });
    return handleResponse(res, url, 'Failed to delete appointment');
  },
};