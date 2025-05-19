import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveLine } from '@nivo/line';
import {
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
} from 'react-bootstrap';
import '../styles/EyeCircle.css';

/* ───────── 상수 ───────── */
const EEG_BANDS = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
const EEG_COLORS = {
  delta: '#1f77b4',  // 파랑
  theta: '#ffa600',  // 주황 
  alpha: '#2ca02c',  // 녹색
  beta: '#17becf',  // 청록           \
  gamma: '#9467bd',  // 보라
};
/* ─────────────────────── */

/* CSV util ------------------------------------------------------- */
const makeCSVandDownload = (filename, headerArr, rowsArr) => {
  const csv = [headerArr, ...rowsArr].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
/* ─────────────────────────────────────────────────────────────── */

export default function SessionDetailPage() {
  /* 기본 state ---------------------------------------------------- */
  const { userId, gameId } = useParams();
  const navigate = useNavigate();

  const [gameData, setGameData] = useState(null);
  const [windowSize, setWindowSize] = useState(1); // pupil smooth 구간
  const [eegWindow, setEegWindow] = useState(1);   // EEG  smooth 구간

  /* pupil 확대 모달 ---------------------------------------------- */
  const [zoom, setZoom] = useState({
    show: false,
    side: 'left',      // 'left' | 'right'
    data: [],
    baseline: 0,
    range: [0, 0],
  });

  /* EEG 확대 모달 ------------------------------------------------- */
  const [eegZoom, setEegZoom] = useState({
    show: false,
    data: [],          // [{ id, data }, ...]
    range: [0, 0],
  });

  /* EEG 표시 토글 (theta·beta 기본 ON) ---------------------------- */
  const [eegVisible, setEegVisible] = useState(
    EEG_BANDS.reduce(
      (acc, band) => ({ ...acc, [band]: band === 'theta' || band === 'beta' }),
      {},
    )
  );

  /* 세션 데이터 로드 --------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        const { data } = await axios.get(
          `https://api-hlp.o-r.kr/admin/game/${gameId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { user_id: userId },
          }
        );
        setGameData(data);
      } catch (e) {
        console.error('세션 로드 실패', e);

        // 사용자에게 안내 메시지
        if (e.response?.status === 500) {
          alert('서버 오류가 발생했습니다. 나중에 다시 시도해주세요.');
        } else if (e.response?.status === 404) {
          alert('해당 세션 정보를 찾을 수 없습니다.');
        } else if (e.response?.status === 401) {
          alert('인증이 만료되었습니다. 다시 로그인해주세요.');
          navigate('/login'); // 로그인 페이지로 이동 등 처리
        } else {
          alert('세션 정보를 불러오는데 실패했습니다.');
        }

        // 실패 시 기본 상태로 초기화
        setGameData(null);
      }
    })();
  }, [userId, gameId, navigate]);

  if (!gameData)
    return <div className="container mt-5">세션 정보를 불러오는 중...</div>;

  /* ---------- pupil smooth util -------------------------------- */
  const smooth = (records, key) => {
    if (!records?.length) return [];
    const buckets = [];
    records.forEach((r, i) => {
      const b = Math.floor(i / windowSize);
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

  /* ---------- EEG smooth util ---------------------------------- */
  const smoothEeg = (records, band) => {
    if (!records?.length) return [];
    const buckets = [];
    records.forEach((r, i) => {
      const b = Math.floor(i / eegWindow);
      if (!buckets[b]) buckets[b] = { t: 0, v: 0, c: 0 };
      buckets[b].t += r.time_stamp;
      buckets[b].v += r[band];
      buckets[b].c += 1;
    });
    return buckets.map(({ t, v, c }) => ({
      x: +(t / c).toFixed(2),
      y: +(v / c).toFixed(3),
    }));
  };

  /* ---------- pupil 그래프 데이터 ------------------------------- */
  const rec = gameData.eye_data?.pupil_records ?? [];
  const baseline = gameData.eye_data?.base_pupil_size ?? {};
  const rightData = smooth(rec, 'right');
  const leftData = smooth(rec, 'left');

  const rightGraph = [
    { id: '오른쪽 동공', data: rightData },
    { id: '오른쪽 기준', data: rightData.map(d => ({ ...d, y: baseline.right ?? 0 })) },
  ];
  const leftGraph = [
    { id: '왼쪽 동공', data: leftData },
    { id: '왼쪽 기준', data: leftData.map(d => ({ ...d, y: baseline.left ?? 0 })) },
  ];

  /* ---------- EEG 그래프 데이터 --------------------------------- */
  const eegLines = EEG_BANDS
    .map(b => ({
      id: b,
      color: EEG_COLORS[b],
      data: smoothEeg(gameData.eeg_data ?? [], b),
    }))
    .filter(l => eegVisible[l.id]);

  /* ---------- 공통 Nivo 옵션 ----------------------------------- */
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

  /* ---------- pupil 확대 모달 오픈 ------------------------------ */
  const openZoom = side => slice => {
    if (!slice?.points?.length) return;
    const center = slice.points[0].data.x;
    const half = windowSize / 2;
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

  /* ---------- EEG 확대 모달 오픈 ------------------------------- */
  const openEegZoom = slice => {
    if (!slice?.points?.length) return;

    const center = slice.points[0].data.x;
    const half = eegWindow / 2;
    const minT = center - half;
    const maxT = center + half;

    // 현재 표시 중인 밴드들
    const activeBands = EEG_BANDS.filter(b => eegVisible[b]);

    // 밴드별 RAW 추출
    const rawLines = activeBands.map(b => ({
      id: b,
      data: (gameData.eeg_data ?? [])
        .filter(r => r.time_stamp >= minT && r.time_stamp <= maxT)
        .map(r => ({ x: r.time_stamp, y: r[b] })),
    }));

    setEegZoom({
      show: true,
      data: rawLines,
      range: [+(minT.toFixed(1)), +(maxT.toFixed(1))],
    });
  };

  /* ---------- CSV 다운로드 -------------------------------------- */
  const downloadPupilCSV = () =>
    makeCSVandDownload(
      `session_${gameId}_pupil.csv`,
      ['time_stamp', 'left_pupil', 'right_pupil'],
      rec.map(r => [r.time_stamp, r.pupil_size.left, r.pupil_size.right])
    );

  const downloadEegCSV = () =>
    makeCSVandDownload(
      `session_${gameId}_eeg.csv`,
      ['time_stamp', ...EEG_BANDS],
      (gameData.eeg_data ?? []).map(d => [
        d.time_stamp,
        d.delta,
        d.theta,
        d.alpha,
        d.beta,
        d.gamma,
      ])
    );

  /* ---------- UI ----------------------------------------------- */
  return (
    <Container className="mt-5 pb-4">
      {/* 헤더 */}
      <Row className="mb-4 align-items-center justify-content-between">
        <Col>
          <h2>훈련 세션 조회</h2>
        </Col>
        <Col xs="auto">
          <ButtonGroup className="me-2">
            <Button
              size="sm"
              variant="outline-success"
              onClick={downloadPupilCSV}
            >
              Pupil CSV
            </Button>
            <Button size="sm" variant="outline-info" onClick={downloadEegCSV}>
              EEG CSV
            </Button>
          </ButtonGroup>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            뒤로 가기
          </Button>
        </Col>
      </Row>

      {/* 요약 카드 */}
      <Card className="p-4 mb-4">
        <Row className="fw-semibold align-items-center">
          <Col>훈련 번호 : {gameData.id ?? gameId}</Col>

          <Col className="text-center">
            총 눈깜빡임 수 : {gameData.eye_data?.blink_eye_count ?? 'N/A'}
          </Col>

          <Col className="text-end">
            플레이 시간 : {gameData.played_at ?? gameData.created_at ?? 'N/A'}
          </Col>

          {/* Pupil smooth 컨트롤 */}
          <Col xs="auto" className="d-flex align-items-center">
            <span className="me-2 fw-semibold">Pupil 평활:</span>
            <Form.Control
              type="number"
              value={windowSize}
              onChange={e => setWindowSize(Number(e.target.value) || 1)}
              style={{ width: 80 }}
              min={1}
            />
          </Col>

          {/* EEG smooth 컨트롤 */}
          <Col xs="auto" className="d-flex align-items-center">
            <span className="me-2 fw-semibold">EEG 평활:</span>
            <Form.Control
              type="number"
              value={eegWindow}
              onChange={e => setEegWindow(Number(e.target.value) || 1)}
              style={{ width: 80 }}
              min={1}
            />
          </Col>
        </Row>
      </Card>

      {/* 오른쪽 동공 카드 */}
      <Card className="p-4 mb-4">
        <h6 className="text-center mb-2">오른쪽 동공 크기 (평활)</h6>
        <div style={{ height: 250 }}>
          <ResponsiveLine
            {...common}
            data={rightGraph}
            enableSlices="x"
            onClick={openZoom('right')}
            colors={{ scheme: 'category10' }}
          />
        </div>
      </Card>

      {/* 왼쪽 동공 카드 */}
      <Card className="p-4 mb-4">
        <h6 className="text-center mb-2">왼쪽 동공 크기 (평활)</h6>
        <div style={{ height: 250 }}>
          <ResponsiveLine
            {...common}
            data={leftGraph}
            enableSlices="x"
            onClick={openZoom('left')}
            colors={{ scheme: 'category10' }}
          />
        </div>
      </Card>

      {/* EEG 카드 */}
      <Card className="p-4 mb-5">
        <h6 className="mb-3">EEG 밴드</h6>

        {/* 밴드 토글 */}
        <Form className="mb-2">
          <div className="d-flex flex-wrap gap-3">
            {EEG_BANDS.map(b => (
              <Form.Check
                key={b}
                type="switch"
                id={`toggle-${b}`}
                label={b.toUpperCase()}
                checked={eegVisible[b]}
                onChange={() => setEegVisible(v => ({ ...v, [b]: !v[b] }))}
                style={{ color: EEG_COLORS[b], fontWeight: 500 }}
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
              enableSlices="x"
              onClick={openEegZoom}
            />
          </div>
        ) : (
          <div className="text-muted py-4 text-center">
            표시할 EEG 밴드가 없습니다.
          </div>
        )}
      </Card>

      {/* pupil 확대 모달 */}
      <Modal
        show={zoom.show}
        size="lg"
        onHide={() => setZoom(z => ({ ...z, show: false }))}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {zoom.side === 'left' ? '왼쪽' : '오른쪽'} 동공 RAW 확대 · t ≈{' '}
            {zoom.range[0]} – {zoom.range[1]}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: 300 }}>
            <ResponsiveLine
              {...common}
              xScale={{
                type: 'linear',
                min: zoom.range[0],
                max: zoom.range[1],
              }}
              pointSize={3}
              data={[
                { id: 'raw', data: zoom.data },
                {
                  id: 'baseline',
                  data: zoom.data.map(d => ({ ...d, y: zoom.baseline })),
                },
              ]}
              colors={({ id }) => (id === 'raw' ? '#1f77b4' : '#ff7f0e')}
            />
          </div>
        </Modal.Body>
      </Modal>

      {/* EEG 확대 모달 */}
      <Modal
        show={eegZoom.show}
        size="lg"
        onHide={() => setEegZoom(z => ({ ...z, show: false }))}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            EEG RAW 확대 · t ≈ {eegZoom.range[0]} – {eegZoom.range[1]}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: 300 }}>
            <ResponsiveLine
              {...common}
              xScale={{
                type: 'linear',
                min: eegZoom.range[0],
                max: eegZoom.range[1],
              }}
              pointSize={3}
              data={eegZoom.data}
              colors={({ id }) => EEG_COLORS[id]}
            />
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
}