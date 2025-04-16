// App.js 
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import MemberListPage from './pages/MemberListPage';
import MemberDetailPage from './pages/MemberDetailPage';
import SessionDetailPage from './pages/SessionDetailPage';

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin/member-list" element={<RequireAuth><MemberListPage /></RequireAuth>} />
        <Route path="/admin/member/:userId" element={<RequireAuth><MemberDetailPage /></RequireAuth>} />
        <Route path="/admin/member/:userId/session/:gameId" element={<RequireAuth><SessionDetailPage /></RequireAuth>} />
      </Routes>
    </Router>
  );
};

export default App;
