import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import ScanLanding from './pages/ScanLanding';
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
          <Route path="/login" element={<Login />} />
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
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
