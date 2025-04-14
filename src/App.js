import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MemberListPage from './pages/MemberListPage';

// 인증 체크용 컴포넌트
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('access_token');  // key 이름 확인
  return token ? children : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/admin/member-list"
          element={
            <RequireAuth>
              <MemberListPage />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;