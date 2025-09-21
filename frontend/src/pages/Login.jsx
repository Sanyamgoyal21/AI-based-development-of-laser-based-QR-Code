import React, { useState } from 'react';
import { authAPI, setAuthToken } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login({ username, password });
      
      if (response.data.success) {
        setAuthToken(response.data.token);
        // Navigate based on user role
        const userRole = response.data.user.role;
        if (userRole === 'admin') {
          navigate('/admin');
        } else {
          navigate('/worker');
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - Railway Tracks */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          // Use your clean background image here, *without* the ghosted text
          backgroundImage: `url('/railway_sunset_bg_clean.jpg')`, // <--- ASSUMPTION: You have a version without background text
        }}
      >
        {/* Overlay for better text readability and to achieve the dimmed look */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div> 
      </div>

      {/* Login Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Login Card - Transparency and blur are kept */}
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white border-opacity-30">
            {/* Indian Emblem - Replaced with Ashoka Stambh */}
            <div className="flex justify-center mb-6">
              <img 
                src="/ashoka_stambh.png" // <--- ASSUMPTION: Ashoka Stambh PNG in public folder
                alt="Ashoka Stambh Emblem of India" 
                className="h-24 w-24 object-contain" // Adjust size as needed
              />
            </div>

            {/* Hindi Text */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-100 font-medium">सत्यमेव जयते</p>
              <p className="text-xs text-gray-200">भारत सरकार</p>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display text-white mb-2 tracking-tight">
                TRACK FITTINGS MANAGEMENT SYSTEM
              </h1>
              <p className="text-lg font-condensed text-gray-200 font-semibold">
                ADMIN PORTAL
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-condensed font-medium text-white mb-2 tracking-wide">
                  USERNAME / EMPLOYEE ID
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white bg-opacity-70 text-gray-900 placeholder-gray-600 font-condensed"
                  placeholder="Enter your username or employee ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-condensed font-medium text-white mb-2 tracking-wide">
                  PASSWORD
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white bg-opacity-70 text-gray-900 placeholder-gray-600 font-condensed"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Login Button and Forgot Password */}
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-condensed font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg tracking-wide"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      LOGGING IN...
                    </div>
                  ) : (
                    'LOGIN'
                  )}
                </button>
                
                <a 
                  href="#" 
                  className="ml-4 text-sm text-blue-300 hover:text-blue-100 transition-colors duration-200"
                >
                  Forgot Password?
                </a>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-300">
                Indian Railways - Digital Transformation Initiative
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}