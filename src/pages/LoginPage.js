// LoginPage.js

// 로그인 페이지 컴포넌트
import { useEffect, useState } from 'react';
import axios from '../api/axios'; // 커스텀 axios 인스턴스 import
import { useNavigate } from 'react-router-dom'; // 페이지 이동용
import '../styles/login.css'; // 로그인 전용 스타일
import 'bootstrap/dist/css/bootstrap.min.css'; // 부트스트랩 스타일

// SHA-256 해시 함수 (비밀번호 암호화용)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// 로그인 컴포넌트
function LoginPage() {
  // 상태 변수
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // 페이지 이동용 훅

  // 로그인 요청 처리
  const handleLogin = async () => {
    try {
      // 비밀번호 해싱
      const hashedPassword = await hashPassword(password);

      // 로그인 API 요청
      const response = await axios.post('/admin/login', {
        login_id: loginId,
        password: hashedPassword,
      });

      // 토큰 저장 및 페이지 이동
      const access_token = response.data.access_token;
      localStorage.setItem('access_token', access_token);
      navigate('/admin/member-list');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인 실패: 아이디 또는 비밀번호를 확인하세요.');
    }
  };

  // 로그인 페이지 진입 시 배경 설정
  useEffect(() => {
    document.body.classList.add('login-background');
    return () => {
      document.body.classList.remove('login-background');
    };
  }, []);

  // 렌더링
  return (
    <div id="container" className="text-center">
      {/* 제목 */}
      <h1 id="pageTitle">ADHD-VR REPORT</h1>

      {/* 로그인 박스 */}
      <div id="loginBox">
        <div id="inputBox">
          {/* 아이디 입력 */}
          <div className="input-form-box">
            <span>아이디</span>
            <input
              type="text"
              className="form-control"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="input-form-box">
            <span>비밀번호</span>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 로그인 버튼 */}
          <div className="button-login-box">
            <button
              type="button"
              className="btn btn-primary btn-xs w-100"
              onClick={handleLogin}
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;