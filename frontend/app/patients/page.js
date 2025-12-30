'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import IconButton from '../components/IconButton';

export default function Patients() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [deletePatientId, setDeletePatientId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'M',
    birth_date: '',
    phone: '',
    email: '',
    address: '',
    medical_history: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setFetchError(null);
      const data = await api.getPatients();
      setPatients(data.results || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setFetchError(error.message || 'Failed to fetch patients');
      setPatients([]);
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
      // Remove id field if present - let backend generate it
      const { id, ...patientData } = formData;
      console.log('Submitting patient data:', patientData);
      const response = await api.createPatient(patientData);
      console.log('Patient created successfully:', response);
      setIsModalOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        gender: 'M',
        birth_date: '',
        phone: '',
        email: '',
        address: '',
        medical_history: '',
      });
      fetchPatients();
    } catch (error) {
      console.error('Error creating patient:', error);
      setError(error.message || 'Failed to create patient');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (patient) => {
    // Gender is stored as 'M' or 'F' in the database
    setFormData({ ...patient });
    setEditingPatientId(patient.id);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      await api.updatePatient(editingPatientId, formData);
      setIsEditModalOpen(false);
      setEditingPatientId(null);
      setFormData({
        first_name: '',
        last_name: '',
        gender: 'M',
        birth_date: '',
        phone: '',
        email: '',
        address: '',
        medical_history: '',
      });
      fetchPatients();
    } catch (error) {
      console.error('Error updating patient:', error);
      setError(error.message || 'Failed to update patient');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (patientId) => {
    setDeletePatientId(patientId);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletePatientId) return;
    setDeleteLoading(true);
    try {
      await api.deletePatient(deletePatientId);
      setPatients(prev => prev.filter(p => p.id !== deletePatientId));
      setIsConfirmDeleteOpen(false);
      setDeletePatientId(null);
    } catch (err) {
      setError(err.message || 'Failed to delete patient');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAllClick = () => {
    setIsConfirmDeleteAllOpen(true);
  };

  const handleConfirmDeleteAll = async () => {
    setDeleteLoading(true);
    try {
      for (const patient of patients) {
        await api.deletePatient(patient.id);
      }
      setPatients([]);
      setIsConfirmDeleteAllOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to delete all patients');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRowClick = (patient) => {
    router.push(`/patients/${patient.id}`);
  };

  const filteredPatients = patients.filter(patient =>
    patient.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    { header: 'Name', render: (row) => `${row.first_name} ${row.last_name}` },
    { header: 'Gender', render: (row) => (row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : row.gender || '-') },
    { header: 'Birth Date', accessor: 'birth_date' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <IconButton
          ariaLabel="Edit patient"
          title="Edit patient"
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
          ariaLabel="Delete patient"
          title="Delete patient"
          variant="danger-ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(row.id);
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
        <Navbar title="Patients" />
        <div className="p-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title="Patients" />
      
      <div className="p-8">
        {/* Error Alert */}
        {fetchError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error loading patients</p>
            <p className="text-sm">{fetchError}</p>
            <button 
              onClick={fetchPatients}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-black">All Patients</h2>
            <div className="flex gap-3">
              <Button onClick={() => setIsModalOpen(true)}>
                + Add Patient
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600"
                onClick={handleDeleteAllClick}
                disabled={patients.length === 0 || deleteLoading}
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
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-600"
            />
          </div>
          
          {filteredPatients.length === 0 && !fetchError ? (
            <p className="text-black text-center py-8">No patients found.</p>
          ) : (
            <Table columns={columns} data={filteredPatients} onRowClick={handleRowClick} />
          )}
        </Card>
      </div>

      {/* Add Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Patient"
        size="lg"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <Input
              label="Birth Date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Medical History
            </label>
            <textarea
              name="medical_history"
              value={formData.medical_history}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-600"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? 'Creating...' : 'Create Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPatientId(null);
          setFormData({
            first_name: '',
            last_name: '',
            gender: 'M',
            birth_date: '',
            phone: '',
            email: '',
            address: '',
            medical_history: '',
          });
        }}
        title="Edit Patient"
        size="lg"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleEditSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <Input
              label="Birth Date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Medical History
            </label>
            <textarea
              name="medical_history"
              value={formData.medical_history}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-600"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setEditingPatientId(null);
              setFormData({
                first_name: '',
                last_name: '',
                gender: 'M',
                birth_date: '',
                phone: '',
                email: '',
                address: '',
                medical_history: '',
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

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false);
          setDeletePatientId(null);
        }}
        title="Delete Patient"
        size="sm"
      >
        <p className="mb-4 text-black">Are you sure you want to delete this patient? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => {
            setIsConfirmDeleteOpen(false);
            setDeletePatientId(null);
          }} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>

      {/* Confirm Delete All Modal */}
      <Modal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        title="Delete All Patients"
        size="sm"
      >
        <div className="mb-4">
          <p className="mb-3 text-black font-semibold">Are you sure you want to delete all patients?</p>
          <p className="text-black">This action is irreversible and will permanently delete all {patients.length} patient record(s) from the system.</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmDeleteAllOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant="danger"
            onClick={handleConfirmDeleteAll}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete All'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
