import { API_BASE_URL, fetchWithErrorHandling, handleResponse, normalizeListResponse } from './client.js';

export const invoices = {
  async getInvoices() {
    const url = `${API_BASE_URL}/invoices/`;
    const res = await fetchWithErrorHandling(url);
    const data = await handleResponse(res, url, 'Failed to fetch invoices');
    return normalizeListResponse(data);
  },

  async getInvoice(id) {
    const url = `${API_BASE_URL}/invoices/${id}/`;
    const res = await fetchWithErrorHandling(url);
    return handleResponse(res, url, 'Failed to fetch invoice');
  },

  async createInvoice(data) {
    const url = `${API_BASE_URL}/invoices/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to create invoice');
  },

  async updateInvoice(id, data) {
    const url = `${API_BASE_URL}/invoices/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to update invoice');
  },

  async deleteInvoice(id) {
    const url = `${API_BASE_URL}/invoices/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'DELETE',
    });
    return handleResponse(res, url, 'Failed to delete invoice');
  },
};