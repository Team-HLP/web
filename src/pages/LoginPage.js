import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';
import 'bootstrap/dist/css/bootstrap.min.css';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const hashedPassword = await hashPassword(password);

      const response = await axios.post('/admin/login', {
        login_id: loginId,
        password: hashedPassword,
      });

      const access_token = response.data.access_token;
      localStorage.setItem('access_token', access_token);

      navigate('/admin/member-list');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인 실패: 아이디 또는 비밀번호를 확인하세요.');
    }
  };

  useEffect(() => {
    document.body.classList.add('login-background');

    return () => {
      document.body.classList.remove('login-background');
    };
  }, []);


  return (
    <div id="container" className="text-center">
      <h1 id="pageTitle">ADHD-VR REPORT</h1>
      <div id="loginBox">
        <div id="inputBox">
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
