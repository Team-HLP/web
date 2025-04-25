// App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// 페이지 컴포넌트 import
import LoginPage from './pages/LoginPage';
import MemberListPage from './pages/MemberListPage';
import MemberDetailPage from './pages/MemberDetailPage';
import SessionDetailPage from './pages/SessionDetailPage';
import StatisticsPage from './pages/StatisticsPage';

// 인증이 필요한 페이지에 접근할 때 로그인 여부 확인
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 (기본 경로) */}
        <Route path="/" element={<LoginPage />} />

        {/* 관리자 전용: 회원 리스트 페이지 */}
        <Route
          path="/admin/member-list"
          element={
            <RequireAuth>
              <MemberListPage />
            </RequireAuth>
          }
        />

        {/* 관리자 전용: 회원 상세 페이지 */}
        <Route
          path="/admin/member/:userId"
          element={
            <RequireAuth>
              <MemberDetailPage />
            </RequireAuth>
          }
        />

        {/* 관리자 전용: 회원의 개별 세션 상세 페이지 */}
        <Route
          path="/admin/member/:userId/session/:gameId"
          element={
            <RequireAuth>
              <SessionDetailPage />
            </RequireAuth>
          }
        />

        {/* 관리자 전용: 회원 전체 통계 */}
        <Route
          path="/admin/member/:userId/statistics"
          element={
            <RequireAuth>
              <StatisticsPage />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;