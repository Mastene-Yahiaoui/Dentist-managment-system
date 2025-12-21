'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../lib/api';
import { xrays_api } from '../../lib/api/xrays';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';

export default function PatientDetail() {
  const params = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [xrays, setXrays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  // X-ray upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadDateTaken, setUploadDateTaken] = useState('');
  const fileInputRef = useRef(null);
  
  // Preview modal state
  const [previewImage, setPreviewImage] = useState(null);
  
  // Delete confirmation state
  const [deleteXrayId, setDeleteXrayId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!params.id) return;
      
      try {
        setFetchError(null);
        const [patientData, appointmentsData, treatmentsData, invoicesData, xraysData] = await Promise.all([
          api.getPatient(params.id),
          api.getAppointments(),
          api.getTreatments(),
          api.getInvoices(),
          xrays_api.getPatientXrays(params.id),
        ]);

        setPatient(patientData);
        // Filter by patient id - handle both string and integer comparisons
        const patientId = params.id;
        setAppointments((appointmentsData.results || []).filter(apt => 
          String(apt.patient) === String(patientId) || String(apt.patient_id) === String(patientId)
        ));
        setTreatments((treatmentsData.results || []).filter(t => 
          String(t.patient) === String(patientId) || String(t.patient_id) === String(patientId)
        ));
        setInvoices((invoicesData.results || []).filter(inv => 
          String(inv.patient) === String(patientId) || String(inv.patient_id) === String(patientId)
        ));
        // Set xrays - handle both array and object response formats
        const xrayList = xraysData.results || xraysData || [];
        setXrays(xrayList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        setFetchError(error.message || 'Failed to fetch patient data');
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [params.id]);

  const handleRetry = async () => {
    if (!params.id) return;
    
    setLoading(true);
    setFetchError(null);
    try {
      const [patientData, appointmentsData, treatmentsData, invoicesData, xraysData] = await Promise.all([
        api.getPatient(params.id),
        api.getAppointments(),
        api.getTreatments(),
        api.getInvoices(),
        xrays_api.getPatientXrays(params.id),
      ]);

      setPatient(patientData);
      const patientId = params.id;
      setAppointments((appointmentsData.results || []).filter(apt => 
        String(apt.patient) === String(patientId) || String(apt.patient_id) === String(patientId)
      ));
      setTreatments((treatmentsData.results || []).filter(t => 
        String(t.patient) === String(patientId) || String(t.patient_id) === String(patientId)
      ));
      setInvoices((invoicesData.results || []).filter(inv => 
        String(inv.patient) === String(patientId) || String(inv.patient_id) === String(patientId)
      ));
      setXrays(xraysData.results || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setFetchError(error.message || 'Failed to fetch patient data');
      setLoading(false);
    }
  };

  // X-ray upload handlers
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const metadata = {};
      if (uploadDescription.trim()) {
        metadata.description = uploadDescription.trim();
      }
      if (uploadDateTaken) {
        metadata.date_taken = uploadDateTaken;
      }
      
      const newXray = await xrays_api.uploadXray(params.id, file, metadata);
      setXrays(prev => [newXray, ...prev]);
      
      // Reset form
      setShowUploadForm(false);
      setUploadDescription('');
      setUploadDateTaken('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading X-ray:', error);
      setUploadError(error.message || 'Failed to upload X-ray');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteXray = async () => {
    if (!deleteXrayId) return;
    
    setIsDeleting(true);
    try {
      await xrays_api.deleteXray(deleteXrayId);
      setXrays(prev => prev.filter(x => x.id !== deleteXrayId));
      setDeleteXrayId(null);
    } catch (error) {
      console.error('Error deleting X-ray:', error);
      alert(error.message || 'Failed to delete X-ray');
    } finally {
      setIsDeleting(false);
    }
  };

  const appointmentColumns = [
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

  const treatmentColumns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Description', accessor: 'description' },
    { header: 'Cost', render: (row) => `$${row.cost}` },
  ];

  const invoiceColumns = [
    { header: 'Date', render: (row) => row.issued_at ? new Date(row.issued_at).toLocaleDateString() : '' },
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
  ];

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Patient Details" />
        <div className="p-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen">
        <Navbar title="Patient Details" />
        <div className="p-8">
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error loading patient data</p>
            <p className="text-sm">{fetchError}</p>
            <button 
              onClick={handleRetry}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen">
        <Navbar title="Patient Details" />
        <div className="p-8">
          <p>Patient not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title={`${patient.first_name} ${patient.last_name}`} />
      
      <div className="p-8 space-y-6">
        {/* Patient Information */}
        <Card title="Patient Information">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-700">Full Name</p>
              <p className="font-medium text-black">{patient.first_name} {patient.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Gender</p>
              <p className="font-medium text-black">{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Birth Date</p>
              <p className="font-medium text-black">{patient.birth_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Phone</p>
              <p className="font-medium text-black">{patient.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Email</p>
              <p className="font-medium text-black">{patient.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Address</p>
              <p className="font-medium text-black">{patient.address || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-700">Medical History</p>
              <p className="font-medium text-black">{patient.medical_history || 'N/A'}</p>
            </div>
          </div>
        </Card>

        {/* Appointments */}
        <Card title="Appointments">
          {appointments.length === 0 ? (
            <p className="text-black text-center py-4">No appointments found.</p>
          ) : (
            <Table columns={appointmentColumns} data={appointments} />
          )}
        </Card>

        {/* Past Treatments */}
        <Card title="Past Treatments">
          {treatments.length === 0 ? (
            <p className="text-black text-center py-4">No treatments found.</p>
          ) : (
            <Table columns={treatmentColumns} data={treatments} />
          )}
        </Card>

        {/* Invoices */}
        <Card title="Invoices">
          {invoices.length === 0 ? (
            <p className="text-black text-center py-4">No invoices found.</p>
          ) : (
            <Table columns={invoiceColumns} data={invoices} />
          )}
        </Card>

        {/* X-Rays / Images */}
        <Card title="Images / X-Rays">
          <div className="space-y-4">
            {/* Upload Section */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                {xrays.length} image{xrays.length !== 1 ? 's' : ''} uploaded
              </p>
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Upload Image
              </button>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="e.g., Panoramic X-ray, Left molar scan..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Taken (optional)
                  </label>
                  <input
                    type="date"
                    value={uploadDateTaken}
                    onChange={(e) => setUploadDateTaken(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Image File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPEG, PNG, GIF, WEBP, BMP, TIFF (max 10MB)
                  </p>
                </div>
                {isUploading && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Uploading...</span>
                  </div>
                )}
                {uploadError && (
                  <p className="text-red-600 text-sm">{uploadError}</p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowUploadForm(false);
                      setUploadDescription('');
                      setUploadDateTaken('');
                      setUploadError(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Image Gallery */}
            {xrays.length === 0 ? (
              <p className="text-black text-center py-4">No images uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {xrays.map((xray) => {
                  // Get the best available URL - prefer signed_url, fallback to image_url
                  const imageUrl = xray.signed_url || xray.image_url || '';
                  
                  return (
                    <div
                      key={xray.id}
                      className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white cursor-pointer"
                      onClick={() => setPreviewImage(xray)}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-gray-100 overflow-hidden relative z-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={xray.image_name || 'X-ray image'}
                            className="w-full h-full object-cover block"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
                            No image
                          </div>
                        )}
                      </div>
                      
                      {/* Overlay with info on hover only */}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <p className="text-white text-xs truncate">
                          {xray.description || xray.image_name || 'Unnamed'}
                        </p>
                        {xray.date_taken && (
                          <p className="text-gray-300 text-xs">{xray.date_taken}</p>
                        )}
                      </div>
                      
                      {/* Delete button - needs pointer-events-auto to be clickable */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteXrayId(xray.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                        title="Delete image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Image Preview Modal */}
        {previewImage && (
          <Modal
            isOpen={true}
            onClose={() => setPreviewImage(null)}
            title={previewImage.description || previewImage.image_name || 'Image Preview'}
            size="lg"
          >
            <div className="space-y-4">
              <div className="flex justify-center bg-gray-100 rounded-lg p-2 min-h-[200px]">
                <img
                  src={previewImage.signed_url || previewImage.image_url || ''}
                  alt={previewImage.image_name || 'X-ray image'}
                  className="max-w-full max-h-[60vh] object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">File Name</p>
                  <p className="text-black font-medium">{previewImage.image_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date Taken</p>
                  <p className="text-black font-medium">{previewImage.date_taken || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Description</p>
                  <p className="text-black font-medium">{previewImage.description || 'N/A'}</p>
                </div>
                {previewImage.image_type && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Image Type</p>
                    <p className="text-black font-medium">{previewImage.image_type}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <a
                  href={previewImage.signed_url || previewImage.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Open Full Size
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteXrayId !== null}
          onClose={() => setDeleteXrayId(null)}
          title="Delete Image"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteXrayId(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteXray}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
