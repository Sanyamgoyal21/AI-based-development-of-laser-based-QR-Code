import React, { useEffect, useState } from 'react';
import { itemsAPI, removeAuthToken, API_ORIGIN } from '../services/api';

export default function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // Track active sidebar item
  const [qrFormData, setQrFormData] = useState({
    vendorName: '',
    lotNumber: '',
    itemType: 'Elastic Rail Clip',
    warrantyStartDate: '',
    warrantyEndDate: '',
    manufactureDate: '',
    supplyDate: '',
    qrAccessPassword: '',
    location: '',
    geotag: ''
  });
  const [dateErrors, setDateErrors] = useState({});
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSuccess, setQrSuccess] = useState('');
  const [qrError, setQrError] = useState('');
  const [generatedQR, setGeneratedQR] = useState(null);
  const [qrGallery, setQrGallery] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState('');

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

  const fetchQRGallery = async () => {
    try {
      const response = await itemsAPI.list({ page: 1, limit: 100 });
      if (response.data.success) {
        setQrGallery(response.data.items);
      }
    } catch (err) {
      console.error('Error fetching QR gallery:', err);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          
          // Get address from coordinates using reverse geocoding
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(response => response.json())
            .then(data => {
              const address = `${data.city || ''}, ${data.principalSubdivision || ''}, ${data.countryName || ''}`.replace(/^,\s*|,\s*$/g, '');
              setQrFormData(prev => ({
                ...prev,
                location: address,
                geotag: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              }));
            })
            .catch(() => {
              setQrFormData(prev => ({
                ...prev,
                location: 'Location not available',
                geotag: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              }));
            })
            .finally(() => {
              setLocationLoading(false);
            });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
        }
      );
    } else {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchQRGallery();
  }, []);

  // Fetch QR image as blob and create a local object URL to avoid CORP blocking
  useEffect(() => {
    const loadQrImage = async () => {
      try {
        if (!generatedQR?.qrCode?.filename) {
          if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
          setQrImageUrl('');
          return;
        }
        const res = await fetch(`${API_ORIGIN}/qrcodes/${generatedQR.qrCode.filename}`, {
          mode: 'cors'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setQrImageUrl(url);
      } catch (e) {
        console.error('Failed to load QR image:', e);
        if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
        setQrImageUrl('');
      }
    };

    loadQrImage();

    return () => {
      if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
    };
  }, [generatedQR?.qrCode?.filename]);

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = '/login';
  };

  const validateDates = (formData) => {
    const errors = {};
    const today = new Date();
    
    // Manufacture date validation
    if (formData.manufactureDate) {
      const manufactureDate = new Date(formData.manufactureDate);
      if (manufactureDate > today) {
        errors.manufactureDate = 'Manufacture date cannot be in the future';
      }
    }
    
    // Supply date validation
    if (formData.supplyDate) {
      const supplyDate = new Date(formData.supplyDate);
      if (supplyDate > today) {
        errors.supplyDate = 'Supply date cannot be in the future';
      }
      if (formData.manufactureDate) {
        const manufactureDate = new Date(formData.manufactureDate);
        if (supplyDate < manufactureDate) {
          errors.supplyDate = 'Supply date cannot be before manufacture date';
        }
      }
    }
    
    // Warranty start date validation
    if (formData.warrantyStartDate) {
      const warrantyStartDate = new Date(formData.warrantyStartDate);
      if (formData.supplyDate) {
        const supplyDate = new Date(formData.supplyDate);
        if (warrantyStartDate < supplyDate) {
          errors.warrantyStartDate = 'Warranty start date cannot be before supply date';
        }
      }
    }
    
    // Warranty end date validation
    if (formData.warrantyEndDate) {
      const warrantyEndDate = new Date(formData.warrantyEndDate);
      if (formData.warrantyStartDate) {
        const warrantyStartDate = new Date(formData.warrantyStartDate);
        if (warrantyEndDate <= warrantyStartDate) {
          errors.warrantyEndDate = 'Warranty end date must be after warranty start date';
        }
      }
    }
    
    return errors;
  };

  const handleQRFormChange = (e) => {
    const { name, value } = e.target;
    setQrFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate dates when they change
    const updatedFormData = { ...qrFormData, [name]: value };
    const errors = validateDates(updatedFormData);
    setDateErrors(errors);
  };

  const handleQRGeneration = async (e) => {
    e.preventDefault();
    setQrLoading(true);
    setQrError('');
    setQrSuccess('');

    // Validate dates before submission
    const errors = validateDates(qrFormData);
    if (Object.keys(errors).length > 0) {
      setDateErrors(errors);
      setQrError('Please fix the date validation errors before generating QR code');
      setQrLoading(false);
      return;
    }

    try {
      // Parse geotag coordinates
      const geotagCoords = qrFormData.geotag.split(',').map(coord => parseFloat(coord.trim()));
      
      const payload = {
        itemType: qrFormData.itemType,
        vendor: qrFormData.vendorName,
        lotNumber: qrFormData.lotNumber,
        dateOfSupply: qrFormData.supplyDate || undefined,
        manufactureDate: qrFormData.manufactureDate || undefined,
        warrantyStartDate: qrFormData.warrantyStartDate || undefined,
        warrantyEndDate: qrFormData.warrantyEndDate || undefined,
        geoLat: geotagCoords[0] || currentLocation?.latitude || 0,
        geoLng: geotagCoords[1] || currentLocation?.longitude || 0,
        location: qrFormData.location,
        geotag: qrFormData.geotag,
        qrAccessPassword: qrFormData.qrAccessPassword,
        dynamicData: {
          maintenanceHistory: [],
          lastUpdated: new Date().toISOString(),
          isDynamic: true
        }
      };

      const response = await itemsAPI.create(payload);
      
      if (response.data.success) {
        console.log('QR Generation Response:', response.data);
        console.log('QR Code Filename:', response.data.qrCode?.filename);
        console.log('QR Image URL:', `http://localhost:8000/qrcodes/${response.data.qrCode?.filename}`);
        setGeneratedQR(response.data);
        setQrSuccess('QR Code generated successfully!');
        setQrFormData({
          vendorName: '',
          lotNumber: '',
          itemType: 'Elastic Rail Clip',
          warrantyStartDate: '',
          warrantyEndDate: '',
          manufactureDate: '',
          supplyDate: '',
          qrAccessPassword: '',
          location: '',
          geotag: ''
        });
        setDateErrors({});
        // Refresh the items list and gallery
        fetchItems();
        fetchQRGallery();
      } else {
        setQrError(response.data.message || 'Failed to generate QR code');
      }
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form Card */}
            <div className="bg-[#ADADAD]/40 rounded-lg p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 tracking-tight">Item Information</h2>
            
            <form onSubmit={handleQRGeneration} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="vendorName" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide mb-2">
                    Vendor Name
                  </label>
                  <input
                    type="text"
                    name="vendorName"
                    id="vendorName"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-condensed"
                    placeholder="Enter vendor name"
                    value={qrFormData.vendorName}
                    onChange={handleQRFormChange}
                  />
                </div>

                <div>
                  <label htmlFor="lotNumber" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide mb-2">
                    Lot Number
                  </label>
                  <input
                    type="text"
                    name="lotNumber"
                    id="lotNumber"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-condensed"
                    placeholder="Enter lot number"
                    value={qrFormData.lotNumber}
                    onChange={handleQRFormChange}
                  />
                </div>

                <div>
                  <label htmlFor="itemType" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide mb-2">
                    Item Type
                  </label>
                  <select
                    name="itemType"
                    id="itemType"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-condensed"
                    value={qrFormData.itemType}
                    onChange={handleQRFormChange}
                  >
                    <option value="Elastic Rail Clip">Elastic Rail Clip</option>
                    <option value="Rail Fastener">Rail Fastener</option>
                    <option value="Rail Joint">Rail Joint</option>
                    <option value="Rail Pad">Rail Pad</option>
                    <option value="Rail Sleeper">Rail Sleeper</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="manufactureDate" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide mb-2">
                    Manufacture Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="manufactureDate"
                      id="manufactureDate"
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-condensed ${
                        dateErrors.manufactureDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={qrFormData.manufactureDate}
                      onChange={handleQRFormChange}
                    />
                    <svg className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {dateErrors.manufactureDate && (
                    <p className="mt-1 text-sm text-red-600 font-condensed">{dateErrors.manufactureDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="supplyDate" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide mb-2">
                    Supply Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="supplyDate"
                      id="supplyDate"
                      min={qrFormData.manufactureDate || undefined}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-condensed ${
                        dateErrors.supplyDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={qrFormData.supplyDate}
                      onChange={handleQRFormChange}
                    />
                    <svg className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {dateErrors.supplyDate && (
                    <p className="mt-1 text-sm text-red-600 font-condensed">{dateErrors.supplyDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="qrAccessPassword" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide mb-2">
                    QR Access Password
                  </label>
                  <input
                    type="password"
                    name="qrAccessPassword"
                    id="qrAccessPassword"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-condensed"
                    placeholder="Set a password to protect this QR"
                    value={qrFormData.qrAccessPassword}
                    onChange={handleQRFormChange}
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide mb-2">
                    Location (Address)
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      name="location"
                      id="location"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-condensed"
                      placeholder="Enter location address"
                      value={qrFormData.location}
                      onChange={handleQRFormChange}
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="px-4 py-3 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition-colors font-condensed disabled:opacity-50"
                    >
                      {locationLoading ? 'Getting...' : '📍'}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="geotag" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide mb-2">
                    Geotag (Coordinates)
                  </label>
                  <input
                    type="text"
                    name="geotag"
                    id="geotag"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-condensed"
                    placeholder="Enter coordinates (lat, lng) or click location button"
                    value={qrFormData.geotag}
                    onChange={handleQRFormChange}
                  />
                </div>
              </div>

              {/* Warranty Dates Section - Single Column */}
              <div className="mt-6">
                <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 tracking-tight">Warranty Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="warrantyStartDate" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide mb-2">
                      Warranty Start Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="warrantyStartDate"
                        id="warrantyStartDate"
                        min={qrFormData.supplyDate || undefined}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-condensed ${
                          dateErrors.warrantyStartDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={qrFormData.warrantyStartDate}
                        onChange={handleQRFormChange}
                      />
                      <svg className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {dateErrors.warrantyStartDate && (
                      <p className="mt-1 text-sm text-red-600 font-condensed">{dateErrors.warrantyStartDate}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="warrantyEndDate" className="block text-sm font-condensed font-medium text-gray-700 tracking-wide mb-2">
                      Warranty End Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="warrantyEndDate"
                        id="warrantyEndDate"
                        min={qrFormData.warrantyStartDate || undefined}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-condensed ${
                          dateErrors.warrantyEndDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={qrFormData.warrantyEndDate}
                        onChange={handleQRFormChange}
                      />
                      <svg className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {dateErrors.warrantyEndDate && (
                      <p className="mt-1 text-sm text-red-600 font-condensed">{dateErrors.warrantyEndDate}</p>
                    )}
                  </div>
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={qrLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-condensed font-semibold py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {qrLoading ? 'Generating QR Code...' : 'Generate Unique QR Code'}
                </button>
              </div>
            </form>
                  </div>
                  
            {/* Right: Preview Card (visible only after generation) */}
            {generatedQR && (
              <div className="bg-[#ADADAD]/40 rounded-lg p-6 shadow-lg backdrop-blur-sm">
                <h2 className="text-xl font-display font-bold text-gray-900 mb-4 tracking-tight">QR Code Preview & Management</h2>
                <div className="flex flex-col items-center">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-3">
                    {generatedQR.qrCode?.filename && qrImageUrl ? (
                      <img src={qrImageUrl} alt="QR Code" className="w-56 h-56 object-contain" />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center text-gray-400">QR preview</div>
                        )}
                      </div>
                  <p className="text-xs text-gray-500 mb-4">Unique ID: {generatedQR.item?.uuidToken || '—'}</p>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={async () => { try { if (generatedQR.qrCode?.filename) { const res = await fetch(`${API_ORIGIN}/qrcodes/${generatedQR.qrCode.filename}`); const blob = await res.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `qr-code-${generatedQR.item?.uuidToken || 'unknown'}.png`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); } } catch (e) { console.error('Download failed', e); } }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Download QR Code (PNG)</button>
                    <button onClick={() => { if (generatedQR.qrCode?.filename) { window.open(`${API_ORIGIN}/qrcodes/${generatedQR.qrCode.filename}`, '_blank'); } }} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">Print QR Label</button>
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

      case 'qr-gallery':
        return (
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 tracking-tight">QR Code Gallery</h2>
            <p className="text-gray-600 font-condensed mb-6">View all generated QR codes with details.</p>
            
            {qrGallery.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p className="text-gray-600 font-condensed">No QR codes generated yet</p>
                <p className="text-sm text-gray-500 font-condensed mt-2">Generate your first QR code to see it here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {qrGallery.map((item, index) => (
                  <div key={item._id || index} className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-center">
                      <div className="mb-3">
                        <img 
                          src={`http://localhost:8000/qrcodes/${item.qrCode?.filename || 'default.png'}`} 
                          alt={`QR Code ${index + 1}`} 
                          className="mx-auto w-32 h-32 object-contain"
                        />
                      </div>
                      <div className="text-sm font-condensed">
                        <p className="font-semibold text-gray-900 mb-1">#{index + 1}</p>
                        <p className="text-gray-600 mb-1"><strong>Vendor:</strong> {item.vendor || 'N/A'}</p>
                        <p className="text-gray-600 mb-1"><strong>Type:</strong> {item.itemType || 'N/A'}</p>
                        <p className="text-gray-600 mb-1"><strong>Location:</strong> {item.location || 'N/A'}</p>
                        <p className="text-gray-500 text-xs">ID: {item.uuidToken?.slice(0, 8) || 'N/A'}</p>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-condensed">
                          View Details
                        </button>
                        <button className="flex-1 px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors font-condensed">
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        <div className="bg-[#ADADAD]/40 backdrop-blur-sm shadow-lg"> {/* Semi-transparent custom gray */}
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
          <div className="w-64 bg-[#ADADAD]/40 backdrop-blur-sm min-h-full"> {/* Semi-transparent custom gray */}
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
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('qr-gallery');
                }}
                className={`flex items-center px-4 py-2 text-sm font-condensed font-medium rounded-lg ${
                  activeTab === 'qr-gallery' 
                    ? 'text-white bg-blue-600' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                QR Gallery
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