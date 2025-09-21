import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken, itemsAPI } from '../services/api';

export default function ScanLanding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      navigate('/login');
      return;
    }

    fetchItemDetails();
  }, [token]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getByToken(token);
      
      if (response.data.success) {
        setItem(response.data.item);
      } else {
        setError(response.data.message || 'Item not found');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch item details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      const response = await itemsAPI.scan(token, 'Mobile scan');
      
      if (response.data.success) {
        alert('Item scanned successfully!');
      } else {
        alert(response.data.message || 'Failed to scan item');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to scan item');
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Item Details</h1>
              <p className="text-gray-600">QR Code scanned successfully</p>
            </div>

            {item && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Type</label>
                    <p className="mt-1 text-sm text-gray-900">{item.itemType}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vendor</label>
                    <p className="mt-1 text-sm text-gray-900">{item.vendor || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lot Number</label>
                    <p className="mt-1 text-sm text-gray-900">{item.lotNumber || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Supply</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {item.dateOfSupply ? new Date(item.dateOfSupply).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warranty</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {item.warrantyMonths ? `${item.warrantyMonths} months` : 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created By</label>
                    <p className="mt-1 text-sm text-gray-900">{item.createdBy?.username || 'Unknown'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {item.geoLat && item.geoLng ? (
                        <span>
                          {item.geoLat.toFixed(6)}, {item.geoLng.toFixed(6)}
                        </span>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {item.dynamicData && Object.keys(item.dynamicData).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Additional Data</label>
                    <div className="mt-1 bg-gray-50 rounded-md p-4">
                      <pre className="text-sm text-gray-900">
                        {JSON.stringify(item.dynamicData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {scanning ? 'Scanning...' : 'Log Scan Event'}
                  </button>
                  
                  <button
                    onClick={() => navigate('/worker')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}