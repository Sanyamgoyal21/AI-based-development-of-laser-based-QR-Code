import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PublicPortal() {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    // Simulate OTP sending
    setTimeout(() => {
      setShowOtp(true);
      setLoading(false);
      alert('OTP sent to your mobile number');
    }, 1000);
  };

  const handleLogin = () => {
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }
    
    // For now, redirect to a simple public interface
    // In a real app, you'd verify the OTP with backend
    navigate('/public-dashboard');
  };

  const handleBackToHome = () => {
    navigate('/');
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
        <div className="absolute inset-0 bg-black bg-opacity-60"></div> 
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          
          {/* Login Card */}
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white border-opacity-30">
            
            {/* Indian Emblem */}
            <div className="flex justify-center mb-6">
              <img 
                src="/ashoka_stambh.png"
                alt="Ashoka Stambh Emblem of India" 
                className="h-20 w-20 object-contain"
              />
            </div>

            {/* Hindi Text */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-100 font-medium">सत्यमेव जयते</p>
              <p className="text-xs text-gray-200">भारत सरकार</p>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                RAILWAY TRACK FAULT
              </h1>
              <p className="text-lg font-semibold text-yellow-400">
                PUBLIC PORTAL
              </p>
            </div>

            {/* Login Form */}
            <div className="space-y-6">
              
              {/* Mobile Number Field */}
              {!showOtp && (
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-white mb-2">
                    MOBILE NUMBER
                  </label>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    required
                    maxLength="10"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white bg-opacity-70 text-gray-900 placeholder-gray-600"
                    placeholder="Enter your 10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  />
                  <button
                    onClick={handleSendOtp}
                    disabled={loading || !mobileNumber}
                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        SENDING OTP...
                      </div>
                    ) : (
                      'SEND OTP'
                    )}
                  </button>
                </div>
              )}

              {/* OTP Field */}
              {showOtp && (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-white mb-2">
                    ONE-TIME PASSWORD (OTP)
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white bg-opacity-70 text-gray-900 placeholder-gray-600 text-center text-xl tracking-widest"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                  
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={handleLogin}
                      disabled={!otp || otp.length !== 6}
                      className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      LOGIN / SIGN-UP
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowOtp(false);
                        setOtp('');
                      }}
                      className="px-4 py-3 text-sm text-blue-300 hover:text-blue-100 transition-colors duration-200 border border-blue-300 rounded-lg hover:bg-blue-300 hover:bg-opacity-20"
                    >
                      Back
                    </button>
                  </div>

                  <div className="mt-4 text-center">
                    <button 
                      onClick={handleSendOtp}
                      className="text-sm text-blue-300 hover:text-blue-100 transition-colors duration-200"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}

              {/* Back to Home */}
              <div className="mt-6 text-center">
                <button
                  onClick={handleBackToHome}
                  className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                >
                  ← Back to Home
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-300">
                Indian Railways - Public Access Portal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
