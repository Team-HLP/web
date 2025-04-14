// MemberDetailPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const MemberDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetchUser();
    fetchGames();
  }, []);

  const fetchUser = async () => {
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
  };

  const fetchGames = async () => {
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
  };

  if (!user)
    return <div className="container mt-5">회원 정보를 불러오는 중...</div>;

  return (
    <Container className="mt-5">
      <Row className="mb-4 align-items-center justify-content-between">
        <Col>
          <h2>회원 상세 정보</h2>
        </Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            뒤로 가기
          </Button>
        </Col>
      </Row>

      <Card className="p-4 mb-4">
        <Row>
          <Col><strong>ID:</strong> {user.loginId}</Col>
          <Col><strong>이름:</strong> {user.name}</Col>
        </Row>
        <Row>
          <Col><strong>나이:</strong> {user.age}세</Col>
          <Col><strong>성별:</strong> {user.sex}</Col>
        </Row>
        <Row>
          <Col><strong>생성일:</strong> {user.createdAt}</Col>
        </Row>
      </Card>

      <h5 className="mb-3">게임 기록</h5>
      {games.length === 0 ? (
        <p>등록된 게임 정보가 없습니다.</p>
      ) : (
        games.map((game, idx) => (
          <Card key={idx} className="mb-3 p-3">
            <Row>
              <Col><strong>게임 번호:</strong> {game["게임 번호"]}</Col>
              <Col><strong>플레이 시간:</strong> {new Date(game.created_at).toLocaleString('ko-KR')}</Col>
            </Row>
          </Card>
        ))
      )}
    </Container>
  );
};

export default MemberDetailPage;