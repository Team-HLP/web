// SessionDetailPage.jsx

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import '../styles/EyeCircle.css';

const SessionDetailPage = () => {
  // URL 파라미터에서 userId와 gameId 추출
  const { userId, gameId } = useParams();
  const navigate = useNavigate();

  // 게임 세션 데이터 상태
  const [gameData, setGameData] = useState(null);

  // 동공 위치 조작을 위한 ref 선언
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const leftPupilRef = useRef(null);
  const rightPupilRef = useRef(null);

  // 게임 세션 데이터 불러오기
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

  // 마우스 움직임에 따라 동공이 움직이도록 하는 함수
  const handleMouseMove = (e, scleraRef, pupilRef) => {
    if (!scleraRef.current || !pupilRef.current) return;

    const sclera = scleraRef.current.getBoundingClientRect();
    const pupil = pupilRef.current;

    // sclera 내부에서의 마우스 상대 좌표 계산
    const offsetX = e.clientX - sclera.left;
    const offsetY = e.clientY - sclera.top;

    const centerX = sclera.width / 2;
    const centerY = sclera.height / 2;

    const dx = offsetX - centerX;
    const dy = offsetY - centerY;

    const maxDist = 15; // 동공 최대 이동 거리(px)
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDist);

    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;

    // 동공 이동 적용
    pupil.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
  };

  // 마우스가 떠났을 때 동공 위치 초기화
  const resetPupil = (pupilRef) => {
    if (pupilRef.current) {
      pupilRef.current.style.transform = `translate(-50%, -50%)`;
    }
  };

  // 세션 데이터가 아직 로딩 중이면 로딩 메시지 출력
  if (!gameData) return <div className="container mt-5">세션 정보를 불러오는 중...</div>;

  return (
    <Container className="mt-5">
      {/* 헤더 영역 */}
      <Row className="mb-4 align-items-center justify-content-between">
        <Col><h2>훈련 세션 조회</h2></Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={() => navigate(-1)}>뒤로 가기</Button>
        </Col>
      </Row>

      {/* 본문 카드: 훈련 정보 + 생체 정보 시각화 */}
      <Card className="p-4">
        {/* 훈련 번호, 시간 정보 */}
        <Row className="mb-4">
          <Col><strong>훈련 번호:</strong> {gameData.id}</Col>
          <Col className="text-end"><strong>진행 시간:</strong> {gameData.created_at}</Col>
        </Row>

        {/* 동공 크기 및 눈깜빡임 시각화 */}
        <Row className="text-center mb-4">
          {/* 왼쪽 동공 */}
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
                    width: `${(gameData.eye_data?.base_pupil_size?.left ?? 0) * 15}px`,
                    height: `${(gameData.eye_data?.base_pupil_size?.left ?? 0) * 15}px`,
                  }}
                >
                  {gameData.eye_data?.base_pupil_size?.left ?? 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          {/* 오른쪽 동공 */}
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
                    width: `${(gameData.eye_data?.base_pupil_size?.right ?? 0) * 15}px`,
                    height: `${(gameData.eye_data?.base_pupil_size?.right ?? 0) * 15}px`,
                  }}
                >
                  {gameData.eye_data?.base_pupil_size?.right ?? 'N/A'}
                </div>

              </div>
            </div>
          </Col>

          {/* 눈 깜빡임 수 */}
          <Col>
            <div style={{ fontSize: '0.9rem' }}>총 눈깜빡임 수</div>
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h4 style={{ margin: 0 }}>
                {gameData.eye_data?.blink_eye_count ?? 'N/A'}
              </h4>
            </div>
          </Col>
        </Row>

        {/* 뇌파 시각화 영역 (추후 연동) */}
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