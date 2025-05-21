// src/pages/BioStatisticsPage.jsx
import React, { useEffect, useState, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Row, Col, Card,
  Button, Spinner, Badge, Form,
} from 'react-bootstrap';
import { ResponsiveRadialBar } from '@nivo/radial-bar';
import { ResponsiveLine } from '@nivo/line';

const API_BASE = 'https://api-hlp.o-r.kr';

const BioStatisticsPage = () => {
  const { userId } = useParams();
  const navigate  = useNavigate();

  const [scores, setScores]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selectedIdx, setIdx]           = useState(null);
  const [showImpulse, setShowImpulse]   = useState(true);
  const [showConcentration, setShowConcentration] = useState(true);

  const getScoreColor = v => (v >= 36 ? '#4ade80' : v >= 18 ? '#fbbf24' : '#f87171');
  const statusTheme   = {
    정상: { fg: '#16a34a', bg: '#ecfdf5' },
    주의: { fg: '#d97706', bg: '#fffbeb' },
    위험: { fg: '#dc2626', bg: '#fef2f2' },
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token  = localStorage.getItem('access_token');
        const { data } = await axios.get(
          `${API_BASE}/admin/game/statistics/bio`,
          {
            params: { user_id: userId },
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (mounted) {
          setScores(data);
          setIdx(data.length - 1);
        }
      } catch (err) {
        setError(err.response?.data?.detail ?? '서버 오류');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

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

  const current = scores[selectedIdx] ?? scores[scores.length - 1];

  const impulseLine = {
    id: 'impulse_inhibition_score',
    data: scores.map((v, i) => ({
      x: i + 1,
      y: v.impulse_inhibition_score,
    })),
  };
  const concentrationLine = {
    id: 'concentration_score',
    data: scores.map((v, i) => ({
      x: i + 1,
      y: v.concentration_score,
    })),
  };

  const statusCount = scores.reduce((acc, s) => {
    acc[s.adhd_status] = (acc[s.adhd_status] || 0) + 1;
    return acc;
  }, {});

  const handleChartClick = item => {
    const x1 = item.data?.x ?? item.points?.[0]?.data.x;
    if (x1) {
      const idx = x1 - 1;
      if (scores[idx]) setIdx(idx);
    }
  };

  // 토글에 따라 보일 데이터만
  const chartData = [
    ...(showImpulse       ? [impulseLine]       : []),
    ...(showConcentration ? [concentrationLine] : []),
  ];

  return (
    <Container className="py-4">
      {/* 헤더 */}
      <Row className="mb-3">
        <Col><h4>회원 {userId} - ADHD 종합 상태</h4></Col>
        <Col className="text-end">
          <Button variant="outline-secondary" className="border-0" onClick={() => navigate(-1)}>
            회원 상세 정보로
          </Button>
        </Col>
      </Row>

      {/* 게이지 · 판정 */}
      <Row xs={1} md={3} className="g-4 mb-4">
        {['impulse_inhibition_score', 'concentration_score'].map((k, idx) => (
          <Col key={k}>
            <Card className="h-100 text-center">
              <Card.Body>
                <Card.Title>{idx ? '집중력' : '충동 억제'} 점수</Card.Title>
                <div style={{ height: 140 }}>
                  <ResponsiveRadialBar
                    data={[{ id: k, data: [{ x: '', y: current[k] }] }]}
                    maxValue={27}
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
                  />
                </div>
                <h5 className="mt-2">{current[k].toFixed(2)} / 27</h5>
              </Card.Body>
            </Card>
          </Col>
        ))}

        <Col>
          <Card
            className="h-100 text-center shadow-sm"
            style={{ background: statusTheme[current.adhd_status].bg }}
          >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <Card.Title className="mb-3">선택 세션 판정</Card.Title>
              <span
                style={{
                  fontSize: '3rem',
                  fontWeight: 600,
                  color: statusTheme[current.adhd_status].fg,
                }}
              >
                {current.adhd_status}
              </span>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 토글 스위치 */}
      <Row className="mb-3">
        <Col xs="auto">
          <Form.Check
            type="switch"
            id="impulse-toggle"
            label="충동 억제"
            checked={showImpulse}
            onChange={() => setShowImpulse(prev => !prev)}
          />
        </Col>
        <Col xs="auto">
          <Form.Check
            type="switch"
            id="concentration-toggle"
            label="집중력"
            checked={showConcentration}
            onChange={() => setShowConcentration(prev => !prev)}
          />
        </Col>
      </Row>

      {/* 추세 차트 */}
      <Row>
        <Col>
          <Card>
            <Card.Body style={{ height: 350 }}>
              <Card.Title>점수 추세</Card.Title>
              <ResponsiveLine
                data={chartData}
                enableSlices="x"
                useMesh={true}
                onClick={handleChartClick}
                sliceTooltip={({ slice }) => {
                  const idx    = slice.points[0].data.x - 1;
                  const status = scores[idx]?.adhd_status ?? '';
                  return (
                    <div style={{
                      background: '#fff',
                      padding: 10,
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      fontSize: 13,
                      minWidth: 120,
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        {slice.points[0].data.xFormatted}회차
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto auto',
                        columnGap: 8,
                        rowGap: 2,
                        marginBottom: 6,
                      }}>
                        {slice.points.map(pt => {
                          const label =
                            pt.serieId
                            ?? pt.serie?.id
                            ?? (typeof pt.id === 'string' ? pt.id.split('.')[0] : '');
                          return (
                            <Fragment key={pt.id}>
                              <span style={{ color: pt.serieColor }}>{label}</span>
                              <span style={{ textAlign: 'right' }}>{pt.data.yFormatted}</span>
                            </Fragment>
                          );
                        })}
                      </div>
                      <div style={{
                        fontWeight: 500,
                        color: statusTheme[status]?.fg ?? '#000',
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
          {Object.entries(statusCount).map(([st, cnt]) => (
            <Badge
              key={st}
              bg={st === '정상' ? 'success' : st === '주의' ? 'warning' : 'danger'}
              className="me-2"
            >
              {st}: {cnt}
            </Badge>
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default BioStatisticsPage;