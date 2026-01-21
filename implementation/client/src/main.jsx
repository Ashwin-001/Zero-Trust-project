import React, { useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import Sidebar from './components/Sidebar/Sidebar';
import AnalyticsPage from './components/AnalyticsPage/AnalyticsPage';
import UsersPage from './components/UsersPage/UsersPage';
import PoliciesPage from './components/PoliciesPage/PoliciesPage';
import BlockchainViewer from './components/BlockchainViewer/BlockchainViewer';
import './index.css';

const ProtectedLayout = ({ children }) => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem('token');

  if (!user && !token) {
    return <Navigate to="/" />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-color)', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px 20px 20px 0', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

import OAuthCallback from './components/OAuthCallback/OAuthCallback';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/analytics" element={<ProtectedLayout><AnalyticsPage /></ProtectedLayout>} />
      <Route path="/users" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><PoliciesPage /></ProtectedLayout>} />
      <Route path="/blockchain" element={<ProtectedLayout><BlockchainViewer /></ProtectedLayout>} />
    </Routes>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
