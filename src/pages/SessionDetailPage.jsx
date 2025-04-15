// SessionDetailPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import '../styles/EyeCircle.css';

const SessionDetailPage = () => {
  const { userId, gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    const fetchGameDetail = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`https://api-hlp.o-r.kr/admin/game/${gameId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { user_id: userId },
        });
        setGameData(res.data);
      } catch (error) {
        console.error('게임 세션 정보 불러오기 실패:', error);
      }
    };

    fetchGameDetail();
  }, [userId, gameId]);

  if (!gameData) return <div className="container mt-5">세션 정보를 불러오는 중...</div>;

  return (
    <Container className="mt-5">
      <Row className="mb-4 align-items-center justify-content-between">
        <Col><h2>훈련 세션 조회</h2></Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={() => navigate(-1)}>뒤로 가기</Button>
        </Col>
      </Row>

      <Card className="p-4">
        <Row className="mb-4">
          <Col><strong>훈련 번호:</strong> {gameData.id}</Col>
          <Col className="text-end"><strong>진행 시간:</strong> {gameData.created_at}</Col>
        </Row>

        <Row className="text-center mb-4">
          <Col>
            <div style={{ fontSize: '0.9rem', marginBottom: '10px' }}>왼쪽 동공 크기</div>
            <div className="eye-wrapper">
              <div className="eye-sclera">
                <div
                  className="eye-pupil"
                  style={{
                    width: `${gameData.avg_left_eye_pupil_size * 18}px`,
                    height: `${gameData.avg_left_eye_pupil_size * 18}px`,
                  }}
                >
                  {gameData.avg_left_eye_pupil_size}
                </div>
              </div>
            </div>
          </Col>

          <Col>
            <div style={{ fontSize: '0.9rem', marginBottom: '10px' }}>오른쪽 동공 크기</div>
            <div className="eye-wrapper">
              <div className="eye-sclera">
                <div
                  className="eye-pupil"
                  style={{
                    width: `${gameData.avg_right_eye_pupil_size * 18}px`,
                    height: `${gameData.avg_right_eye_pupil_size * 18}px`,
                  }}
                >
                  {gameData.avg_right_eye_pupil_size}
                </div>
              </div>
            </div>
          </Col>
          <Col>
            <div style={{ fontSize: '0.9rem' }}>총 눈깜빡임 수</div>
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h4 style={{ margin: 0 }}>{gameData.blink_eye_count}</h4>
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <div style={{ height: '300px', background: '#f1f1f1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <span>뇌파 그래프 (추후 연동)</span>
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default SessionDetailPage;