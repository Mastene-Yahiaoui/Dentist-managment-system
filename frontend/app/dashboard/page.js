'use client';

import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Table from '../components/Table';
import { patients_api, appointments_api, invoices_api } from '../lib/api'; 


export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    totalRevenue: 0,
    unpaidInvoices: 0,
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const[loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => { 
    const fetchData = async () => {
      try {
        setFetchError(null);
        const [patientsRes, appointmentsRes, invoicesRes] = await Promise.all([
          patients_api.getPatients(),
          appointments_api.getAppointments(),
          invoices_api.getInvoices(),

        ]);
        const today = new Date().toISOString().split('T')[0];
        const appointments= appointmentsRes.results || [];
        const invoices= invoicesRes.results || [];
        const todayAppts= appointments.filter(apt=>apt.date===today);

        const totalRevenue= invoices
          .filter(inv=>inv.status==='Paid')
          .reduce((sum, inv)=>sum + parseFloat(inv.amount||0), 0);
        
        const unpaidCount= invoices.filter(inv=>inv.status==='Unpaid').length;
        setStats({
          totalPatients: patientsRes.count || 0,
          todayAppointments: todayAppts.length,
          totalRevenue: totalRevenue.toFixed(2),
          unpaidInvoices: unpaidCount,
        });
        
        setRecentAppointments(appointments.slice(0,10));
        setLoading(false);


      }
     catch(error)
     {
      console.error('Error fetching dashboard data:', error);
      setFetchError(error.message||'Failed to load dashboard data.');
      setLoading(false);
     }
    };
    fetchData();
  }, []);

     const handleRetry = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [patientsRes, appointmentsRes, invoicesRes] = await Promise.all([
        patients_api.getPatients(),
        appointments_api.getAppointments(),
        invoices_api.getInvoices(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const appointments = appointmentsRes.results || [];
      const invoices = invoicesRes.results || [];
      const todayAppts = appointments.filter(apt => apt.date === today);
      
      const totalRevenue = invoices
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

      const unpaidCount = invoices.filter(inv => inv.status === 'Unpaid').length;

      setStats({
        totalPatients: patientsRes.count || 0,
        todayAppointments: todayAppts.length,
        totalRevenue: totalRevenue.toFixed(2),
        unpaidInvoices: unpaidCount,
      });

      setRecentAppointments(appointments.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setFetchError(error.message || 'Failed to fetch dashboard data');
      setLoading(false);
    }
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

  if(loading){
    return(
      <div className='min-h-screen'>
        <Navbar title="Dashboard" />
        <div className='p-8-center'>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <Navbar title="Dashboard" />
       <div className="p-8">
        {fetchError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error loading dashboard data</p>
            <p className="text-sm">{fetchError}</p>
            <button 
              onClick={handleRetry}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}
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
