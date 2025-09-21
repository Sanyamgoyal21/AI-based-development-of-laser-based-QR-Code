import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    navigate('/login');
  };

  const handlePublicPortal = () => {
    navigate('/public');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - Railway Tracks */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/railway_sunset_bg_clean.jpg')`,
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div> 
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        
        {/* Indian Emblem and Government Text */}
        <div className="text-center mb-8">
          <img 
            src="/ashoka_stambh.png"
            alt="Ashoka Stambh Emblem of India" 
            className="h-20 w-20 object-contain mx-auto mb-4"
          />
          <p className="text-lg text-gray-100 font-medium">सत्यमेव जयते</p>
          <p className="text-sm text-gray-200">भारत सरकार</p>
          <p className="text-sm text-gray-200">Government of India</p>
        </div>

        {/* Main Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            RAILWAY TRACK FAULT
          </h1>
          <h2 className="text-2xl md:text-4xl font-bold text-yellow-400 mb-6 drop-shadow-lg">
            REPORTING SYSTEM
          </h2>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Advanced QR-based infrastructure management for safer, smarter railway operations
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl w-full">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30 hover:bg-opacity-30 transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Quick Scan</h3>
              <p className="text-sm text-gray-200">Instant QR code scanning for rapid fault identification</p>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30 hover:bg-opacity-30 transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">GPS Tracking</h3>
              <p className="text-sm text-gray-200">Precise location tracking for accurate fault reporting</p>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30 hover:bg-opacity-30 transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-time Dashboard</h3>
              <p className="text-sm text-gray-200">Live monitoring and analytics for railway infrastructure</p>
            </div>
          </div>
        </div>

        {/* Login Options */}
        <div className="flex flex-col sm:flex-row gap-6 max-w-2xl w-full">
          {/* Admin Portal Button */}
          <button
            onClick={handleAdminLogin}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <div className="text-lg">ADMIN PORTAL</div>
                <div className="text-sm opacity-90">Employee & Management Login</div>
              </div>
            </div>
          </button>

          {/* Public Portal Button */}
          <button
            onClick={handlePublicPortal}
            className="flex-1 bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <div className="text-lg">PUBLIC PORTAL</div>
                <div className="text-sm opacity-90">Citizen & Public Access</div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-300 mb-2">
            Indian Railways - Digital Transformation Initiative
          </p>
          <p className="text-xs text-gray-400">
            Powered by Advanced QR Technology & Real-time Analytics
          </p>
        </div>
      </div>

      {/* Floating Elements for Visual Appeal */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400 bg-opacity-20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-blue-400 bg-opacity-20 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-5 w-12 h-12 bg-green-400 bg-opacity-20 rounded-full animate-pulse delay-500"></div>
    </div>
  );
}
