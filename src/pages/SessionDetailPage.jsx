// src/pages/SessionDetailPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveLine } from '@nivo/line';
import {
  Button, Card, Container, Row, Col, Modal, Form,
} from 'react-bootstrap';
import '../styles/EyeCircle.css';

/* ────────────────────── 상수 ────────────────────── */
const WINDOW = 20;          // pupil 이동평균 구간
const EEG_BANDS = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
const EEG_COLORS = {
  delta: '#1f77b4',
  theta: '#ff7f0e',
  alpha: '#2ca02c',
  beta: '#d62728',
  gamma: '#9467bd',
};
/* ──────────────────────────────────────────────── */

export default function SessionDetailPage() {
  /* ───── 기본 state ───── */
  const { userId, gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);

  /* pupil-zoom 모달 */
  const [zoom, setZoom] = useState({
    show: false,
    side: 'left',        // 'left' | 'right'
    data: [],
    baseline: 0,
    range: [0, 0],
  });

  /* EEG 표시 여부 토글 */
  const [eegVisible, setEegVisible] = useState(
    EEG_BANDS.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  );

  /* ───── 세션 데이터 로드 ───── */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        const { data } = await axios.get(
          `https://api-hlp.o-r.kr/admin/game/${gameId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { user_id: userId }
          },
        );
        setGameData(data);
      } catch (err) {
        console.error('세션 로드 실패', err);
      }
    })();
  }, [userId, gameId]);

  if (!gameData) return <div className="container mt-5">세션 정보를 불러오는 중...</div>;

  /* ───── pupil util : 이동 평균 ───── */
  const smooth = (records, key /* 'left' | 'right' */) => {
    if (!records?.length) return [];
    const buckets = [];
    records.forEach((r, i) => {
      const b = Math.floor(i / WINDOW);
      if (!buckets[b]) buckets[b] = { t: 0, v: 0, c: 0 };
      buckets[b].t += r.time_stamp;
      buckets[b].v += r.pupil_size[key];
      buckets[b].c += 1;
    });
    return buckets.map(({ t, v, c }) => ({
      x: +(t / c).toFixed(2),
      y: +(v / c).toFixed(3),
    }));
  };

  /* ───── pupil 그래프 데이터 ───── */
  const rec = gameData.eye_data?.pupil_records ?? [];
  const baseline = gameData.eye_data?.base_pupil_size ?? {};

  const rightSmooth = smooth(rec, 'right');
  const leftSmooth = smooth(rec, 'left');

  const rightGraphData = [
    { id: '오른쪽 동공', data: rightSmooth },
    { id: '오른쪽 기준', data: rightSmooth.map(d => ({ ...d, y: baseline.right ?? 0 })) },
  ];
  const leftGraphData = [
    { id: '왼쪽 동공', data: leftSmooth },
    { id: '왼쪽 기준', data: leftSmooth.map(d => ({ ...d, y: baseline.left ?? 0 })) },
  ];

  /* ───── EEG 그래프 데이터 ───── */
  const eegLines = EEG_BANDS
    .map(band => ({
      id: band,
      color: EEG_COLORS[band],
      data: (gameData.eeg_data ?? []).map(d => ({
        x: d.time_stamp,
        y: d[band],
      })),
    }))
    .filter(line => eegVisible[line.id]);   // 토글 반영

  /* ───── 공통 Nivo 옵션 ───── */
  const common = {
    margin: { top: 10, right: 50, bottom: 40, left: 50 },
    xScale: { type: 'linear' },
    yScale: { type: 'linear', min: 'auto', max: 'auto' },
    axisBottom: { legend: '시간', legendOffset: 30, legendPosition: 'middle' },
    axisLeft: { legend: '크기', legendOffset: -38, legendPosition: 'middle' },
    pointSize: 0,
    curve: 'monotoneX',
    lineWidth: 1.5,
    useMesh: true,
  };

  /* ───── pupil 확대 모달 열기 ───── */
  const openZoom = side => slice => {
    if (!slice?.points?.length) return;

    const center = slice.points[0].data.x;
    const half = WINDOW / 2;
    const minT = center - half;
    const maxT = center + half;

    const raw = rec
      .filter(r => r.time_stamp >= minT && r.time_stamp <= maxT)
      .map(r => ({ x: r.time_stamp, y: r.pupil_size[side] }));

    setZoom({
      show: true,
      side,
      data: raw,
      baseline: baseline[side] ?? 0,
      range: [+(minT.toFixed(1)), +(maxT.toFixed(1))],
    });
  };

  /* ───── UI 렌더 ───── */
  return (
    <Container className="mt-5">
      {/* 헤더 */}
      <Row className="mb-4 align-items-center justify-content-between">
        <Col><h2>훈련 세션 조회</h2></Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={() => navigate(-1)}>뒤로 가기</Button>
        </Col>
      </Row>

      <Card className="p-4">
        {/* 요약 */}
        <Row className="mb-4 fw-semibold">
          <Col>훈련 번호 : {gameData.id ?? gameId}</Col>
          <Col className="text-center">
            총 눈깜빡임 수 : {gameData.eye_data?.blink_eye_count ?? 'N/A'}
          </Col>
          <Col className="text-end">
            플레이 시간 : {gameData.played_at ?? gameData.created_at ?? 'N/A'}
          </Col>
        </Row>

        {/* pupil 그래프 */}
        <div className="graph-stack">
          <div style={{ height: 250 }}>
            <h6 className="text-center mb-2">오른쪽 동공 크기 (평활)</h6>
            <ResponsiveLine
              {...common}
              data={rightGraphData}
              enableSlices="x"
              onClick={openZoom('right')}
              colors={{ scheme: 'category10' }}
            />
          </div>

          <div style={{ height: 250 }}>
            <h6 className="text-center mb-2">왼쪽 동공 크기 (평활)</h6>
            <ResponsiveLine
              {...common}
              data={leftGraphData}
              enableSlices="x"
              onClick={openZoom('left')}
              colors={{ scheme: 'category10' }}
            />
          </div>
        </div>

        {/* ─── EEG 토글 & 그래프 ─── */}
        <Row className="mt-4">
          <Col>
            {/* 토글 스위치 */}
            <Form>
              <div className="d-flex flex-wrap gap-3 mb-2">
                {EEG_BANDS.map(band => (
                  <Form.Check
                    key={band}
                    type="switch"
                    id={`toggle-${band}`}
                    label={band.toUpperCase()}
                    checked={eegVisible[band]}
                    onChange={() =>
                      setEegVisible(v => ({ ...v, [band]: !v[band] }))
                    }
                    style={{ color: EEG_COLORS[band], fontWeight: 500 }}
                  />
                ))}
              </div>
            </Form>

            {/* EEG 그래프 */}
            {eegLines.length ? (
              <div style={{ height: 300 }}>
                <ResponsiveLine
                  {...common}
                  data={eegLines}
                  axisLeft={{ ...common.axisLeft, legend: '전압(μV)' }}
                  colors={({ id }) => EEG_COLORS[id]}
                />
              </div>
            ) : (
              <div className="text-muted py-4 text-center">
                표시할 EEG 밴드가 없습니다.
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* pupil 확대 모달 */}
      <Modal
        show={zoom.show}
        size="lg"
        onHide={() => setZoom(z => ({ ...z, show: false }))}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {zoom.side === 'left' ? '왼쪽' : '오른쪽'} 동공 RAW 확대&nbsp;·&nbsp;t ≈{' '}
            {zoom.range[0]} – {zoom.range[1]}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: 300 }}>
            <ResponsiveLine
              {...common}
              /* x 축을 확대 범위로 고정 */
              xScale={{ type: 'linear', min: zoom.range[0], max: zoom.range[1] }}
              pointSize={3}
              data={[
                { id: 'raw', data: zoom.data },
                { id: 'baseline', data: zoom.data.map(d => ({ ...d, y: zoom.baseline })) },
              ]}
              colors={({ id }) => (id === 'raw' ? '#1f77b4' : '#ff7f0e')}
            />
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
}