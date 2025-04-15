import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import '../styles/EyeCircle.css';

const SessionDetailPage = () => {
  const { userId, gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);

  // ref로 DOM 접근
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const leftPupilRef = useRef(null);
  const rightPupilRef = useRef(null);

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

  // 동공이 마우스 따라다니는 로직
  const handleMouseMove = (e, scleraRef, pupilRef) => {
    if (!scleraRef.current || !pupilRef.current) return;

    const sclera = scleraRef.current.getBoundingClientRect();
    const pupil = pupilRef.current;

    // 마우스가 sclera 내부에서의 상대 좌표
    const offsetX = e.clientX - sclera.left;
    const offsetY = e.clientY - sclera.top;

    const centerX = sclera.width / 2;
    const centerY = sclera.height / 2;

    const dx = offsetX - centerX;
    const dy = offsetY - centerY;

    const maxDist = 15; // 최대 이동 px
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDist);

    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;

    pupil.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
  };

  const resetPupil = (pupilRef) => {
    if (pupilRef.current) {
      pupilRef.current.style.transform = `translate(-50%, -50%)`;
    }
  };

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
            <div
              className="eye-wrapper"
              ref={leftEyeRef}
              onMouseMove={(e) => handleMouseMove(e, leftEyeRef, leftPupilRef)}
              onMouseLeave={() => resetPupil(leftPupilRef)}
            >
              <div className="eye-sclera">
                <div
                  className="eye-pupil"
                  ref={leftPupilRef}
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
            <div
              className="eye-wrapper"
              ref={rightEyeRef}
              onMouseMove={(e) => handleMouseMove(e, rightEyeRef, rightPupilRef)}
              onMouseLeave={() => resetPupil(rightPupilRef)}
            >
              <div className="eye-sclera">
                <div
                  className="eye-pupil"
                  ref={rightPupilRef}
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