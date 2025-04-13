import { useState } from 'react';
import axios from '../api/axios';

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

  const handleLogin = async () => {
    try {
      const hashedPassword = await hashPassword(password);

      const response = await axios.post('/admin/login', {
        login_id: loginId,
        password: hashedPassword,
      });

      const access_token = response.data.access_token;
      localStorage.setItem('access_token', access_token);

      alert('로그인 성공!');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인 실패: 아이디 또는 비밀번호를 확인하세요.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto' }}>
      <h2>Admin Login</h2>
      <input
        type="text"
        placeholder="Login ID"
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />
      <button onClick={handleLogin} style={{ width: '100%' }}>
        로그인
      </button>
    </div>
  );
}

export default LoginPage;
