'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

// Dummy data
const DUMMY_PATIENTS = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    gender: 'M',
    birth_date: '1990-05-15',
    phone: '123-456-7890',
    email: 'john.doe@example.com',
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    gender: 'F',
    birth_date: '1985-08-22',
    phone: '098-765-4321',
    email: 'jane.smith@example.com',
  },
  {
    id: 3,
    first_name: 'Bob',
    last_name: 'Johnson',
    gender: 'M',
    birth_date: '1978-12-10',
    phone: '555-123-4567',
    email: 'bob.johnson@example.com',
  },
];

export default function Patients() {
  const router = useRouter();
  const [patients, setPatients] = useState(DUMMY_PATIENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPatient = {
      id: patients.length + 1,
      ...formData,
    };
    setPatients([...patients, newPatient]);
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
    { header: 'Gender', accessor: 'gender' },
    { header: 'Birth Date', accessor: 'birth_date' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Email', accessor: 'email' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar title="Patients" />
      
      <div className="p-8">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              + Add Patient
            </Button>
          </div>
          
          {filteredPatients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No patients found.</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical History
            </label>
            <textarea
              name="medical_history"
              value={formData.medical_history}
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
              Create Patient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}