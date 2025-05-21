// MemberDetailPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonGroup,
  Card,
  Container,
  Row,
  Col,
  ToggleButton,
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE = 'https://api-hlp.o-r.kr';

const MemberDetailPage = () => {
  const { userId } = useParams();
  const navigate  = useNavigate();

  const [user,        setUser]        = useState(null);
  const [games,       setGames]       = useState([]);
  const [selectedCat, setSelectedCat] = useState('전체'); // 필터된 카테고리

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res   = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const found = res.data.find(u => u.id === Number(userId));
      setUser(found || null);
    } catch (err) {
      console.error('회원 정보 불러오기 실패:', err);
    }
  }, [userId]);

  const fetchGames = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res   = await axios.get(`${API_BASE}/admin/game`, {
        headers: { Authorization: `Bearer ${token}` },
        params:  { user_id: userId },
      });
      setGames(res.data || []);
    } catch (err) {
      console.error('게임 정보 불러오기 실패:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
    fetchGames();
  }, [fetchUser, fetchGames]);

  const formatPhoneNumber = phone => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11) {
      return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  if (!user) {
    return <div className="container mt-5">회원 정보를 불러오는 중...</div>;
  }

  // 1) 고유 카테고리 목록 (+ "전체" 항목)  
  const categories = [
    '전체',
    ...Array.from(new Set(games.map(g => g.category || '미분류'))),
  ];

  // 2) 선택된 카테고리에 따른 필터링  
  const filteredGames = selectedCat === '전체'
    ? games
    : games.filter(g => (g.category || '미분류') === selectedCat);

  return (
    <Container className="mt-5">
      {/* 상단 헤더 */}
      <Row className="mb-4 align-items-center justify-content-between">
        <Col><h4>회원 상세 정보</h4></Col>
        <Col xs="auto">
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            회원 리스트로
          </Button>
        </Col>
      </Row>

      {/* 기본 정보 카드 */}
      <Card className="p-4 mb-4">
        <Row>
          <Col><strong>ID:</strong> {user.login_id}</Col>
          <Col><strong>이름:</strong> {user.name}</Col>
        </Row>
        <Row className="mt-2">
          <Col><strong>전화번호:</strong> {formatPhoneNumber(user.phone_number)}</Col>
          <Col><strong>나이:</strong> {user.age}세</Col>
        </Row>
        <Row className="mt-2">
          <Col><strong>성별:</strong> {user.sex}</Col>
          <Col>
            <strong>생성일:</strong>{' '}
            {new Date(user.created_at).toLocaleDateString()}
          </Col>
        </Row>
      </Card>

      {/* 훈련 기록 헤더 + 버튼 그룹 */}
      <Row className="mb-3 align-items-center">
        <Col><h5 className="mb-0">훈련 기록</h5></Col>
        <Col xs="auto">
          <ButtonGroup>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate(`/admin/member/${userId}/statistics`)}
              disabled={games.length === 0}
            >
              전체 통계 보기
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/admin/user/${userId}/bio`)}
            >
              종합 ADHD 점수
            </Button>
          </ButtonGroup>
        </Col>
      </Row>

      {/* 카테고리 필터 토글 버튼 */}
      <ButtonGroup className="mb-3">
        {categories.map(cat => (
          <ToggleButton
            key={cat}
            id={`cat-${cat}`}
            type="radio"
            variant={selectedCat === cat ? 'primary' : 'outline-primary'}
            name="category"
            size="sm"
            value={cat}
            checked={selectedCat === cat}
            onChange={e => setSelectedCat(e.currentTarget.value)}
          >
            {cat}
          </ToggleButton>
        ))}
      </ButtonGroup>

      {/* 세션 카드 목록 */}
      {filteredGames.length === 0 ? (
        <p className="text-center text-muted">
          {selectedCat === '전체'
            ? '등록된 훈련 정보가 없습니다.'
            : `${selectedCat} 카테고리의 세션이 없습니다.`}
        </p>
      ) : (
        filteredGames.map(game => (
          <Card
            key={game.id}
            className="mb-3 p-3"
            style={{ cursor: 'pointer', transition: 'transform .1s, box-shadow .2s' }}
            onClick={() => navigate(`/admin/member/${userId}/session/${game.id}`)}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.15)';
              e.currentTarget.style.transform   = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform   = 'scale(1)';
            }}
          >
            <Row className="align-items-center">
              <Col><strong>세션 ID:</strong> {game.id}</Col>
              <Col><strong>카테고리:</strong> {game.category || '미분류'}</Col>
              <Col>
                <strong>진행 시간:</strong>{' '}
                {new Date(game.created_at).toLocaleString('ko-KR')}
              </Col>
            </Row>
          </Card>
        ))
      )}
    </Container>
  );
};

export default MemberDetailPage;