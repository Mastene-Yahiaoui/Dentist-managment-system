'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';

export default function Dashboard() {
  const [stats] = useState({
    totalPatients: 248,
    todayAppointments: 12,
    totalRevenue: 15840.50,
    unpaidInvoices: 8,
  });

  const [recentAppointments] = useState([
    {
      id: 1,
      patient_name: 'John Smith',
      date: '2025-11-28',
      time: '09:00 AM',
      status: 'Confirmed',
      reason: 'Cleaning'
    },
    {
      id: 2,
      patient_name: 'Sarah Johnson',
      date: '2025-11-28',
      time: '10:30 AM',
      status: 'Confirmed',
      reason: 'Root Canal'
    },
    {
      id: 3,
      patient_name: 'Michael Davis',
      date: '2025-11-28',
      time: '02:00 PM',
      status: 'Pending',
      reason: 'Checkup'
    },
    {
      id: 4,
      patient_name: 'Emma Wilson',
      date: '2025-11-27',
      time: '11:00 AM',
      status: 'Completed',
      reason: 'Filling'
    },
    {
      id: 5,
      patient_name: 'Robert Brown',
      date: '2025-11-27',
      time: '03:30 PM',
      status: 'Cancelled',
      reason: 'Extraction'
    },
  ]);

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
      <Navbar title="Dashboard" />
      
      <div className="p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalPatients}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today&apos;s Appointments</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.todayAppointments}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">${stats.totalRevenue}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unpaid Invoices</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.unpaidInvoices}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Appointments */}
        <Card title="Recent Appointments">
          {recentAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent appointments.</p>
          ) : (
            <Table columns={columns} data={recentAppointments} />
          )}
        </Card>
      </div>
    </div>
  );
}
