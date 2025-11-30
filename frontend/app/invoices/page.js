"use client";

import { useState } from 'react';
import { truncateText } from '../lib/utils';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

export default function Invoices() {
  const [invoices, setInvoices] = useState([
    // sample invoice to demonstrate UI
    {
      id: 1,
      patient_name: 'John Doe',
      treatment_description: 'Teeth cleaning and polish',
      amount: 120.0,
      status: 'Unpaid',
      issued_at: new Date().toISOString(),
    },
  ]);

  const [patients] = useState([
    { id: 'p1', first_name: 'John', last_name: 'Doe' },
    { id: 'p2', first_name: 'Jane', last_name: 'Smith' },
  ]);

  const [treatments] = useState([
    { id: 't1', patient_name: 'John Doe', description: 'Teeth cleaning' },
    { id: 't2', patient_name: 'Jane Smith', description: 'Filling' },
  ]);

  const [loading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    treatment_id: '',
    amount: '',
    status: 'Unpaid',
  });

  // No backend fetching in this UI-only version.
  // Data is kept in local component state for demo and UI purposes.

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      // Add invoice locally (UI-only, no backend)
      const patient = patients.find(p => p.id === formData.patient_id);
      const treatment = treatments.find(t => t.id === formData.treatment_id);
      const newInvoice = {
        id: Date.now(),
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
        treatment_description: treatment ? treatment.description : '',
        amount: parseFloat(formData.amount) || 0,
        status: formData.status,
        issued_at: new Date().toISOString(),
      };
      setInvoices(prev => [newInvoice, ...prev]);
      setIsModalOpen(false);
      setFormData({ patient_id: '', treatment_id: '', amount: '', status: 'Unpaid' });
    } catch (err) {
      console.error('Error creating invoice (UI-only):', err);
      setError('Failed to create invoice');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredInvoices =
    filterStatus === 'all' ? invoices : invoices.filter(inv => inv.status === filterStatus);

  const columns = [
    { header: 'Invoice #', render: (row) => `#${row.id}` },
    { header: 'Patient', accessor: 'patient_name' },
    { header: 'Treatment', render: (row) => truncateText(row.treatment_description, 40) },
    { header: 'Amount', render: (row) => `$${row.amount}` },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Date', render: (row) => row.issued_at ? new Date(row.issued_at).toLocaleDateString() : '' },
  ];

  // UI-only: no loading state to show

  return (
    <div className="min-h-screen">
      <Navbar title="Invoices" />
      
      <div className="p-8">
        {/* No backend fetching — UI-only mode */}

        <Card>
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('Paid')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'Paid' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setFilterStatus('Unpaid')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'Unpaid' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Unpaid
              </button>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              + Add Invoice
            </Button>
          </div>
          
          {filteredInvoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invoices found.</p>
          ) : (
            <Table columns={columns} data={filteredInvoices} />
          )}
        </Card>
      </div>

      {/* Add Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Invoice"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient <span className="text-red-500">*</span>
            </label>
            <select
              name="patient_id"
              value={formData.patient_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment <span className="text-red-500">*</span>
            </label>
            <select
              name="treatment_id"
              value={formData.treatment_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a treatment</option>
              {treatments.map(treatment => (
                <option key={treatment.id} value={treatment.id}>
                  {treatment.patient_name} - {truncateText(treatment.description, 40)}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleInputChange}
            required
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
