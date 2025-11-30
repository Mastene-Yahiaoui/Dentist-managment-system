'use client';

import { useState } from 'react';
import { truncateText } from '../lib/utils';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

// Dummy data
const DUMMY_TREATMENTS = [
  {
    id: 1,
    patient_name: 'John Doe',
    patient_id: 1,
    appointment_id: 1,
    date: '2025-12-05',
    description: 'Root canal treatment on upper right molar. Patient responded well to local anesthesia.',
    cost: 450.00,
  },
  {
    id: 2,
    patient_name: 'Jane Smith',
    patient_id: 2,
    appointment_id: 2,
    date: '2025-12-06',
    description: 'Dental filling for cavity on lower left premolar. Used composite resin material.',
    cost: 180.00,
  },
  {
    id: 3,
    patient_name: 'Bob Johnson',
    patient_id: 3,
    appointment_id: 3,
    date: '2025-12-04',
    description: 'Professional teeth cleaning and scaling. Removed tartar buildup and polished teeth.',
    cost: 120.00,
  },
];

const DUMMY_PATIENTS = [
  { id: 1, first_name: 'John', last_name: 'Doe' },
  { id: 2, first_name: 'Jane', last_name: 'Smith' },
  { id: 3, first_name: 'Bob', last_name: 'Johnson' },
];

const DUMMY_APPOINTMENTS = [
  { id: 1, patient_name: 'John Doe', date: '2025-12-05', time: '10:00' },
  { id: 2, patient_name: 'Jane Smith', date: '2025-12-06', time: '14:30' },
  { id: 3, patient_name: 'Bob Johnson', date: '2025-12-04', time: '09:00' },
];

export default function Treatments() {
  const [treatments, setTreatments] = useState(DUMMY_TREATMENTS);
  const [patients] = useState(DUMMY_PATIENTS);
  const [appointments] = useState(DUMMY_APPOINTMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_id: '',
    description: '',
    cost: '',
    date: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedPatient = patients.find(p => p.id === parseInt(formData.patient_id));
    const newTreatment = {
      id: treatments.length + 1,
      patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
      ...formData,
      cost: parseFloat(formData.cost),
    };
    setTreatments([...treatments, newTreatment]);
    setIsModalOpen(false);
    setFormData({
      patient_id: '',
      appointment_id: '',
      description: '',
      cost: '',
      date: '',
    });
  };

  const columns = [
    { header: 'Patient', accessor: 'patient_name' },
    { header: 'Date', accessor: 'date' },
    { header: 'Description', render: (row) => truncateText(row.description, 50) },
    { header: 'Cost', render: (row) => `$${row.cost.toFixed(2)}` },
  ];

  return (
    <div className="min-h-screen">
      <Navbar title="Treatments" />
      
      <div className="p-8">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">All Treatments</h2>
            <Button onClick={() => setIsModalOpen(true)}>
              + Add Treatment
            </Button>
          </div>
          
          {treatments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No treatments found.</p>
          ) : (
            <Table columns={columns} data={treatments} />
          )}
        </Card>
      </div>

      {/* Add Treatment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Treatment"
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
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment (Optional)
            </label>
            <select
              name="appointment_id"
              value={formData.appointment_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No appointment</option>
              {appointments.map(apt => (
                <option key={apt.id} value={apt.id}>
                  {apt.patient_name} - {apt.date} {apt.time}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Treatment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}