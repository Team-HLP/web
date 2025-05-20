// src/pages/BioStatisticsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Row, Col, Card,
  Button, Spinner, Badge,
} from 'react-bootstrap';
import { ResponsiveRadialBar } from '@nivo/radial-bar';
import { ResponsiveLine } from '@nivo/line';

const API_BASE = 'https://api-hlp.o-r.kr';

const BioStatisticsPage = () => {
  const { userId } = useParams();
  const navigate  = useNavigate();

  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  /* ─── 색상 유틸 ─── */
  const getScoreColor = v => (v >= 36 ? '#4ade80' : v >= 18 ? '#fbbf24' : '#f87171');

  const statusTheme = {
    정상: { fg: '#16a34a', bg: '#ecfdf5' },
    주의: { fg: '#d97706', bg: '#fffbeb' },
    위험: { fg: '#dc2626', bg: '#fef2f2' },
  };

  /* ─── 데이터 요청 ─── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        const { data } = await axios.get(
          `${API_BASE}/admin/game/statistics/bio`,
          { params: { user_id: userId }, headers: { Authorization: `Bearer ${token}` } },
        );
        if (mounted) setScores(data);
      } catch (err) {
        setError(err.response?.data?.detail ?? '서버 오류');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  /* ─── 로딩·에러 처리 ─── */
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" />
    </div>
  );
  if (error) return (
    <Container className="py-5 text-center">
      <p className="text-danger mb-4">{error}</p>
      <Button variant="secondary" onClick={() => navigate(-1)}>뒤로가기</Button>
    </Container>
  );
  if (!scores.length) return (
    <Container className="py-5 text-center">
      <h4>측정 기록이 없습니다.</h4>
      <Button variant="secondary" onClick={() => navigate(-1)}>뒤로가기</Button>
    </Container>
  );

  /* ─── 시각화용 가공 ─── */
  const latest = scores[scores.length - 1];

  const impulseLine = {
    id: 'impulse_inhibition_score',
    data: scores.map((v, i) => ({ x: i + 1, y: v.impulse_inhibition_score })),
  };
  const concentrationLine = {
    id: 'concentration_score',
    data: scores.map((v, i) => ({ x: i + 1, y: v.concentration_score })),
  };

  const statusCount = scores.reduce((acc, s) => {
    acc[s.adhd_status] = (acc[s.adhd_status] || 0) + 1; return acc;
  }, {});

  /* ─── 렌더 ─── */
  return (
    <Container className="py-4">
      {/* 헤더 */}
      <Row className="mb-3">
        <Col><h2>회원 {userId} - ADHD 종합 상태</h2></Col>
        <Col className="text-end">
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>목록으로</Button>
        </Col>
      </Row>

      {/* 게이지 & 최근 판정 */}
      <Row xs={1} md={3} className="g-4 mb-4">
        {['impulse_inhibition_score', 'concentration_score'].map((k, idx) => (
          <Col key={k}>
            <Card className="h-100 text-center">
              <Card.Body>
                <Card.Title>{idx ? '집중력' : '충동 억제'} 점수</Card.Title>

                <div style={{ height: 140 }}>
                  <ResponsiveRadialBar
                    data={[{ id: k, data: [{ x: '', y: latest[k] }] }]}
                    maxValue={36}
                    startAngle={-90}
                    endAngle={90}
                    innerRadius={0.55}
                    padAngle={0.35}
                    cornerRadius={3}
                    enableRadialGrid={false}
                    enableCircularGrid={false}
                    enableLabels={false}
                    colors={d => getScoreColor(d.data.y)}
                    margin={{ top: 30, bottom: 10 }}
                    radialAxisStart={{
                      tickSize: 4,
                      tickPadding: 2,
                      tickRotation: 0,
                      tickFormat: v => v,
                      legend: '',
                    }}
                  />
                </div>

                <h5 className="mt-2">{latest[k].toFixed(2)} / 27</h5>
              </Card.Body>
            </Card>
          </Col>
        ))}

        <Col>
          <Card
            className="h-100 text-center shadow-sm"
            style={{ background: statusTheme[latest.adhd_status].bg }}
          >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <Card.Title className="mb-3">최근 세션 판정</Card.Title>
              <span
                style={{
                  fontSize: '3rem',
                  fontWeight: 600,
                  color: statusTheme[latest.adhd_status].fg,
                }}
              >
                {latest.adhd_status}
              </span>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 추세 차트 */}
      <Row>
        <Col>
          <Card>
            <Card.Body style={{ height: 350 }}>
              <Card.Title>점수 추세</Card.Title>
              <ResponsiveLine
                data={[impulseLine, concentrationLine]}
                enableSlices="x"
                useMesh={false}
                sliceTooltip={({ slice }) => {
                  // 회차 인덱스(0-base) → 원본 scores에 접근
                  const idx = slice.points[0].data.x - 1;
                  const status = scores[idx]?.adhd_status ?? '';

                  return (
                    <div style={{
                      background: '#fff',
                      padding: '6px 9px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      fontSize: 12,
                      maxWidth: 160,
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {slice.points[0].data.xFormatted}회차
                      </div>

                      {slice.points.map(pt => {
                        const label = pt.serieId || (pt.serie && pt.serie.id) || pt.id.split('.')[0];
                        return (
                          <div key={pt.id} style={{ color: pt.serieColor }}>
                            {label}: {pt.data.yFormatted}
                          </div>
                        );
                      })}

                      {/* ADHD 상태 한 줄 추가 */}
                      <div style={{
                        marginTop: 4,
                        color: statusTheme[status]?.fg ?? '#000',
                        fontWeight: 500,
                      }}>
                        상태: {status}
                      </div>
                    </div>
                  );
                }}
                animate={false}
                margin={{ top: 40, right: 20, bottom: 50, left: 60 }}
                yScale={{ type: 'linear', min: 0, max: 36 }}
                axisBottom={{ legend: '측정 회차', legendOffset: 36 }}
                axisLeft={{ legend: '점수', legendOffset: -40 }}
                colors={{ scheme: 'category10' }}
                pointSize={6}
                pointBorderWidth={2}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 상태 분포 뱃지 */}
      <Row className="mt-3">
        <Col>
          {Object.entries(statusCount).map(([status, cnt]) => (
            <Badge
              key={status}
              bg={status === '정상' ? 'success'
                : status === '주의' ? 'warning' : 'danger'}
              className="me-2"
            >
              {status}: {cnt}
            </Badge>
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default BioStatisticsPage;