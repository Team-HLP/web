// pages/StatisticsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ResponsiveLine } from '@nivo/line';
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Spinner,
  ButtonGroup,
} from 'react-bootstrap';

const StatisticsPage = () => {
  const { userId }   = useParams();
  const   navigate   = useNavigate();

  /* ---- 데이터 상태 ---- */
  const [loading, setLoading] = useState(true);
  const [blink , setBlink ] = useState([]);   // 눈깜빡임
  const [pupilL, setPupilL] = useState([]);   // 왼쪽 동공
  const [pupilR, setPupilR] = useState([]);   // 오른쪽 동공
  const [showLeft, setShowLeft] = useState(true);   // true: 왼쪽, false: 오른쪽

  /* ---- 세션 불러오기 ---- */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        const { data } = await axios.get('https://api-hlp.o-r.kr/admin/game', {
          headers: { Authorization: `Bearer ${token}` },
          params : { user_id: userId },
        });

        const sorted = [...data].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        setBlink([
          {
            id  : '눈깜빡임 수',
            data: sorted.map(s => ({
              x: s.created_at.slice(0, 10),
              y: s.blink_eye_count,
            })),
          },
        ]);

        setPupilL([
          {
            id  : '왼쪽 동공 크기',
            data: sorted.map(s => ({
              x: s.created_at.slice(0, 10),
              y: s.avg_left_eye_pupil_size,
            })),
          },
        ]);

        setPupilR([
          {
            id  : '오른쪽 동공 크기',
            data: sorted.map(s => ({
              x: s.created_at.slice(0, 10),
              y: s.avg_right_eye_pupil_size,
            })),
          },
        ]);
      } catch (err) {
        console.error('세션 로드 실패', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  /* ---- 공통 옵션 ---- */
  const common = {
    margin      : { top: 40, right: 30, bottom: 70, left: 60 },
    xScale      : { type: 'point' },
    yScale      : { type: 'linear', min: 'auto', max: 'auto', stacked: false },
    pointSize   : 8,
    pointBorderWidth: 2,
    useMesh     : true,
    axisBottom  : {
      tickRotation: -45,
      legend      : '날짜',
      legendOffset: 50,
      legendPosition: 'middle',
    },
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-5 pb-5">
      {/* 헤더 */}
      <Row className="mb-4 align-items-center justify-content-between">
        <Col><h2>회원 {userId} – 전체 통계</h2></Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={() => navigate(-1)}>뒤로 가기</Button>
        </Col>
      </Row>

      {/* 1) 눈깜빡임 추이 */}
      <Card className="p-4 mb-4">
        <h5 className="mb-3">눈깜빡임 추이</h5>
        <div style={{ height: 350 }}>
          <ResponsiveLine
            data={blink}
            {...common}
            axisLeft={{
              legend: '눈깜빡임 수',
              legendOffset: -50,
              legendPosition: 'middle',
            }}
            colors={{ scheme: 'category10' }}
          />
        </div>
      </Card>

      {/* 2) 동공 크기 추이 – 토글 */}
      <Card className="p-4 mb-4">
        <Row className="mb-2">
          <Col><h5 className="mb-0">동공 크기 추이</h5></Col>
          <Col xs="auto">
            <ButtonGroup size="sm">
              <Button
                variant={showLeft ? 'primary' : 'outline-primary'}
                onClick={() => setShowLeft(true)}
              >
                왼쪽
              </Button>
              <Button
                variant={!showLeft ? 'primary' : 'outline-primary'}
                onClick={() => setShowLeft(false)}
              >
                오른쪽
              </Button>
            </ButtonGroup>
          </Col>
        </Row>

        <div style={{ height: 350, overflow: 'visible' }}>
          <ResponsiveLine
            data={showLeft ? pupilL : pupilR}
            {...common}
            axisLeft={{
              legend: '평균 동공 크기',
              legendOffset: -50,
              legendPosition: 'middle',
            }}
            colors={{ scheme: 'set2' }}
          />
        </div>
      </Card>
    </Container>
  );
};

export default StatisticsPage;