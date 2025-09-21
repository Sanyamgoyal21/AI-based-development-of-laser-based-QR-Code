import React, { useEffect, useState } from 'react';
import { itemsAPI, removeAuthToken } from '../services/api';

export default function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // Track active sidebar item
  const [qrFormData, setQrFormData] = useState({
    itemType: '',
    vendor: '',
    lotNumber: '',
    dateOfSupply: '',
    warrantyMonths: ''
  });
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSuccess, setQrSuccess] = useState('');
  const [qrError, setQrError] = useState('');
  const [generatedQR, setGeneratedQR] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.list({ page: 1, limit: 100 });
      
      if (response.data.success) {
        setItems(response.data.items);
      } else {
        setError(response.data.message || 'Failed to fetch items');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        removeAuthToken();
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.message || 'Failed to fetch items');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = '/login';
  };

  const handleQRFormChange = (e) => {
    const { name, value } = e.target;
    setQrFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQRGeneration = async (e) => {
    e.preventDefault();
    setQrLoading(true);
    setQrError('');
    setQrSuccess('');

    try {
      // Get current location
      navigator.geolocation.getCurrentPosition(async (position) => {
        const payload = {
          itemType: qrFormData.itemType,
          vendor: qrFormData.vendor,
          lotNumber: qrFormData.lotNumber,
          dateOfSupply: qrFormData.dateOfSupply || undefined,
          warrantyMonths: qrFormData.warrantyMonths ? parseInt(qrFormData.warrantyMonths) : undefined,
          geoLat: position.coords.latitude,
          geoLng: position.coords.longitude,
          dynamicData: {}
        };

        const response = await itemsAPI.create(payload);
        
        if (response.data.success) {
          setGeneratedQR(response.data);
          setQrSuccess('QR Code generated successfully!');
          setQrFormData({
            itemType: '',
            vendor: '',
            lotNumber: '',
            dateOfSupply: '',
            warrantyMonths: ''
          });
          // Refresh the items list
          fetchItems();
        } else {
          setQrError(response.data.message || 'Failed to generate QR code');
        }
      }, (error) => {
        setQrError('Please enable location access to generate QR codes');
        setQrLoading(false);
      });
    } catch (err) {
      setQrError(err.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            {/* Top Row - Metrics Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              {/* Total Fittings Scanned */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 shadow-lg">
                <div className="text-white">
                  <p className="text-sm font-condensed font-medium opacity-90 tracking-wide">TOTAL FITTINGS SCANNED</p>
                  <p className="text-3xl font-display font-bold tracking-tight">1,200,500</p>
                </div>
              </div>

              {/* Active Consignments */}
              <div className="bg-gray-700 rounded-lg p-6 shadow-lg">
                <div className="text-white">
                  <p className="text-sm font-condensed font-medium opacity-90 tracking-wide">ACTIVE CONSIGNMENTS</p>
                  <p className="text-3xl font-display font-bold tracking-tight">45</p>
                </div>
              </div>

              {/* Critical Faults Reported */}
              <div className="bg-gray-700 rounded-lg p-6 shadow-lg">
                <div className="text-white">
                  <p className="text-sm font-condensed font-medium opacity-90 tracking-wide">CRITICAL FAULTS REPORTED</p>
                  <p className="text-3xl font-display font-bold tracking-tight">8</p>
                </div>
              </div>

              {/* Quick Scan Button */}
              <div className="bg-blue-600 rounded-lg p-6 shadow-lg flex items-center justify-center bg-opacity-80 backdrop-blur-sm">
                <button 
                  onClick={() => setActiveTab('scan')}
                  className="flex items-center space-x-3 text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg font-condensed font-semibold tracking-wide">QUICK SCAN</span>
                </button>
              </div>
            </div>

            {/* Bottom Row - Activity Logs */}
            <div className="grid grid-cols-3 gap-6">
              {/* Front RORAR */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-condensed font-semibold text-white mb-4 tracking-wide">FRONT RORAR</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300 font-condensed">Scan: Clip #11780 (Passed) (cetisortie Clesnelatio)</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300 font-condensed">Scan: Clip #177930 (Passed) (boler bott. Ott nated | Aboswed)</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300 font-condensed">Inspection: Ped IP5S/78 (Passed) Imapesckan Aitbub Dear Derhct (Arrived)</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-300 font-condensed">Beaerstion Part 8 Aito81 Reel Ploilvaet (Reetileg (MB.sf Pond)</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-condensed font-semibold text-white mb-4 tracking-wide">RECENT ACTIVITY</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300 font-condensed">Scan: Clip #17990 (Passed) (Deripipaths trinet (Airass)</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300 font-condensed">Scan: Clip #1F5678 (Passed) (Mirer Defket (Convertta)</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300 font-condensed">Cempectiam (Pad MIT.878 (Passed) Corgrastom Alfteatn Bees (Dfiact (Arrived)</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-300 font-condensed">Scan: Clip #IV8679 (Bohut Mestapemt #IMIDE2400 (Arrived)</span>
                  </div>
                </div>
              </div>

              {/* Last 10 */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-condensed font-semibold text-white mb-4 tracking-wide">Last 10</h3>
                <div className="space-y-3">
                  <div className="text-sm text-gray-300 font-condensed">#IID28244005</div>
                  <div className="text-sm text-gray-300 font-condensed">Revan tois</div>
                  <div className="text-sm text-gray-300 font-condensed">#INO2024005</div>
                  <div className="text-sm text-gray-300 font-condensed">Sermikins</div>
                  <div className="text-sm text-gray-300 font-condensed">Cororernet NIG</div>
                </div>
              </div>
            </div>
          </>
        );

      case 'qr-generation':
        return (
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 tracking-tight">QR Code Generation</h2>
            <p className="text-gray-600 font-condensed mb-6">Generate new QR codes for railway track fittings.</p>
            
            <form onSubmit={handleQRGeneration} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="itemType" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide">
                    Item Type *
                  </label>
                  <input
                    type="text"
                    name="itemType"
                    id="itemType"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-condensed"
                    placeholder="Enter item type"
                    value={qrFormData.itemType}
                    onChange={handleQRFormChange}
                  />
                </div>

                <div>
                  <label htmlFor="vendor" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide">
                    Vendor
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    id="vendor"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-condensed"
                    placeholder="Enter vendor name"
                    value={qrFormData.vendor}
                    onChange={handleQRFormChange}
                  />
                </div>

                <div>
                  <label htmlFor="lotNumber" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide">
                    Lot Number
                  </label>
                  <input
                    type="text"
                    name="lotNumber"
                    id="lotNumber"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-condensed"
                    placeholder="Enter lot number"
                    value={qrFormData.lotNumber}
                    onChange={handleQRFormChange}
                  />
                </div>

                <div>
                  <label htmlFor="dateOfSupply" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide">
                    Date of Supply
                  </label>
                  <input
                    type="date"
                    name="dateOfSupply"
                    id="dateOfSupply"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-condensed"
                    value={qrFormData.dateOfSupply}
                    onChange={handleQRFormChange}
                  />
                </div>

                <div>
                  <label htmlFor="warrantyMonths" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide">
                    Warranty (Months)
                  </label>
                  <input
                    type="number"
                    name="warrantyMonths"
                    id="warrantyMonths"
                    min="0"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-condensed"
                    placeholder="Enter warranty in months"
                    value={qrFormData.warrantyMonths}
                    onChange={handleQRFormChange}
                  />
                </div>
              </div>

              {qrError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-red-600 text-sm font-condensed">{qrError}</div>
                </div>
              )}

              {qrSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="text-green-600 text-sm font-condensed">{qrSuccess}</div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={qrLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-condensed font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 tracking-wide"
                >
                  {qrLoading ? 'Generating QR Code...' : 'Generate QR Code'}
                </button>
              </div>
            </form>

            {generatedQR && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-condensed font-medium text-gray-900 mb-4 tracking-wide">Generated QR Code</h3>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="mb-4">
                    <img 
                      src={`http://localhost:8000/qrcodes/${generatedQR.qrCode.filename}`} 
                      alt="QR Code" 
                      className="mx-auto"
                    />
                  </div>
                  <div className="text-sm text-gray-600 font-condensed">
                    <p><strong>Token:</strong> {generatedQR.item.uuidToken}</p>
                    <p><strong>Item Type:</strong> {generatedQR.item.itemType}</p>
                    <p><strong>Scan URL:</strong> <a href={generatedQR.qrCode.url} className="text-indigo-600 hover:text-indigo-500" target="_blank" rel="noopener noreferrer">{generatedQR.qrCode.url}</a></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'scan':
        return (
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 tracking-tight">QR Code Scanner</h2>
            <p className="text-gray-600 font-condensed mb-6">Scan QR codes to view item details and log scan events.</p>
            
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-8 mb-6">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p className="text-gray-600 font-condensed">Camera scanner will be implemented here</p>
                <p className="text-sm text-gray-500 font-condensed mt-2">Use mobile device or camera to scan QR codes</p>
              </div>
              
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-condensed font-medium tracking-wide">
                Open Camera Scanner
              </button>
            </div>
          </div>
        );

      case 'tracking':
        return (
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 tracking-tight">Item Tracking</h2>
            <p className="text-gray-600 font-condensed mb-6">Track the location and status of railway track fittings.</p>
            
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-8 mb-6">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-600 font-condensed">Tracking system will be implemented here</p>
                <p className="text-sm text-gray-500 font-condensed mt-2">View real-time location and status of items</p>
              </div>
            </div>
          </div>
        );

      case 'faults-map':
        return (
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 tracking-tight">Faults Map</h2>
            <p className="text-gray-600 font-condensed mb-6">View and manage reported faults on the railway network.</p>
            
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-8 mb-6">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-gray-600 font-condensed">Interactive map will be implemented here</p>
                <p className="text-sm text-gray-500 font-condensed mt-2">Visual representation of faults and issues</p>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 tracking-tight">Reports</h2>
            <p className="text-gray-600 font-condensed mb-6">Generate and view various reports for the railway management system.</p>
            
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-8 mb-6">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 font-condensed">Report generation system will be implemented here</p>
                <p className="text-sm text-gray-500 font-condensed mt-2">Create detailed reports and analytics</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    // Outer container with the railway background image and overlay
    <div className="min-h-screen relative overflow-hidden bg-gray-900">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          // --- SETTING THE BACKGROUND IMAGE ---
          backgroundImage: `url('/railway_sunset_bg_clean.jpg')`, // Assume this is your dashboard background image
        }}
      >
        {/* Overlay for dimming effect */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div> {/* Adjust opacity as needed */}
      </div>

      {/* Main Content Wrapper - everything below is visually layered on top of the background */}
      <div className="relative z-10 min-h-screen flex flex-col">
      {/* Header */}
        <div className="bg-gray-800 bg-opacity-70 backdrop-blur-sm shadow-lg"> {/* Added opacity and blur to header */}
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
                {/* Indian Emblem (Assuming Ashoka Stambh is placed correctly) */}
                <img 
                  src="/ashoka_stambh.png" // Path to your Ashoka Stambh PNG with transparent background
                  alt="Ashoka Stambh Emblem of India" 
                  className="h-10 w-10 object-contain" // Adjusted size for header
                />
              <div>
                  <h1 className="text-xl font-display font-bold tracking-tight text-white" style={{fontFamily: 'Inter, Roboto Condensed, system-ui, sans-serif', fontWeight: '700', letterSpacing: '-0.05em'}}>TRACK RAILWAYS</h1>
                  <p className="text-sm text-gray-200 font-condensed" style={{fontFamily: 'Roboto Condensed, Inter, system-ui, sans-serif', fontWeight: '400', letterSpacing: '-0.025em'}}>TRACK FITTINGS MANAGEMENT SYSTEM</p>
                  <p className="text-xs text-gray-300 font-condensed" style={{fontFamily: 'Roboto Condensed, Inter, system-ui, sans-serif', fontWeight: '400', letterSpacing: '-0.025em'}}>ADMIN PORTAL</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                  <span className="text-sm font-condensed font-medium text-white">ADMIN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

        <div className="flex flex-1">
        {/* Sidebar */}
          <div className="w-64 bg-gray-800 bg-opacity-70 backdrop-blur-sm min-h-full"> {/* Added opacity and blur to sidebar */}
          <nav className="mt-8">
            <div className="px-4 space-y-2">
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('dashboard');
                  }}
                  className={`flex items-center px-4 py-2 text-sm font-condensed font-medium rounded-lg ${
                    activeTab === 'dashboard' 
                      ? 'text-white bg-blue-600' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Dashboard
              </a>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('qr-generation');
                }}
                className={`flex items-center px-4 py-2 text-sm font-condensed font-medium rounded-lg ${
                  activeTab === 'qr-generation' 
                    ? 'text-white bg-blue-600' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
                QR Generation
              </a>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('scan');
                  }}
                  className={`flex items-center px-4 py-2 text-sm font-condensed font-medium rounded-lg ${
                    activeTab === 'scan' 
                      ? 'text-white bg-blue-600' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Scan
              </a>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('tracking');
                  }}
                  className={`flex items-center px-4 py-2 text-sm font-condensed font-medium rounded-lg ${
                    activeTab === 'tracking' 
                      ? 'text-white bg-blue-600' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Tracking
              </a>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('faults-map');
                  }}
                  className={`flex items-center px-4 py-2 text-sm font-condensed font-medium rounded-lg ${
                    activeTab === 'faults-map' 
                      ? 'text-white bg-blue-600' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Faults Map
              </a>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('reports');
                  }}
                  className={`flex items-center px-4 py-2 text-sm font-condensed font-medium rounded-lg ${
                    activeTab === 'reports' 
                      ? 'text-white bg-blue-600' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2h-.01z" clipRule="evenodd" />
                </svg>
                Reports
              </a>
            </div>
          </nav>
        </div>

          {/* Main Content Area */}
        <div className="flex-1 p-8">
          {renderContent()}
        </div>
        </div>
      </div>

    </div>
  );
}