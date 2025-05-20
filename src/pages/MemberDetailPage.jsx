// MemberDetailPage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// 회원 상세 정보 페이지
const MemberDetailPage = () => {
  const { userId } = useParams(); // URL에서 userId 추출
  const navigate = useNavigate(); // 페이지 이동에 사용

  const [user, setUser] = useState(null); // 선택된 회원 정보
  const [games, setGames] = useState([]); // 해당 회원의 훈련(게임) 기록 목록

  // 회원 정보 불러오기 함수
  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('https://api-hlp.o-r.kr/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // 전체 회원 중에서 해당 userId와 일치하는 유저 찾기
      const userData = res.data.find((u) => u.id === Number(userId));
      setUser(userData);
    } catch (error) {
      console.error('회원 정보 불러오기 실패:', error);
    }
  }, [userId]);

  // 게임(세션) 리스트 불러오기
  const fetchGames = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('https://api-hlp.o-r.kr/admin/game', {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: userId },
      });
      setGames(res.data);            // id, category, created_at 필드만 넘어옴
    } catch (err) {
      console.error('게임 정보 불러오기 실패:', err);
    }
  }, [userId]);

  // 전화번호 하이픈 포맷 함수
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const numbersOnly = phone.replace(/\D/g, '');

    if (numbersOnly.length === 10) {
      return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 6)}-${numbersOnly.slice(6)}`;
    } else if (numbersOnly.length === 11) {
      return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7)}`;
    } else {
      return phone; // 원본 반환
    }
  };

  // 컴포넌트 마운트 시 회원 정보와 게임 기록 불러오기
  useEffect(() => {
    fetchUser();
    fetchGames();
  }, [fetchUser, fetchGames]);

  // 로딩 중 화면
  if (!user) return <div className="container mt-5">회원 정보를 불러오는 중...</div>;

  return (
    <Container className="mt-5">
      {/* 상단 제목 및 뒤로가기 버튼 */}
      <Row className="mb-4 align-items-center justify-content-between">
        <Col><h2>회원 상세 정보</h2></Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={() => navigate(-1)}>뒤로 가기</Button>
        </Col>
      </Row>

      {/* 회원 기본 정보 카드 */}
      <Card className="p-4 mb-4">
        <Row>
          <Col><strong>ID:</strong> {user.login_id}</Col>
          <Col><strong>이름:</strong> {user.name}</Col>
        </Row>
        <Row>
          <Col><strong>전화번호:</strong> {formatPhoneNumber(user.phone_number)}</Col>
          <Col><strong>나이:</strong> {user.age}세</Col>
        </Row>
        <Row>
          <Col><strong>성별:</strong> {user.sex}</Col>
          <Col><strong>생성일:</strong> {user.created_at}</Col>
        </Row>
      </Card>

      {/* 훈련 기록 섹션 제목 및 (예정된) 통계 보기 버튼 */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">훈련 기록</h5>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => navigate(`/admin/member/${userId}/statistics`)}
          disabled={games.length === 0} /* 세션이 없으면 비활성화 */
        >
          전체 통계 보기
        </Button>
        <Button variant="outline-primary" size="sm"
          onClick={() => navigate(`/admin/user/${userId}/bio`)}>
          종합 ADHD 점수
        </Button>
      </div>

      {/* ▶ 세션 카드 렌더링 */}
      {games.length === 0 ? (
        <p>등록된 훈련 정보가 없습니다.</p>
      ) : (
        games.map(game => (
          <Card
            key={game.id}
            className="mb-3 p-3"
            style={{
              cursor: 'pointer',
              transition: 'transform .1s, box-shadow .2s',
            }}
            onClick={() => navigate(`/admin/member/${userId}/session/${game.id}`)}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.15)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Row className="align-items-center">
              <Col><strong>세션 ID:</strong> {game.id}</Col>
              <Col><strong>카테고리:</strong> {game.category || '미분류'}</Col>
              <Col><strong>진행 시간:</strong> {new Date(game.created_at).toLocaleString('ko-KR')}</Col>
            </Row>
          </Card>
        ))
      )}
    </Container>
  );
};

export default MemberDetailPage;