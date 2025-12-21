import { API_BASE_URL, fetchWithErrorHandling, handleResponse, normalizeListResponse } from './client.js';

export const inventory_api = {
  async getInventory() {
    const url = `${API_BASE_URL}/inventory/`;
    const res = await fetchWithErrorHandling(url);
    const data = await handleResponse(res, url, 'Failed to fetch inventory');
    return normalizeListResponse(data);
  },

  async getInventoryItem(id) {
    const url = `${API_BASE_URL}/inventory/${id}/`;
    const res = await fetchWithErrorHandling(url);
    return handleResponse(res, url, 'Failed to fetch inventory item');
  },

  async createInventoryItem(data) {
    const url = `${API_BASE_URL}/inventory/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to create inventory item');
  },

  async updateInventoryItem(id, data) {
    const url = `${API_BASE_URL}/inventory/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, url, 'Failed to update inventory item');
  },

  async deleteInventoryItem(id) {
    const url = `${API_BASE_URL}/inventory/${id}/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'DELETE',
    });
    return handleResponse(res, url, 'Failed to delete inventory item');
  },

  async updateInventoryQuantity(id, quantity) {
    const url = `${API_BASE_URL}/inventory/${id}/update_quantity/`;
    const res = await fetchWithErrorHandling(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    return handleResponse(res, url, 'Failed to update inventory quantity');
  },

  async getLowStockItems() {
    const url = `${API_BASE_URL}/inventory/low_stock/`;
    const res = await fetchWithErrorHandling(url);
    const data = await handleResponse(res, url, 'Failed to fetch low stock items');
    return normalizeListResponse(data);
  },
};