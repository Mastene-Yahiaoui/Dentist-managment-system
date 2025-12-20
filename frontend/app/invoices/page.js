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

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
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

  const filteredInvoices = filterStatus === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === filterStatus);

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
      
      <div className="p-8">
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
          
          {filteredInvoices.length === 0 && !fetchError ? (
            <p className="text-gray-500 text-center py-8">No invoices found.</p>
          ) : (
            <Table columns={columns} data={filteredInvoices} />
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
    </div>
  );
}
