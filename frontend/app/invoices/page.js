'use client';

import { useState } from 'react';
import { truncateText } from '../lib/utils';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import IconButton from '../components/IconButton';

export default function Invoices() {
  const [invoices, setInvoices] = useState([
    { id: 101, patient_name: 'John Doe', treatment_description: 'Teeth cleaning', amount: 120.0, status: 'Unpaid', issued_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 102, patient_name: 'Jane Smith', treatment_description: 'Filling', amount: 200.0, status: 'Paid', issued_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 103, patient_name: 'Alice Johnson', treatment_description: 'Root canal treatment', amount: 850.0, status: 'Unpaid', issued_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 104, patient_name: 'Bob Martin', treatment_description: 'Crown placement', amount: 450.0, status: 'Paid', issued_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 105, patient_name: 'Clara Oswald', treatment_description: 'Orthodontic consultation', amount: 75.0, status: 'Paid', issued_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 106, patient_name: 'David Tennant', treatment_description: 'Extraction (wisdom tooth)', amount: 300.0, status: 'Unpaid', issued_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 107, patient_name: 'Emma Brown', treatment_description: 'Teeth whitening', amount: 220.0, status: 'Paid', issued_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 108, patient_name: 'Frank Green', treatment_description: 'Periodontal therapy', amount: 560.0, status: 'Unpaid', issued_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
  ]);
  const [patients] = useState([
    { id: 'p1', first_name: 'John', last_name: 'Doe' },
    { id: 'p2', first_name: 'Jane', last_name: 'Smith' },
    { id: 'p3', first_name: 'Alice', last_name: 'Johnson' },
    { id: 'p4', first_name: 'Bob', last_name: 'Martin' },
    { id: 'p5', first_name: 'Clara', last_name: 'Oswald' },
    { id: 'p6', first_name: 'David', last_name: 'Tennant' },
    { id: 'p7', first_name: 'Emma', last_name: 'Brown' },
    { id: 'p8', first_name: 'Frank', last_name: 'Green' },
  ]);
  const [treatments] = useState([
    { id: 't1', patient_name: 'John Doe', description: 'Teeth cleaning' },
    { id: 't2', patient_name: 'Jane Smith', description: 'Filling' },
    { id: 't3', patient_name: 'Alice Johnson', description: 'Root canal treatment' },
    { id: 't4', patient_name: 'Bob Martin', description: 'Crown placement' },
    { id: 't5', patient_name: 'Clara Oswald', description: 'Orthodontic consultation' },
    { id: 't6', patient_name: 'David Tennant', description: 'Extraction (wisdom tooth)' },
    { id: 't7', patient_name: 'Emma Brown', description: 'Teeth whitening' },
    { id: 't8', patient_name: 'Frank Green', description: 'Periodontal therapy' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    treatment_id: '',
    amount: '',
    status: 'Unpaid',
  });
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
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

  const handleEditClick = (invoice) => {
    setFormData({
      patient_id: invoice.patient_id,
      treatment_id: invoice.treatment_id || '',
      amount: invoice.amount,
      status: invoice.status,
    });
    setEditingInvoiceId(invoice.id);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      await invoices_api.updateInvoice(editingInvoiceId, formData);
      setIsEditModalOpen(false);
      setEditingInvoiceId(null);
      setFormData({
        patient_id: '',
        treatment_id: '',
        amount: '',
        status: 'Unpaid',
      });
      fetchData();
    } catch (error) {
      console.error('Error updating invoice:', error);
      setError(error.message || 'Failed to update invoice');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredInvoices = filterStatus === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === filterStatus);

 
  const invoicesWithNames = filteredInvoices.map(invoice => {
    const patient = patients.find(p => p.id === invoice.patient_id);
    const treatment = treatments.find(t => t.id === invoice.treatment_id);
    return {
      ...invoice,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient',
      treatment_description: treatment ? treatment.description : 'Unknown Treatment'
    };
  });

  // Filter invoices based on search term
  const searchedInvoices = invoicesWithNames.filter(invoice =>
    invoice.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Patient', accessor: 'patient_name' },
    { header: 'Treatment', render: (row) => truncateText(row.treatment_description, 40) },
    { header: 'Amount', render: (row) => `DZD ${row.amount}` },
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
    { header: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <IconButton
          ariaLabel="Edit invoice"
          title="Edit invoice"
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
          ariaLabel="Delete invoice"
          title="Delete invoice"
          variant="danger-ghost"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDeleteId(row.id);
            setIsConfirmDeleteOpen(true);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9zm-3 6h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9z" />
          </svg>
        </IconButton>
      </div>
    )},
  ];

  

  return (
    <div className="min-h-screen">
      <Navbar title="Invoices" />
      
      <div className="p-8">

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
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Search by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <div className="flex gap-3">
                <Button onClick={() => setIsModalOpen(true)}>
                  + Add Invoice
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600"
                  onClick={() => setIsConfirmDeleteAllOpen(true)}
                  disabled={invoices.length === 0}
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
          
          {filteredInvoices.length === 0 && !fetchError ? (
            <p className="text-black text-center py-8">No invoices found.</p>
          ) : searchedInvoices.length === 0 ? (
            <p className="text-black text-center py-8">No invoices match your search.</p>
          ) : (
            <Table columns={columns} data={searchedInvoices} />
          )}
        </Card>
      </div>

      
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

      {/* Edit Invoice Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingInvoiceId(null);
          setFormData({
            patient_id: '',
            treatment_id: '',
            amount: '',
            status: 'Unpaid',
          });
        }}
        title="Edit Invoice"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleEditSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient <span className="text-red-500">*</span>
            </label>
            <select
              name="patient_id"
              value={formData.patient_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
            <label className="block text-sm font-medium text-black mb-2">
              Treatment <span className="text-red-500">*</span>
            </label>
            <select
              name="treatment_id"
              value={formData.treatment_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setEditingInvoiceId(null);
              setFormData({
                patient_id: '',
                treatment_id: '',
                amount: '',
                status: 'Unpaid',
              });
            }} disabled={submitLoading}>
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
        title="Delete Invoice"
        size="sm"
      >
        <p className="mb-4 text-black">Are you sure you want to delete this invoice? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirmDeleteId) return;
              setDeleteLoading(true);
              try {
                await invoices_api.deleteInvoice(confirmDeleteId);
                setInvoices(prev => prev.filter(i => i.id !== confirmDeleteId));
                setIsConfirmDeleteOpen(false);
              } catch (err) {
                setError(err.message || 'Failed to delete invoice');
              } finally {
                setDeleteLoading(false);
              }
            }}
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
        title="Delete All Invoices"
        size="md"
      >
        <p className="mb-4 text-black">This will permanently delete all invoices. This action is irreversible. Do you want to proceed?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmDeleteAllOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              setDeleteLoading(true);
              try {
                for (const invoice of invoices) {
                  await invoices_api.deleteInvoice(invoice.id);
                }
                setInvoices([]);
                setIsConfirmDeleteAllOpen(false);
              } catch (err) {
                setError(err.message || 'Failed to delete all invoices');
              } finally {
                setDeleteLoading(false);
              }
            }}
            disabled={deleteLoading || invoices.length === 0}
          >
            {deleteLoading ? 'Deleting...' : 'Delete All'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
