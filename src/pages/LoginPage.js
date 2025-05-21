// src/pages/LoginPage.js

import React, { useEffect, useState } from 'react';
import axios from '../api/axios';               // 커스텀 axios 인스턴스
import { useNavigate } from 'react-router-dom'; // 페이지 이동용
import { Carousel } from 'react-bootstrap';     // Carousel 추가
import '../styles/login.css';                   // 기존 스타일
import 'bootstrap/dist/css/bootstrap.min.css';  // 부트스트랩

// SHA-256 해시 함수 (비밀번호 암호화용)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // 로그인 요청 처리
  const handleLogin = async () => {
    try {
      const hashedPassword = await hashPassword(password);
      const response = await axios.post('/admin/login', {
        login_id: loginId,
        password: hashedPassword,
      });
      localStorage.setItem('access_token', response.data.access_token);
      navigate('/admin/member-list');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인 실패: 아이디 또는 비밀번호를 확인하세요.');
    }
  };

  // 진입 시 배경 클래스 토글
  useEffect(() => {
    document.body.classList.add('login-background');
    return () => {
      document.body.classList.remove('login-background');
    };
  }, []);

  return (
    <div id="container" className="text-center">


      {/* 1. 큰 로고 */}
      <img
        src={`${process.env.PUBLIC_URL}/images/logo.png`}
        alt="EyeWaveVR Logo"
        style={{
          width: '250px',
          maxWidth: '80%',
          margin: '40px auto 10px',
          display: 'block',
        }}
      />
      {/* 3. 메인 이미지 슬라이더 */}
      <Carousel
        variant="dark"
        interval={4000}
        controls
        indicators
        className="login-carousel mb-4"
        style={{ maxWidth: '500px', margin: '0 auto' }}
      >
        <Carousel.Item>
          <img
            src={`${process.env.PUBLIC_URL}/images/main1.png`}
            alt="Slide 1"
            className="d-block w-100"
          />
        </Carousel.Item>
        <Carousel.Item>
          <img
            src={`${process.env.PUBLIC_URL}/images/main2.png`}
            alt="Slide 2"
            className="d-block w-100"
          />
        </Carousel.Item>
        <Carousel.Item>
          <img
            src={`${process.env.PUBLIC_URL}/images/main3.png`}
            alt="Slide 3"
            className="d-block w-100"
          />
        </Carousel.Item>
                <Carousel.Item>
          <img
            src={`${process.env.PUBLIC_URL}/images/main4.png`}
            alt="Slide 4"
            className="d-block w-100"
          />
        </Carousel.Item>
      </Carousel>


      {/* 2. 프로젝트 슬로건 */}
      <p className="lead mb-4">
        VR로 ADHD 집중 훈련을 경험하세요
      </p>

      {/* 4. 로그인 박스 */}
      <div id="loginBox">
        <form
          id="inputBox"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div className="input-form-box">
            <span>아이디</span>
            <input
              type="text"
              className="form-control"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
          </div>

          <div className="input-form-box">
            <span>비밀번호</span>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="button-login-box">
            <button
              type="submit"
              className="btn btn-primary btn-xs w-100"
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;