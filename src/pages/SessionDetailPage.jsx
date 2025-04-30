import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveLine } from '@nivo/line';
import { Button, Card, Container, Row, Col, Modal } from 'react-bootstrap';
import '../styles/EyeCircle.css';

const WINDOW = 20; // 이동평균 구간(데이터 20개씩)

export default function SessionDetailPage() {
  /* ───── 기본 state ───── */
  const { userId, gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);

  /* zoom 모달 상태 (※ Hook 최상단 위치!) */
  const [zoom, setZoom] = useState({
    show: false,
    side: 'left',   // 'left' | 'right'
    data: [],
    baseline: 0,
    range: [0, 0],
  });

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
          }
        );
        setGameData(data);
      } catch (e) {
        console.error('세션 로드 실패', e);
      }
    })();
  }, [userId, gameId]);

  if (!gameData) {
    return <div className="container mt-5">세션 정보를 불러오는 중...</div>;
  }

  /* ───── util : 이동평균 ───── */
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

  /* ───── 그래프 데이터 ───── */
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

  /* 공통 옵션 */
  const common = {
    margin: { top: 10, right: 50, bottom: 40, left: 50 },
    xScale: { type: 'linear' },
    yScale: { type: 'linear', min: 'auto', max: 'auto' },
    axisBottom: { legend: '시간', legendOffset: 30, legendPosition: 'middle' },
    axisLeft: { legend: '크기', legendOffset: -38, legendPosition: 'middle' },
    pointSize: 0,
    curve: 'monotoneX',
    lineWidth: 1.5,
    colors: { scheme: 'category10' },
    useMesh: true,
  };

  /* ───── 확대 모달 열기 ───── */
  const openZoom = side => slice => {
    if (!slice?.points?.length) return;          // 안전 장치

    const center = slice.points[0].data.x;       // ← slice 로부터 x 값 추출
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

        {/* 그래프 */}
        <div className="graph-stack">
          <div style={{ height: 250 }}>
            <h6 className="text-center mb-2">오른쪽 동공 크기 (평활)</h6>
            <ResponsiveLine
              {...common}
              data={rightGraphData}
              enableSlices="x"
              onClick={openZoom('right')}
            />
          </div>

          <div style={{ height: 250 }}>
            <h6 className="text-center mb-2">왼쪽 동공 크기 (평활)</h6>
            <ResponsiveLine
              {...common}
              data={leftGraphData}
              enableSlices="x"
              onClick={openZoom('left')}
            />
          </div>
        </div>

        {/* 뇌파 placeholder */}
        <Row>
          <Col>
            <div style={{
              height: 300, background: '#f1f1f1',
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
              <span>뇌파 그래프 (추후 연동)</span>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 확대 모달 */}
      <Modal show={zoom.show} size="lg"
        onHide={() => setZoom(z => ({ ...z, show: false }))}>
        <Modal.Header closeButton>
          <Modal.Title>
            {zoom.side === 'left' ? '왼쪽' : '오른쪽'} 동공 RAW 확대
            &nbsp;·&nbsp; t ≈ {zoom.range[0]} – {zoom.range[1]}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: 300 }}>
            <ResponsiveLine
              {...common}
              xScale={{ type: 'linear', min: zoom.range[0], max: zoom.range[1] }}
              pointSize={3}
              data={[
                { id: 'raw', data: zoom.data },
                { id: 'baseline', data: zoom.data.map(d => ({ ...d, y: zoom.baseline })) },
              ]}
            />
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
}