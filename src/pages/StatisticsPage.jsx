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

  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [blink, setBlink] = useState([]);
  const [pupilL, setPupilL] = useState([]);
  const [pupilR, setPupilR] = useState([]);
  const [tbr, setTbr] = useState([]);
  const [showLeft, setShowLeft] = useState(true);

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

        const sorted = [...data].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        setRawData(sorted);

        // ✅ 통계 데이터 세팅 예시
        setBlink([
          {
            id: '눈깜빡임 수',
            data: sorted
              .filter(item => item.created_at) // null 방지
              .map(item => ({
                x: item.created_at,
                y: item.eye_blink_count,
                fullDate: item.created_at,
                rawValue: item.eye_blink_count,
              })),
          },
        ]);

        setPupilL([
          {
            id: '왼쪽 동공 크기',
            data: sorted
              .filter(item => item.created_at)
              .map(item => ({
                x: item.created_at,
                y: item.avg_eye_pupil_size.left,
                fullDate: item.created_at,
                rawValue: item.avg_eye_pupil_size.left,
              })),
          },
        ]);

        setPupilR([
          {
            id: '오른쪽 동공 크기',
            data: sorted
              .filter(item => item.created_at)
              .map(item => ({
                x: item.created_at,
                y: item.avg_eye_pupil_size.right,
                fullDate: item.created_at,
                rawValue: item.avg_eye_pupil_size.right,
              })),
          },
        ]);

        setTbr([
          {
            id: 'TBR 점수',
            data: sorted
              .filter(item => item.created_at)
              .map(item => ({
                x: item.created_at,
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
  }, [userId, navigate]);

  const common = {
    margin: { top: 40, right: 30, bottom: 70, left: 60 },
    xScale: {
      type: 'point',
    },
    yScale: { type: 'linear', min: 'auto', max: 'auto', stacked: false },
    pointSize: 8,
    pointBorderWidth: 2,
    useMesh: true,
    axisBottom: {
      tickRotation: -45,
      legend: '시간',
      legendOffset: 50,
      legendPosition: 'middle',
      format: value => {
        const d = new Date(value);
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      },
    },
  };

  const formatDateTime = iso => {
    const d = new Date(iso);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${mi}`;
  };

  const Tooltip = ({ point }) => {
    const when = formatDateTime(point.data.fullDate);
    return (
      <div style={{
        background: '#fff',
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: 4,
        fontSize: 12,
        minWidth: 180,     
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          {point.serieId}
        </div>
        <div style={{ marginBottom: 4 }}>
          <strong>날짜:</strong> {when}
        </div>
        <div>
          <strong>값:</strong> {point.data.rawValue}
        </div>
      </div>
    );
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
      <Row className="mb-4 align-items-center justify-content-between">
        <Col><h4>회원 {userId} – 전체 통계</h4></Col>
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
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            회원 상세 정보로
          </Button>
        </Col>
      </Row>

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
        <div style={{ height: 350 }}>
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