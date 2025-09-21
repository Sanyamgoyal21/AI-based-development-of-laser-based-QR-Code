import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import ScanLanding from './pages/ScanLanding';
import PublicPortal from './pages/PublicPortal';
import PublicDashboard from './pages/PublicDashboard';
import { getAuthToken } from './services/api';

function App() {
  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!getAuthToken();
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/public" element={<PublicPortal />} />
          <Route path="/public-dashboard" element={<PublicDashboard />} />
          <Route path="/scan/:token" element={<ScanLanding />} />
          
          {/* Protected Routes */}
          <Route 
            path="/admin" 
            element={
              isAuthenticated() ? <AdminDashboard /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/worker" 
            element={
              isAuthenticated() ? <WorkerDashboard /> : <Navigate to="/login" replace />
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;