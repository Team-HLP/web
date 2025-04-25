// StatisticsPage.jsx

// 통계(추이) 페이지 – 첫 스켈레톤
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ResponsiveLine } from '@nivo/line';
import { Container, Row, Col, Button, Card, Spinner } from 'react-bootstrap';

const StatisticsPage = () => {
  const { userId } = useParams();          // URL: /admin/member/:userId/statistics
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(null);   // 전체 세션 원본
  const [chartData, setChartData] = useState([]);   // nivo 형식

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('https://api-hlp.o-r.kr/admin/game', {
          headers: { Authorization: `Bearer ${token}` },
          params: { user_id: userId },
        });
        setSessions(res.data);

        /* ---- ① nivo 형식으로 변환 -------------------------- */
        const dates = res.data
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        setChartData([
          {
            id: '왼쪽 동공 크기',
            color: 'hsl(210, 70%, 50%)',
            data: dates.map(d => ({
              x: d.created_at.slice(0, 10),         // yyyy-mm-dd
              y: d.avg_left_eye_pupil_size,
            })),
          },
          {
            id: '오른쪽 동공 크기',
            color: 'hsl(130, 70%, 50%)',
            data: dates.map(d => ({
              x: d.created_at.slice(0, 10),
              y: d.avg_right_eye_pupil_size,
            })),
          },
          {
            id: '눈깜빡임 수',
            color: 'hsl(0, 70%, 50%)',
            data: dates.map(d => ({
              x: d.created_at.slice(0, 10),
              y: d.blink_eye_count,
            })),
          },
        ]);
      } catch (e) {
        console.error('세션 리스트 로딩 실패', e);
      }
    };

    fetchSessions();
  }, [userId]);

  return (
    <Container className="mt-5">
      {/* 헤더 */}
      <Row className="mb-4 align-items-center justify-content-between">
        <Col><h2>회원 {userId} – 전체 통계</h2></Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={() => navigate(-1)}>뒤로 가기</Button>
        </Col>
      </Row>

      {/* 차트 */}
      <Card className="p-4">
        {sessions === null ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : (
          <div style={{ height: 420 }}>
            <ResponsiveLine
              data={chartData}
              margin={{ top: 50, right: 30, bottom: 70, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
              axisBottom={{
                tickRotation: -45,
                legend: '날짜',
                legendOffset: 50,
                legendPosition: 'middle',
              }}
              axisLeft={{
                legend: '값',
                legendOffset: -40,
                legendPosition: 'middle',
              }}
              pointSize={8}
              pointBorderWidth={2}
              useMesh={true}
            />
          </div>
        )}
      </Card>
    </Container>
  );
};

export default StatisticsPage;