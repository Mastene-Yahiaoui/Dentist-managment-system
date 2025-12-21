'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import IconButton from '../components/IconButton';
import {inventory_api} from '../lib/api';

export default function Inventory() {
  // Dummy/local UI-only data
  const [inventory, setInventory] = useState([
    { id: 1, item: 'Gloves', quantity: 200, status: 'In stock' },
    { id: 2, item: 'Toothpaste', quantity: 20, status: 'Low stock' },
    { id: 3, item: 'Anesthetic', quantity: 0, status: 'Out of stock' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    quantity: 0,
  });
  // No backend fetching in UI-only mode — inventory is local dummy data above.

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      // Create locally (UI-only)
      const newItem = {
        id: Date.now(),
        item: formData.item,
        quantity: Number(formData.quantity) || 0,
        status: (Number(formData.quantity) || 0) > 50 ? 'In stock' : (Number(formData.quantity) > 0 ? 'Low stock' : 'Out of stock'),
      };
      setInventory(prev => [newItem, ...prev]);
      setIsModalOpen(false);
      setFormData({ item: '', quantity: 0 });
    } catch (error) {
      console.error('Error creating inventory item:', error);
      setError(error.message || 'Failed to create inventory item');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({ item: item.item, quantity: item.quantity });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      // Update locally (UI-only)
      setInventory(prev => prev.map(it => it.id === editingItem.id ? {
        ...it,
        item: formData.item,
        quantity: Number(formData.quantity) || 0,
        status: (Number(formData.quantity) || 0) > 50 ? 'In stock' : (Number(formData.quantity) > 0 ? 'Low stock' : 'Out of stock'),
      } : it));
      setIsEditModalOpen(false);
      setEditingItem(null);
      setFormData({ item: '', quantity: 0 });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      setError(error.message || 'Failed to update inventory item');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDeleteId(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleteLoading(true);
    try {
      await inventory_api.deleteInventoryItem(confirmDeleteId);
      setInventory(prev => prev.filter(item => item.id !== confirmDeleteId));
      setIsConfirmDeleteOpen(false);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      setError(error.message || 'Failed to delete inventory item');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsConfirmDeleteAllOpen(true);
  };

  const handleConfirmDeleteAll = async () => {
    setDeleteLoading(true);
    try {
      for (const item of inventory) {
        await inventory_api.deleteInventoryItem(item.id);
      }
      setInventory([]);
      setIsConfirmDeleteAllOpen(false);
    } catch (error) {
      console.error('Error deleting all inventory items:', error);
      setError(error.message || 'Failed to delete all inventory items');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.item?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'In stock':
        return 'bg-green-100 text-green-800';
      case 'Low stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { header: 'Item', accessor: 'item' },
    { header: 'Quantity', accessor: 'quantity' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton
            ariaLabel="Edit item"
            title="Edit item"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
              <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </IconButton>
          <IconButton
            ariaLabel="Delete item"
            title="Delete item"
            variant="danger-ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9zm-3 6h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9z" />
            </svg>
          </IconButton>
        </div>
      )
    },
  ];

  // UI-only: no loading state

  return (
    <div className="min-h-screen">
      <Navbar title="Inventory" />
      
      <div className="p-8">
        {/* UI-only mode with dummy data */}

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-black">All Inventory Items</h2>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <div className="flex gap-3">
                <Button onClick={() => setIsModalOpen(true)}>
                  + Add Item
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600"
                  onClick={handleDeleteAll}
                  disabled={inventory.length === 0}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9zm-3 6h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9z" />
                    </svg>
                    Delete All
                  </span>
                </Button>
              </div>
            </div>
          </div>
          
          {filteredInventory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No inventory items found.</p>
          ) : (
            <Table columns={columns} data={filteredInventory} />
          )}
        </Card>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Item"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <Input
            label="Item Name"
            name="item"
            value={formData.item}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Quantity"
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleInputChange}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? 'Creating...' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingItem(null); }}
        title="Edit Item"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleEditSubmit}>
          <Input
            label="Item Name"
            name="item"
            value={formData.item}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Quantity"
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleInputChange}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }} disabled={submitLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Single */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Delete Item"
        size="sm"
      >
        <p className="mb-4 text-black">Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>

      {/* Confirm Delete All */}
      <Modal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        title="Delete All Items"
        size="md"
      >
        <p className="mb-4 text-black">This will permanently delete all inventory items. This action is irreversible. Do you want to proceed?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmDeleteAllOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant="danger"
            onClick={handleConfirmDeleteAll}
            disabled={deleteLoading || inventory.length === 0}
          >
            {deleteLoading ? 'Deleting...' : 'Delete All'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
