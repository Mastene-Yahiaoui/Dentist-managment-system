'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import IconButton from '../components/IconButton';
import SearchableSelect from '../components/SearchableSelect';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    date: '',
    time: '',
    status: 'Pending',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetchError(null);
      const [appointmentsData, patientsData] = await Promise.all([
        api.getAppointments(),
        api.getPatients(),
      ]);
      setAppointments(appointmentsData.results || []);
      setPatients(patientsData.results || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setFetchError(error.message || 'Failed to fetch data');
      setAppointments([]);
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

      const response = await api.createAppointment(formData);

      setIsModalOpen(false);
      setFormData({
        patient_id: '',
        date: '',
        time: '',
        status: 'Pending',
        reason: '',
        notes: '',
      });
      fetchData();
    } catch (error) {
      let errorMessage = 'Failed to create appointment';
      
      if (error.message) {
        const jsonMatch = error.message.match(/- ({.*})/);
        if (jsonMatch) {
          try {
            const errorData = JSON.parse(jsonMatch[1]);
            if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
              errorMessage = errorData.non_field_errors[0];
            }
          } catch {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (appointment) => {
    setFormData({
      patient_id: appointment.patient_id,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes || '',
    });
    setEditingAppointmentId(appointment.id);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      await api.updateAppointment(editingAppointmentId, formData);
      setIsEditModalOpen(false);
      setEditingAppointmentId(null);
      setFormData({
        patient_id: '',
        date: '',
        time: '',
        status: 'Pending',
        reason: '',
        notes: '',
      });
      fetchData();
    } catch (error) {
      // Extract error message from the error response
      let errorMessage = 'Failed to update appointment';
      
      if (error.message) {
        // Check if message contains JSON error details (format: "Error message: 400 - {...}")
        const jsonMatch = error.message.match(/- ({.*})/);
        if (jsonMatch) {
          try {
            const errorData = JSON.parse(jsonMatch[1]);
            if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
              errorMessage = errorData.non_field_errors[0];
            }
          } catch {
            // If parsing fails, use the original message
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { header: 'Patient', render: (row) => {
        const p = patients.find((x) => x.id === row.patient_id);
        return p ? `${p.first_name} ${p.last_name}` : '-';
      } },
    { header: 'Date', accessor: 'date' },
    { header: 'Time', accessor: 'time' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
          row.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          row.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <IconButton
          ariaLabel="Edit appointment"
          title="Edit appointment"
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
          ariaLabel="Delete appointment"
          title="Delete appointment"
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

  // Filter appointments based on search term and date
  const appointmentsWithPatientNames = appointments.map(apt => {
    const patient = patients.find(p => p.id === apt.patient_id);
    return {
      ...apt,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
    };
  });

  const filteredAppointments = appointmentsWithPatientNames.filter(apt => {
    const matchesSearch = apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate === '' || apt.date === filterDate;
    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Appointments" />
        <div className="p-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title="Appointments" />
      
      <div className="p-8">
        {/* Error Alert */}
        {fetchError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error loading appointments</p>
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
            <h2 className="text-xl font-semibold text-black">All Appointments</h2>
            <div className="flex gap-3">
              <Button onClick={() => setIsModalOpen(true)}>
                + Add Appointment
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600"
                onClick={() => setIsConfirmDeleteAllOpen(true)}
                disabled={appointments.length === 0}
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

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            {filterDate && (
              <Button
                variant="outline"
                onClick={() => setFilterDate('')}
                className="px-3 py-2 text-sm"
              >
                Clear Date
              </Button>
            )}
          </div>
          
          {filteredAppointments.length === 0 && !fetchError ? (
            <p className="text-black text-center py-8">No appointments found.</p>
          ) : (
            <Table columns={columns} data={filteredAppointments} />
          )}
        </Card>
      </div>

      {/* Add Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Appointment"
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
          
          <Input
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Time"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleInputChange}
            required
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <Input
            label="Reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            required
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
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
              {submitLoading ? 'Creating...' : 'Create Appointment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAppointmentId(null);
          setFormData({
            patient_id: '',
            date: '',
            time: '',
            status: 'Pending',
            reason: '',
            notes: '',
          });
        }}
        title="Edit Appointment"
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
          
          <Input
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Time"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleInputChange}
            required
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <Input
            label="Reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            required
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-600"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setEditingAppointmentId(null);
              setFormData({
                patient_id: '',
                date: '',
                time: '',
                status: 'Pending',
                reason: '',
                notes: '',
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
        title="Delete Appointment"
        size="sm"
      >
        <p className="mb-4 text-black">Are you sure you want to delete this appointment? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirmDeleteId) return;
              setDeleteLoading(true);
              try {
                await api.deleteAppointment(confirmDeleteId);
                setAppointments(prev => prev.filter(a => a.id !== confirmDeleteId));
                setIsConfirmDeleteOpen(false);
              } catch (err) {
                setError(err.message || 'Failed to delete appointment');
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
        title="Delete All Appointments"
        size="md"
      >
        <p className="mb-4 text-black">This will permanently delete all appointments. This action is irreversible. Do you want to proceed?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmDeleteAllOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              setDeleteLoading(true);
              try {
                // delete sequentially to avoid overwhelming backend
                for (const appt of appointments) {
                  await api.deleteAppointment(appt.id);
                }
                setAppointments([]);
                setIsConfirmDeleteAllOpen(false);
              } catch (err) {
                setError(err.message || 'Failed to delete all appointments');
              } finally {
                setDeleteLoading(false);
              }
            }}
            disabled={deleteLoading || appointments.length === 0}
          >
            {deleteLoading ? 'Deleting...' : 'Delete All'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
