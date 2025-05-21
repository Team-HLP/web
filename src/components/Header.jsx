// src/components/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Container, Button, ButtonGroup } from 'react-bootstrap';

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  const goMemberList = (mode) => {
    // mode: 'settings' 또는 'register'
    navigate(`/admin/member-list?${mode}=true`);
  };

  return (
    <Navbar bg="white" expand="lg" className="mb-4 shadow-sm">
      <Container className="d-flex justify-content-between align-items-center">
        <Navbar.Brand
          onClick={() => navigate('/admin/member-list')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <img
            src={`${process.env.PUBLIC_URL}/images/logo.png`}
            alt="EyeWaveVR Logo"
            style={{
              width: '200px',     // 원하는 가로 크기
              height: '60px',     // 헤더 높이에 맞춘 고정 높이
              objectFit: 'cover', // 비율 유지하며 영역에 맞춰 잘라냄
            }}
          />
        </Navbar.Brand>

        <ButtonGroup>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => goMemberList('settings')}
          >
            관리자 설정
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => goMemberList('register')}
          >
            회원 아이디 발급
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </ButtonGroup>
      </Container>
    </Navbar>
  );
}