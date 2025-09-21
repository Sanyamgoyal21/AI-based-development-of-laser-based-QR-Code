import React, { useEffect, useState } from 'react';
import { itemsAPI, removeAuthToken } from '../services/api';

export default function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold">TRACK RAILWAYS</h1>
                <p className="text-sm text-gray-300">TRACK FITTINGS MANAGEMENT SYSTEM</p>
                <p className="text-xs text-gray-400">ADMIN PORTAL</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium">ADMIN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 min-h-screen">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Dashboard
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Scan
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Tracking
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Tracking
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Faults Map
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2h-.01z" clipRule="evenodd" />
                </svg>
                Reports
              </a>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Top Row - Metrics Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Total Fittings Scanned */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 shadow-lg">
              <div className="text-white">
                <p className="text-sm font-medium opacity-90">TOTAL FITTINGS SCANNED</p>
                <p className="text-3xl font-bold">1,200,500</p>
              </div>
            </div>

            {/* Active Consignments */}
            <div className="bg-gray-700 rounded-lg p-6 shadow-lg">
              <div className="text-white">
                <p className="text-sm font-medium opacity-90">ACTIVE CONSIGNMENTS</p>
                <p className="text-3xl font-bold">45</p>
              </div>
            </div>

            {/* Critical Faults Reported */}
            <div className="bg-gray-700 rounded-lg p-6 shadow-lg">
              <div className="text-white">
                <p className="text-sm font-medium opacity-90">CRITICAL FAULTS REPORTED</p>
                <p className="text-3xl font-bold">8</p>
              </div>
            </div>

            {/* Quick Scan Button */}
            <div className="bg-blue-600 rounded-lg p-6 shadow-lg flex items-center justify-center">
              <button className="flex items-center space-x-3 text-white">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span className="text-lg font-semibold">QUICK SCAN</span>
              </button>
            </div>
          </div>

          {/* Bottom Row - Activity Logs */}
          <div className="grid grid-cols-3 gap-6">
            {/* Front RORAR */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">FRONT RORAR</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Scan: Clip #11780 (Passed) (cetisortie Clesnelatio)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Scan: Clip #177930 (Passed) (boler bott. Ott nated | Aboswed)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Inspection: Ped IP5S/78 (Passed) Imapesckan Aitbub Dear Derhct (Arrived)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">Beaerstion Part 8 Aito81 Reel Ploilvaet (Reetileg (MB.sf Pond)</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">RECENT ACTIVITY</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Scan: Clip #17990 (Passed) (Deripipaths trinet (Airass)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Scan: Clip #1F5678 (Passed) (Mirer Defket (Convertta)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Cempectiam (Pad MIT.878 (Passed) Corgrastom Alfteatn Bees (Dfiact (Arrived)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Scan: Clip #IV8679 (Bohut Mestapemt #IMIDE2400 (Arrived)</span>
                </div>
              </div>
            </div>

            {/* Last 10 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Last 10</h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-300">#IID28244005</div>
                <div className="text-sm text-gray-300">Revan tois</div>
                <div className="text-sm text-gray-300">#INO2024005</div>
                <div className="text-sm text-gray-300">Sermikins</div>
                <div className="text-sm text-gray-300">Cororernet NIG</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
