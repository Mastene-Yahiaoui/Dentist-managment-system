'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

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
    if (!confirm('Are you sure you want to delete this item?')) return;
    // Delete locally (UI-only)
    setInventory(prev => prev.filter(it => it.id !== id));
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
        <div className="flex space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
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
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              + Add Item
            </Button>
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
    </div>
  );
}
