'use client';

import { use, useEffect, useState } from 'react';
import { truncateText } from '../lib/utils';
import {patients_api, invoices_api, treatments_api} from '../lib/api';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import IconButton from '../components/IconButton';
import SearchableSelect from '../components/SearchableSelect';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
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

  useEffect(()=>{
    fetchData();
  }, []);


  const fetchData =async ()=>{
    try{
      setFetchError(null);
      const [invoicesData, patientsData, treatmentsData] = await Promise.all([
        invoices_api.getInvoices(),
        patients_api.getPatients(),
        treatments_api.getTreatments(),
      ]);
      setInvoices(invoicesData.results || []);
      setPatients(patientsData.results || []);
      setTreatments(treatmentsData.results || []);
      setLoading(false);
    }
    catch(error){
      console.error('Error fetching data:', error);
      setFetchError(error.message || 'Error fetching data');
      setInvoices([]);
      setPatients([]);
      setTreatments([]);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
       await invoices_api.createInvoice(formData);
       setIsModalOpen(false);
       setFormData({ patient_id: '', treatment_id: '', amount: '', status: 'Unpaid' });
       fetchData();
    }

     catch (err) {
      console.error('Error creating invoice', err);
      setError(err.message ||'Failed to create invoice');
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

   if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Invoices" />
        <div className="p-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen">
      <Navbar title="Invoices" />
      
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {fetchError&&(
           <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error loading invoices</p>
            <p className="text-sm">{fetchError}</p>
            <button 
              onClick={fetchData}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        <Card>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  filterStatus === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('Paid')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  filterStatus === 'Paid' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setFilterStatus('Unpaid')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  filterStatus === 'Unpaid' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Unpaid
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <input
                type="text"
                placeholder="Search by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                  + Add Invoice
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 w-full sm:w-auto"
                  onClick={() => setIsConfirmDeleteAllOpen(true)}
                  disabled={invoices.length === 0}
                >
                  <span className="inline-flex items-center justify-center gap-2 w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
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
          <SearchableSelect
            label="Patient"
            name="patient_id"
            value={formData.patient_id}
            onChange={handleInputChange}
            required
            options={patients}
            getOptionLabel={(patient) => `${patient.first_name} ${patient.last_name}`}
            getOptionValue={(patient) => patient.id}
            placeholder="Search patient by name..."
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Treatment <span className="text-red-500">*</span>
            </label>
            <select
              name="treatment_id"
              value={formData.treatment_id}
              onChange={handleInputChange}
              required
              disabled={!formData.patient_id}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">Select a treatment</option>
              {treatments
                .filter(treatment => treatment.patient_id === formData.patient_id)
                .map(treatment => (
                <option key={treatment.id} value={treatment.id}>
                  {truncateText(treatment.description, 40)}
                </option>
              ))}
            </select>
            {!formData.patient_id && (
              <p className="text-sm text-gray-500 mt-1">Select a patient first</p>
            )}
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
          <SearchableSelect
            label="Patient"
            name="patient_id"
            value={formData.patient_id}
            onChange={handleInputChange}
            required
            options={patients}
            getOptionLabel={(patient) => `${patient.first_name} ${patient.last_name}`}
            getOptionValue={(patient) => patient.id}
            placeholder="Search patient by name..."
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Treatment <span className="text-red-500">*</span>
            </label>
            <select
              name="treatment_id"
              value={formData.treatment_id}
              onChange={handleInputChange}
              required
              disabled={!formData.patient_id}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">Select a treatment</option>
              {treatments
                .filter(treatment => treatment.patient_id === formData.patient_id)
                .map(treatment => (
                <option key={treatment.id} value={treatment.id}>
                  {truncateText(treatment.description, 40)}
                </option>
              ))}
            </select>
            {!formData.patient_id && (
              <p className="text-sm text-gray-500 mt-1">Select a patient first</p>
            )}
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
