'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

// Dummy data
const DUMMY_APPOINTMENTS = [
  {
    id: 1,
    patient_name: 'John Doe',
    patient_id: 1,
    date: '2025-12-05',
    time: '10:00',
    status: 'Confirmed',
    reason: 'Regular checkup',
    notes: 'Patient has no allergies',
  },
  {
    id: 2,
    patient_name: 'Jane Smith',
    patient_id: 2,
    date: '2025-12-06',
    time: '14:30',
    status: 'Pending',
    reason: 'Tooth pain',
    notes: 'Urgent appointment requested',
  },
  {
    id: 3,
    patient_name: 'Bob Johnson',
    patient_id: 3,
    date: '2025-12-04',
    time: '09:00',
    status: 'Completed',
    reason: 'Teeth cleaning',
    notes: 'Follow-up in 6 months',
  },
];

const DUMMY_PATIENTS = [
  { id: 1, first_name: 'John', last_name: 'Doe' },
  { id: 2, first_name: 'Jane', last_name: 'Smith' },
  { id: 3, first_name: 'Bob', last_name: 'Johnson' },
];

export default function Appointments() {
  const [appointments, setAppointments] = useState(DUMMY_APPOINTMENTS);
  const [patients] = useState(DUMMY_PATIENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    date: '',
    time: '',
    status: 'Pending',
    reason: '',
    notes: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedPatient = patients.find(p => p.id === parseInt(formData.patient_id));
    const newAppointment = {
      id: appointments.length + 1,
      patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
      ...formData,
    };
    setAppointments([...appointments, newAppointment]);
    setIsModalOpen(false);
    setFormData({
      patient_id: '',
      date: '',
      time: '',
      status: 'Pending',
      reason: '',
      notes: '',
    });
  };

  const columns = [
    { header: 'Patient', accessor: 'patient_name' },
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
  ];

  return (
    <div className="min-h-screen">
      <Navbar title="Appointments" />
      
      <div className="p-8">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">All Appointments</h2>
            <Button onClick={() => setIsModalOpen(true)}>
              + Add Appointment
            </Button>
          </div>
          
          {appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No appointments found.</p>
          ) : (
            <Table columns={columns} data={appointments} />
          )}
        </Card>
      </div>

      {/* Add Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Appointment"
      >
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Appointment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}