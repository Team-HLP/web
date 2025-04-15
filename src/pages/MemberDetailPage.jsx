import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const MemberDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('https://api-hlp.o-r.kr/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = res.data.find((u) => u.id === Number(userId));
      setUser(userData);
    } catch (error) {
      console.error('회원 정보 불러오기 실패:', error);
    }
  }, [userId]);

  const fetchGames = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`https://api-hlp.o-r.kr/admin/game`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: userId },
      });
      setGames(res.data);
    } catch (error) {
      console.error('게임 정보 불러오기 실패:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
    fetchGames();
  }, [fetchUser, fetchGames]);

  if (!user) return <div className="container mt-5">회원 정보를 불러오는 중...</div>;

  return (
    <Container className="mt-5">
      <Row className="mb-4 align-items-center justify-content-between">
        <Col><h2>회원 상세 정보</h2></Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={() => navigate(-1)}>뒤로 가기</Button>
        </Col>
      </Row>

      <Card className="p-4 mb-4">
        <Row>
          <Col><strong>ID:</strong> {user.login_id}</Col>
          <Col><strong>이름:</strong> {user.name}</Col>
        </Row>
        <Row>
          <Col><strong>전화번호:</strong> {user.phone_number}</Col>
          <Col><strong>나이:</strong> {user.age}세</Col>
        </Row>
        <Row>
          <Col><strong>성별:</strong> {user.sex}</Col>
          <Col><strong>생성일:</strong> {user.created_at}</Col>
        </Row>
      </Card>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">훈련 기록</h5>
        <Button variant="outline-primary" size="sm" onClick={() => { /* TODO */ }}>
          전체 통계 보기
        </Button>
      </div>

      {games.length === 0 ? (
        <p>등록된 훈련 정보가 없습니다.</p>
      ) : (
        games.map((game, idx) => (
          <Card key={idx} className="mb-3 p-3">
            <Row className="align-items-center">
              <Col><strong>훈련 번호:</strong> {game.id}</Col>
              <Col><strong>진행 시간:</strong> {new Date(game.created_at).toLocaleString('ko-KR')}</Col>
              <Col xs="auto">
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => navigate(`/admin/member/${userId}/session/${game.id}`)}
                >
                  세션 조회
                </Button>
              </Col>
            </Row>
          </Card>
        ))
      )}
    </Container>
  );
};

export default MemberDetailPage;