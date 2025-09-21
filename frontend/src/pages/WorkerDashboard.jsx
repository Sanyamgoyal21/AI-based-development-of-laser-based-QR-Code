import React, { useState } from 'react';
import { itemsAPI } from '../services/api';

export default function WorkerDashboard() {
  const [formData, setFormData] = useState({
    itemType: '',
    vendor: '',
    lotNumber: '',
    dateOfSupply: '',
    warrantyMonths: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrData, setQrData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get current location
      navigator.geolocation.getCurrentPosition(async (position) => {
        const payload = {
          itemType: formData.itemType,
          vendor: formData.vendor,
          lotNumber: formData.lotNumber,
          dateOfSupply: formData.dateOfSupply || undefined,
          warrantyMonths: formData.warrantyMonths ? parseInt(formData.warrantyMonths) : undefined,
          geoLat: position.coords.latitude,
          geoLng: position.coords.longitude,
          dynamicData: {}
        };

        const response = await itemsAPI.create(payload);
        
        if (response.data.success) {
          setQrData(response.data);
          setSuccess('Item created successfully!');
          setFormData({
            itemType: '',
            vendor: '',
            lotNumber: '',
            dateOfSupply: '',
            warrantyMonths: ''
          });
        } else {
          setError(response.data.message || 'Failed to create item');
        }
      }, (error) => {
        setError('Please enable location access to create items');
        setLoading(false);
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Item</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="itemType" className="block text-sm font-medium text-gray-700">
                    Item Type *
                  </label>
                  <input
                    type="text"
                    name="itemType"
                    id="itemType"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter item type"
                    value={formData.itemType}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
                    Vendor
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    id="vendor"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter vendor name"
                    value={formData.vendor}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="lotNumber" className="block text-sm font-medium text-gray-700">
                    Lot Number
                  </label>
                  <input
                    type="text"
                    name="lotNumber"
                    id="lotNumber"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter lot number"
                    value={formData.lotNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="dateOfSupply" className="block text-sm font-medium text-gray-700">
                    Date of Supply
                  </label>
                  <input
                    type="date"
                    name="dateOfSupply"
                    id="dateOfSupply"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.dateOfSupply}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="warrantyMonths" className="block text-sm font-medium text-gray-700">
                    Warranty (Months)
                  </label>
                  <input
                    type="number"
                    name="warrantyMonths"
                    id="warrantyMonths"
                    min="0"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter warranty in months"
                    value={formData.warrantyMonths}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-red-600 text-sm">{error}</div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="text-green-600 text-sm">{success}</div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Creating Item...' : 'Create Item & Generate QR Code'}
                </button>
              </div>
            </form>

            {qrData && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generated QR Code</h3>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="mb-4">
                    <img 
                      src={`http://localhost:8000/qrcodes/${qrData.qrCode.filename}`} 
                      alt="QR Code" 
                      className="mx-auto"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Token:</strong> {qrData.item.uuidToken}</p>
                    <p><strong>Item Type:</strong> {qrData.item.itemType}</p>
                    <p><strong>Scan URL:</strong> <a href={qrData.qrCode.url} className="text-indigo-600 hover:text-indigo-500" target="_blank" rel="noopener noreferrer">{qrData.qrCode.url}</a></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

