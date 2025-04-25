// MemberListPage.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const MemberListPage = () => {
  // 상태변수 선언
  const [members, setMembers] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newUser, setNewUser] = useState({
    login_id: '',
    name: '',
    age: '',
    sex: '',
    password: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // 중복 등록 방지
  const [searchKeyword, setSearchKeyword] = useState(''); // 검색어 상태
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [filterSex, setFilterSex] = useState('');
  const [filterAgeMin, setFilterAgeMin] = useState('');
  const [filterAgeMax, setFilterAgeMax] = useState('');

  const navigate = useNavigate();

  // 테이블 행 클릭 시 상세 페이지 이동
  const rowEvents = {
    onClick: (e, row) => {
      navigate(`/admin/member/${row.id}`);
    },
  };
  // 컴포넌트 마운트 시 회원 목록 불러오기
  useEffect(() => {
    fetchMembers();
  }, []);


  // API로 회원 목록 가져오기
  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('https://api-hlp.o-r.kr/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMembers(response.data);
      setFilteredMembers(response.data); // 최초엔 전체 목록으로
    } catch (error) {
      console.error('회원 목록 불러오기 실패:', error);
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  // 등록 모달 열기/닫기
  const handleShowRegisterModal = () => setShowRegisterModal(true);
  const handleCloseRegisterModal = () => {
    setShowRegisterModal(false);
    setNewUser({ login_id: '', name: '', age: '', sex: '', password: '' });
  };

  // 등록 폼 값 변경 핸들러
  const handleChangeNewUser = (e) => {
    const { name, value } = e.target;

    // 전화번호 하이픈 자동 삽입 (login_id만)
    if (name === 'login_id') {
      // 숫자만 추출
      const numbers = value.replace(/\D/g, '');

      let formatted = numbers;
      if (numbers.length < 4) {
        formatted = numbers;
      } else if (numbers.length < 7) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length <= 11) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
      }

      setNewUser((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setNewUser((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 회원 등록 요청
  const handleRegisterUser = async () => {
    if (isRegistering) return;
    setIsRegistering(true);

    const plainPhone = newUser.login_id.replace(/-/g, '');

    // 클라이언트 측 유효성 검사
    if (!/^\d{10,11}$/.test(plainPhone)) {
      alert('전화번호는 10~11자리 숫자여야 합니다.');
      setIsRegistering(false);
      return;
    }
    if (!newUser.name.trim()) {
      alert('이름을 입력해주세요.');
      setIsRegistering(false);
      return;
    }
    if (!newUser.age || isNaN(newUser.age) || Number(newUser.age) <= 0) {
      alert('올바른 나이를 입력해주세요.');
      setIsRegistering(false);
      return;
    }
    if (newUser.sex !== '남자' && newUser.sex !== '여자') {
      alert('성별을 선택해주세요.');
      setIsRegistering(false);
      return;
    }

    // 중복 전화번호 확인
    const isDuplicate = members.some(
      (user) => user.phone_number === plainPhone
    );
    if (isDuplicate) {
      alert('이미 등록된 전화번호입니다.');
      setIsRegistering(false);
      return;
    }

    const token = localStorage.getItem('access_token');
    const gender = newUser.sex === '남자' ? 'MAN' : 'WOMAN';
    const payload = {
      name: newUser.name,
      phone_number: plainPhone,
      age: Number(newUser.age),
      sex: gender,
    };

    try {
      await axios.post('https://api-hlp.o-r.kr/admin/user/register', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert('회원 등록 성공!');
      handleCloseRegisterModal();
      await fetchMembers();
    } catch (error) {
      console.error('회원 등록 실패:', error);
      alert('회원 등록 실패');
    } finally {
      setIsRegistering(false);
    }
  };

  // 회원 삭제 요청
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`https://api-hlp.o-r.kr/admin/user/withdraw`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          userId: selectedUser.id
        }
      });
      alert('회원이 삭제되었습니다.');
      setShowDeleteModal(false);
      fetchMembers();
    } catch (error) {
      console.error('회원 삭제 실패:', error);
      alert('회원 삭제에 실패했습니다.');
    }
  };

  // 회원 리스트 테이블 컬럼 정의
  const columns = [
    {
      dataField: 'login_id',       // 사용자 로그인 ID (전화번호 기반)
      text: 'ID',                  // 테이블 헤더에 표시될 이름
      sort: true                   // 정렬 가능
    },
    {
      dataField: 'name',           // 사용자 이름
      text: '이름',
      sort: true
    },
    {
      dataField: 'age',            // 사용자 나이
      text: '나이',
      formatter: (value) => `${value}세`,  // "25세" 형태로 출력
      sort: true
    },
    {
      dataField: 'sex',            // 사용자 성별
      text: '성별',
      sort: true,
    },
    {
      dataField: 'created_at',     // 가입일 (서버에서 제공하는 타임스탬프)
      text: '가입일',
      sort: true
    },
    {
      dataField: 'actions',
      text: '',
      formatter: (cell, row) => (
        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // 상세 페이지 이동 방지
              handleDeleteClick(row);
            }}
          >
            삭제
          </Button>
        </div>
      ),
      headerStyle: { width: '180px' },
      align: 'center',
    },
  ];

  // SHA-256 해시 함수 (비밀번호 변경에 사용)
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // 관리자 비밀번호 변경 요청
  const handleChangePassword = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const hashedOld = await hashPassword(oldPwd);
      const hashedNew = await hashPassword(newPwd);

      await axios.patch('https://api-hlp.o-r.kr/admin/password', {
        cur_password: hashedOld,
        new_password: hashedNew,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert('비밀번호가 성공적으로 변경되었습니다.');
      setShowAdminModal(false);
      setOldPwd('');
      setNewPwd('');
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      alert('비밀번호 변경에 실패했습니다.');
    }
  };

  // 필터 버튼 눌렀을 때만 필터링된 리스트 세팅
  const handleSearch = () => {
    const result = members.filter((user) => {
      const matchesKeyword =
        user.name.includes(searchKeyword) || user.login_id.includes(searchKeyword);
      const matchesSex = filterSex === '' || user.sex === filterSex;
      const matchesAgeMin = filterAgeMin === '' || user.age >= parseInt(filterAgeMin);
      const matchesAgeMax = filterAgeMax === '' || user.age <= parseInt(filterAgeMax);
      return matchesKeyword && matchesSex && matchesAgeMin && matchesAgeMax;
    });

    setFilteredMembers(result);
  };

  // 필터 초기화 함수
  const handleResetFilter = () => {
    setSearchKeyword('');
    setFilterSex('');
    setFilterAgeMin('');
    setFilterAgeMax('');
    setFilteredMembers(members); // 전체 목록 다시 보여줌
  };


  // 렌더링
  return (
    <div className="container mt-5">
      {/* 상단 타이틀 및 버튼 */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">회원 리스트</h2>
        <div>
          <Button variant="outline-secondary" className="me-2" onClick={() => setShowAdminModal(true)}>
            관리자 설정
          </Button>
          <Button variant="outline-primary" className="me-2" onClick={handleShowRegisterModal}>
            회원 아이디 발급
          </Button>
          <Button variant="outline-danger" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="mb-4">
        <Form className="d-flex flex-wrap gap-2 align-items-center">
          <Form.Control type="text" placeholder="이름 또는 ID" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} style={{ width: '180px' }} />
          <Form.Select value={filterSex} onChange={(e) => setFilterSex(e.target.value)} style={{ width: '120px' }}>
            <option value="">성별</option>
            <option value="남">남자</option>
            <option value="여">여자</option>
          </Form.Select>
          <Form.Control type="number" placeholder="최소 나이" value={filterAgeMin} onChange={(e) => setFilterAgeMin(e.target.value)} style={{ width: '100px' }} />
          <span>~</span>
          <Form.Control type="number" placeholder="최대 나이" value={filterAgeMax} onChange={(e) => setFilterAgeMax(e.target.value)} style={{ width: '100px' }} />
          <Button variant="primary" onClick={handleSearch}>검색</Button>
          <Button variant="outline-secondary" onClick={handleResetFilter}>
            초기화
          </Button>
        </Form>
      </div>

      {/* 회원 목록 테이블 */}
      <BootstrapTable
        keyField="id"
        data={filteredMembers}
        columns={columns}
        rowEvents={rowEvents}
        bordered={false}
        striped
        hover
        condensed
        pagination={paginationFactory({ sizePerPage: 10 })}
        noDataIndication="회원 정보가 없습니다."
      />

      {/* 회원 등록 모달 */}
      <Modal show={showRegisterModal} onHide={handleCloseRegisterModal}>
        <Modal.Header closeButton>
          <Modal.Title>회원 아이디 발급</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* 등록 입력 폼 */}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>전화번호 (하이픈 없이 입력)</Form.Label>
              <Form.Control
                type="text"
                name="login_id"
                value={newUser.login_id}
                onChange={handleChangeNewUser}
                placeholder="010-1234-5678"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>이름</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleChangeNewUser}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>나이</Form.Label>
              <Form.Control
                type="number"
                name="age"
                value={newUser.age}
                onChange={handleChangeNewUser}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>성별</Form.Label>
              <Form.Select
                name="sex"
                value={newUser.sex}
                onChange={handleChangeNewUser}
              >
                <option value="">선택</option>
                <option value="남자">남자</option>
                <option value="여자">여자</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRegisterModal}>
            취소
          </Button>
          {/* 입력 정보 확인 모달로 전환 */}
          <Button variant="primary" onClick={() => setShowConfirmModal(true)}>
            확인
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 입력 정보 확인 모달 */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>입력 정보 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>전화번호:</strong> {newUser.login_id}</p>
          <p><strong>이름:</strong> {newUser.name}</p>
          <p><strong>나이:</strong> {newUser.age}세</p>
          <p><strong>성별:</strong> {newUser.sex}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={async () => {
              if (!isRegistering) {
                await handleRegisterUser();
                setShowConfirmModal(false);
              }
            }}
            disabled={isRegistering}
          >
            {isRegistering ? '등록 중...' : '등록'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 회원 삭제 확인 모달 */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>회원 삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          정말로 회원을 삭제하시겠습니까?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            취소
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            삭제
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 관리자 비밀번호 변경 모달 */}
      <Modal show={showAdminModal} onHide={() => setShowAdminModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>관리자 비밀번호 변경</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>기존 비밀번호</Form.Label>
              <Form.Control
                type="password"
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>새 비밀번호</Form.Label>
              <Form.Control
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdminModal(false)}>
            닫기
          </Button>
          <Button variant="primary" onClick={handleChangePassword}>
            변경
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MemberListPage;