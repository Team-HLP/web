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
  const { userId } = useParams();
  const navigate = useNavigate();

  /* ---- 데이터 상태 ---- */
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);   // API로 받아온 정렬된 원본 데이터
  const [blink, setBlink] = useState([]);
  const [pupilL, setPupilL] = useState([]);
  const [pupilR, setPupilR] = useState([]);
  const [tbr, setTbr] = useState([]);
  const [showLeft, setShowLeft] = useState(true);

  /* ---- CSV util ---- */
  const makeCSVandDownload = (filename, headerArr, rowsArr) => {
    const csv = [headerArr, ...rowsArr]
      .map(line => line.join(','))
      .join('\n');
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

  /* ---- 다운로드 핸들러 ---- */
  const downloadBlinkCSV = () => {
    const rows = rawData.map(item => [
      item.created_at,
      item.eye_blink_count,
    ]);
    makeCSVandDownload(
      `user_${userId}_blink.csv`,
      ['created_at', 'eye_blink_count'],
      rows
    );
  };

  const downloadPupilCSV = () => {
    const rows = rawData.map(item => [
      item.created_at,
      item.avg_eye_pupil_size.left,
      item.avg_eye_pupil_size.right,
    ]);
    makeCSVandDownload(
      `user_${userId}_pupil.csv`,
      ['created_at', 'avg_pupil_left', 'avg_pupil_right'],
      rows
    );
  };

  const downloadTbrCSV = () => {
    const rows = rawData.map(item => [
      item.created_at,
      item.tbrconversion_score,
    ]);
    makeCSVandDownload(
      `user_${userId}_tbr.csv`,
      ['created_at', 'tbrconversion_score'],
      rows
    );
  };

  /* ---- 세션 통계 불러오기 ---- */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        const { data } = await axios.get(
          'https://api-hlp.o-r.kr/admin/game/statistics',
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { user_id: userId },
          }
        );

        // 날짜순 정렬
        const sorted = [...data].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        setRawData(sorted);

        // 눈깜빡임
        setBlink([
          {
            id: '눈깜빡임 수',
            data: sorted.map(item => ({
              x: item.created_at.slice(0, 10),
              y: item.eye_blink_count,
              fullDate: item.created_at,
              rawValue: item.eye_blink_count,
            })),
          },
        ]);

        // 왼쪽 동공
        setPupilL([
          {
            id: '왼쪽 동공 크기',
            data: sorted.map(item => ({
              x: item.created_at.slice(0, 10),
              y: item.avg_eye_pupil_size.left,
              fullDate: item.created_at,
              rawValue: item.avg_eye_pupil_size.left,
            })),
          },
        ]);

        // 오른쪽 동공
        setPupilR([
          {
            id: '오른쪽 동공 크기',
            data: sorted.map(item => ({
              x: item.created_at.slice(0, 10),
              y: item.avg_eye_pupil_size.right,
              fullDate: item.created_at,
              rawValue: item.avg_eye_pupil_size.right,
            })),
          },
        ]);

        // TBR 점수
        setTbr([
          {
            id: 'TBR 점수',
            data: sorted.map(item => ({
              x: item.created_at.slice(0, 10),
              y: item.tbrconversion_score,
              fullDate: item.created_at,
              rawValue: item.tbrconversion_score,
            })),
          },
        ]);
      } catch (err) {
        console.error('통계 로드 실패', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  /* ---- 공통 Nivo 옵션 ---- */
  const common = {
    margin: { top: 40, right: 30, bottom: 70, left: 60 },
    xScale: { type: 'point' },
    yScale: { type: 'linear', min: 'auto', max: 'auto', stacked: false },
    pointSize: 8,
    pointBorderWidth: 2,
    useMesh: true,
    axisBottom: {
      tickRotation: -45,
      legend: '날짜',
      legendOffset: 50,
      legendPosition: 'middle',
    },
  };

  /* ---- 커스텀 툴팁 ---- */
  const Tooltip = ({ point }) => (
    <div
      style={{
        background: 'white',
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: 4,
      }}
    >
      <div><strong>{point.serieId}</strong></div>
      <div>전체 시간: {point.data.fullDate}</div>
      <div>날짜: {point.data.x}</div>
      <div>값: {point.data.rawValue}</div>
    </div>
  );

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
          <ButtonGroup className="me-2">
            <Button size="sm" variant="outline-success" onClick={downloadBlinkCSV}>
              Blink CSV
            </Button>
            <Button size="sm" variant="outline-info" onClick={downloadPupilCSV}>
              Pupil CSV
            </Button>
            <Button size="sm" variant="outline-dark" onClick={downloadTbrCSV}>
              TBR CSV
            </Button>
          </ButtonGroup>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            뒤로 가기
          </Button>
        </Col>
      </Row>

      {/* 1) 눈깜빡임 추이 */}
      <Card className="p-4 mb-4">
        <h5 className="mb-3">눈깜빡임 추이</h5>
        <div style={{ height: 350 }}>
          <ResponsiveLine
            data={blink}
            {...common}
            colors={{ scheme: 'category10' }}
            axisLeft={{
              legend: '눈깜빡임 수',
              legendOffset: -50,
              legendPosition: 'middle',
            }}
            tooltip={Tooltip}
          />
        </div>
      </Card>

      {/* 2) 동공 크기 추이 (토글) */}
      <Card className="p-4 mb-4">
        <Row className="mb-2 align-items-center">
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
            colors={{ scheme: 'set2' }}
            axisLeft={{
              legend: '평균 동공 크기',
              legendOffset: -50,
              legendPosition: 'middle',
            }}
            tooltip={Tooltip}
          />
        </div>
      </Card>

      {/* 3) TBR 점수 추이 */}
      <Card className="p-4 mb-4">
        <h5 className="mb-3">TBR 점수 추이</h5>
        <div style={{ height: 350 }}>
          <ResponsiveLine
            data={tbr}
            {...common}
            colors={{ scheme: 'dark2' }}
            axisLeft={{
              legend: 'TBR 점수',
              legendOffset: -50,
              legendPosition: 'middle',
            }}
            tooltip={Tooltip}
          />
        </div>
      </Card>
    </Container>
  );
};

export default StatisticsPage;