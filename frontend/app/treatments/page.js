'use client';

import { use, useEffect, useState } from 'react';
import { truncateText } from '../lib/utils';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { patients_api } from '../lib/api';  
import { appointments_api } from '../lib/api';
import { treatments_api } from '../lib/api';
import IconButton from '../components/IconButton';
import SearchableSelect from '../components/SearchableSelect';

export default function Treatments() {
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const[submitLoading, setSubmitLoading]=useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingTreatmentId, setEditingTreatmentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_id: '',
    description: '',
    cost: '',
    date: '',
  });
  
  useEffect(() => {
  fetchData();
  },[]);

  const fetchData= async()=>
  {
     try {
      setFetchError(null);
      const [treatmentsData, patientsData, appointmentsData] = await Promise.all([
        treatments_api.getTreatments(),
        patients_api.getPatients(),
        appointments_api.getAppointments(),
      ]);
      setTreatments(treatmentsData.results || []);
      setPatients(patientsData.results || []);
      setAppointments(appointmentsData.results || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setFetchError(error.message || 'Failed to fetch data');
      setTreatments([]);
      setPatients([]);
      setAppointments([]);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit =async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

   setError(null);
    try {
      const submitData = {
        ...formData,
        appointment_id: formData.appointment_id || null,
      };
      await treatments_api.createTreatment(submitData);
      setIsModalOpen(false);
      setFormData({
        patient_id: '',
        appointment_id: '',
        description: '',
        cost: '',
        date: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating treatment:', error);
      setError(error.message || 'Failed to create treatment');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (treatment) => {
    setFormData({
      patient_id: treatment.patient_id,
      appointment_id: treatment.appointment_id || '',
      description: treatment.description,
      cost: treatment.cost,
      date: treatment.date,
    });
    setEditingTreatmentId(treatment.id);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      const submitData = {
        ...formData,
        appointment_id: formData.appointment_id || null,
      };
      await treatments_api.updateTreatment(editingTreatmentId, submitData);
      setIsEditModalOpen(false);
      setEditingTreatmentId(null);
      setFormData({
        patient_id: '',
        appointment_id: '',
        description: '',
        cost: '',
        date: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error updating treatment:', error);
      setError(error.message || 'Failed to update treatment');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { header: 'Patient', accessor: 'patient_name' },
    { header: 'Date', accessor: 'date' },
    { header: 'Description', render: (row) => truncateText(row.description, 50) },
    { header: 'Cost', render: (row) => `DZD ${parseFloat(row.cost).toFixed(2)}` },
    { header: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <IconButton
          ariaLabel="Edit treatment"
          title="Edit treatment"
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
          ariaLabel="Delete treatment"
          title="Delete treatment"
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

  const treatmentsWithPatientNames = treatments.map(treatment => {
    const patient = patients.find(p => p.id === treatment.patient_id);
    return {
      ...treatment,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
    };
  });

  // Filter treatments based on search term
  const filteredTreatments = treatmentsWithPatientNames.filter(treatment =>
    treatment.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Treatments" />
        <div className="p-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <Navbar title="Treatments" />
      
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {fetchError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error loading treatments</p>
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-black">All Treatments</h2>
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                  + Add Treatment
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 w-full sm:w-auto"
                  onClick={() => setIsConfirmDeleteAllOpen(true)}
                  disabled={treatments.length === 0}
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
          
          {treatments.length === 0 ? (
            <p className="text-black text-center py-8">No treatments found.</p>
          ) : (
            <Table columns={columns} data={filteredTreatments} />
          )}
        </Card>
      </div>

      {/* Add Treatment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Treatment"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment (Optional)
            </label>
            <select
              name="appointment_id"
              value={formData.appointment_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              disabled={!formData.patient_id}
            >
              <option value="">No appointment</option>
              {appointments
                .filter(apt => apt.patient_id === formData.patient_id)
                .map(apt => (
                <option key={apt.id} value={apt.id}>
                  {apt.patient_name} - {apt.date} {apt.time}
                </option>
              ))}
            </select>
            {!formData.patient_id && (
              <p className="text-sm text-gray-500 mt-1">Select a patient first</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          
          <Input
            label="Cost"
            name="cost"
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? 'Creating...' : 'Create Treatment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Treatment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTreatmentId(null);
          setFormData({
            patient_id: '',
            appointment_id: '',
            description: '',
            cost: '',
            date: '',
          });
        }}
        title="Edit Treatment"
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
              Appointment (Optional)
            </label>
            <select
              name="appointment_id"
              value={formData.appointment_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              disabled={!formData.patient_id}
            >
              <option value="">No appointment</option>
              {appointments
                .filter(apt => apt.patient_id === formData.patient_id)
                .map(apt => (
                <option key={apt.id} value={apt.id}>
                  {apt.patient_name} - {apt.date} {apt.time}
                </option>
              ))}
            </select>
            {!formData.patient_id && (
              <p className="text-sm text-gray-500 mt-1">Select a patient first</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          
          <Input
            label="Cost"
            name="cost"
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setEditingTreatmentId(null);
              setFormData({
                patient_id: '',
                appointment_id: '',
                description: '',
                cost: '',
                date: '',
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
        title="Delete Treatment"
        size="sm"
      >
        <p className="mb-4 text-black">Are you sure you want to delete this treatment? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirmDeleteId) return;
              setDeleteLoading(true);
              try {
                await treatments_api.deleteTreatment(confirmDeleteId);
                setTreatments(prev => prev.filter(t => t.id !== confirmDeleteId));
                setIsConfirmDeleteOpen(false);
              } catch (err) {
                setError(err.message || 'Failed to delete treatment');
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
        title="Delete All Treatments"
        size="md"
      >
        <p className="mb-4 text-black">This will permanently delete all treatments. This action is irreversible. Do you want to proceed?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmDeleteAllOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              setDeleteLoading(true);
              try {
                for (const treatment of treatments) {
                  await treatments_api.deleteTreatment(treatment.id);
                }
                setTreatments([]);
                setIsConfirmDeleteAllOpen(false);
              } catch (err) {
                setError(err.message || 'Failed to delete all treatments');
              } finally {
                setDeleteLoading(false);
              }
            }}
            disabled={deleteLoading || treatments.length === 0}
          >
            {deleteLoading ? 'Deleting...' : 'Delete All'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}