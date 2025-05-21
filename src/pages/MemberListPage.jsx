// src/pages/MemberListPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const API_BASE = 'https://api-hlp.o-r.kr';

const MemberListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 회원 & 필터링 상태
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);

  // 모달 상태
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 입력 상태
  const [newUser, setNewUser] = useState({ login_id: '', name: '', age: '', sex: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // 검색어 / 필터링 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterSex, setFilterSex] = useState('');
  const [filterAgeMin, setFilterAgeMin] = useState('');
  const [filterAgeMax, setFilterAgeMax] = useState('');

  // SHA-256 해시 함수 (비밀번호 암호화용)
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 관리자 비밀번호 변경 요청
  const handleChangePassword = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const hashedOld = await hashPassword(oldPwd);
      const hashedNew = await hashPassword(newPwd);
      await axios.patch(
        `${API_BASE}/admin/password`,
        { cur_password: hashedOld, new_password: hashedNew },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('비밀번호가 성공적으로 변경되었습니다.');
      setShowAdminModal(false);
      setOldPwd('');
      setNewPwd('');
    } catch (err) {
      console.error('비밀번호 변경 실패:', err);
      alert('비밀번호 변경에 실패했습니다.');
    }
  };

  // 회원 목록 API 호출
  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data);
      setFilteredMembers(res.data);
    } catch (err) {
      console.error('회원 목록 불러오기 실패:', err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // URL 쿼리로 모달 자동 오픈 (register/settings)
  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setShowRegisterModal(true);
      searchParams.delete('register');
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get('settings') === 'true') {
      setShowAdminModal(true);
      searchParams.delete('settings');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // 회원 등록 요청
  const handleRegisterUser = async () => {
    if (isRegistering) return;
    setIsRegistering(true);
    const plainPhone = newUser.login_id.replace(/-/g, '');
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
    if (!newUser.age || Number(newUser.age) <= 0) {
      alert('올바른 나이를 입력해주세요.');
      setIsRegistering(false);
      return;
    }
    if (newUser.sex !== '남자' && newUser.sex !== '여자') {
      alert('성별을 선택해주세요.');
      setIsRegistering(false);
      return;
    }
    const dup = members.some(u => u.phone_number === plainPhone);
    if (dup) {
      alert('이미 등록된 전화번호입니다.');
      setIsRegistering(false);
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        name: newUser.name,
        phone_number: plainPhone,
        age: Number(newUser.age),
        sex: newUser.sex === '남자' ? 'MAN' : 'WOMAN',
      };
      await axios.post(`${API_BASE}/admin/user/register`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('회원 등록 성공!');
      setShowConfirmModal(false);
      setShowRegisterModal(false);
      setNewUser({ login_id: '', name: '', age: '', sex: '' });
      await fetchMembers();
    } catch (err) {
      console.error('회원 등록 실패:', err);
      alert('회원 등록에 실패했습니다.');
    } finally {
      setIsRegistering(false);
    }
  };

  // 로그아웃
  // eslint-disable-next-line no-unused-vars
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  // 모달 토글
  // eslint-disable-next-line no-unused-vars
  const handleShowRegisterModal = () => setShowRegisterModal(true);
  const handleCloseRegisterModal = () => {
    setShowRegisterModal(false);
    setNewUser({ login_id: '', name: '', age: '', sex: '' });
  };
  const handleCloseAdminModal = () => setShowAdminModal(false);

  // 회원 삭제
  const handleDeleteClick = user => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };
  const handleCloseDeleteModal = () => setShowDeleteModal(false);
  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE}/admin/user/withdraw`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId: selectedUser.id }
      });
      alert('회원이 삭제되었습니다.');
      setShowDeleteModal(false);
      fetchMembers();
    } catch (err) {
      console.error('회원 삭제 실패:', err);
      alert('회원 삭제에 실패했습니다.');
    }
  };

  // 검색 & 필터링
  const handleSearch = () => {
    const keyword = searchKeyword.trim().toLowerCase();
    const minAge = filterAgeMin ? parseInt(filterAgeMin, 10) : 0;
    const maxAge = filterAgeMax ? parseInt(filterAgeMax, 10) : Infinity;
    const result = members.filter(u => {
      const matchKey = !keyword || u.name.toLowerCase().includes(keyword) || u.login_id.includes(keyword);
      const matchSex = !filterSex || u.sex === filterSex;
      const matchAge = u.age >= minAge && u.age <= maxAge;
      return matchKey && matchSex && matchAge;
    });
    setFilteredMembers(result);
  };
  const handleResetFilter = () => {
    setSearchKeyword('');
    setFilterSex('');
    setFilterAgeMin('');
    setFilterAgeMax('');
    setFilteredMembers(members);
  };

  // Enter 키로 검색 실행
  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // 테이블 컬럼 정의
  const columns = [
    { dataField: 'login_id', text: 'ID', sort: true },
    { dataField: 'name', text: '이름', sort: true },
    { dataField: 'age', text: '나이', formatter: v => `${v}세`, sort: true },
    { dataField: 'sex', text: '성별', sort: true },
    { dataField: 'created_at', text: '가입일', sort: true },
    {
      dataField: 'actions', text: '',
      formatter: (_cell, row) => (
        <Button variant="outline-danger" className="border-0"
          size="sm" onClick={e => { e.stopPropagation(); handleDeleteClick(row); }}>
          삭제
        </Button>
      ),
      align: 'center', headerStyle: { width: '100px' }
    }
  ];

  // ★ rowEvents 정의는 columns 정의 아래, return 바로 위에 두세요
  const rowEvents = {
    onClick: (e, row) => navigate(`/admin/member/${row.id}`)
  };

  return (
    <div className="container mt-5">

      {/* 필터 영역 */}
      <Form className="d-flex flex-wrap gap-2 mb-4" onKeyDown={handleKeyDown}>
        <Form.Control
          type="text"
          style={{ width: 180 }}
          placeholder="이름 또는 ID"
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
        />
        <Form.Select
          style={{ width: 120 }}
          value={filterSex}
          onChange={e => setFilterSex(e.target.value)}
        >
          <option value="">성별</option>
          <option value="남자">남자</option>
          <option value="여자">여자</option>
        </Form.Select>
        <Form.Control
          type="number"
          style={{ width: 100 }}
          placeholder="최소 나이"
          min="0"
          value={filterAgeMin}
          onChange={e => {
            const v = e.target.value;
            if (v === '' || Number(v) >= 0) setFilterAgeMin(v);
          }}
        />
        <span className="align-self-center">~</span>
        <Form.Control
          type="number"
          style={{ width: 100 }}
          placeholder="최대 나이"
          min="0"
          value={filterAgeMax}
          onChange={e => {
            const v = e.target.value;
            if (v === '' || Number(v) >= 0) setFilterAgeMax(v);
          }}
        />
        <Button variant="primary" onClick={handleSearch}>검색</Button>
        <Button variant="outline-secondary" onClick={handleResetFilter}>초기화</Button>
      </Form>

      {/* 회원 테이블 (외곽선 없음) */}
      <BootstrapTable
        keyField="id"
        data={filteredMembers}
        columns={columns}
        rowEvents={rowEvents}
        bootstrap4
        striped
        hover
        condensed
        bordered={false}
        pagination={paginationFactory({ sizePerPage: 10 })}
        noDataIndication="회원 정보가 없습니다."
      />

      {/* 회원 등록 모달 */}
      <Modal show={showRegisterModal} onHide={handleCloseRegisterModal}>
        <Modal.Header closeButton>
          <Modal.Title>회원 아이디 발급</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>전화번호 (하이픈 없이)</Form.Label>
              <Form.Control name="login_id" value={newUser.login_id} onChange={e => setNewUser(prev => ({ ...prev, login_id: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>이름</Form.Label>
              <Form.Control name="name" value={newUser.name} onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>나이</Form.Label>
              <Form.Control type="number" name="age" value={newUser.age} onChange={e => setNewUser(prev => ({ ...prev, age: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>성별</Form.Label>
              <Form.Select name="sex" value={newUser.sex} onChange={e => setNewUser(prev => ({ ...prev, sex: e.target.value }))}>
                <option value="">선택</option>
                <option value="남자">남자</option>
                <option value="여자">여자</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRegisterModal}>취소</Button>
          <Button variant="primary" onClick={() => setShowConfirmModal(true)}>확인</Button>
        </Modal.Footer>
      </Modal>

      {/* 입력 확인 모달 */}
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
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>취소</Button>
          <Button
            variant="primary"
            onClick={async () => {
              if (!isRegistering) {
                await handleRegisterUser();
              }
            }}
            disabled={isRegistering}
          >
            {isRegistering ? '등록 중...' : '등록'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 회원 삭제 확인 모달 */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>회원 삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>정말로 회원을 삭제하시겠습니까?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>취소</Button>
          <Button variant="danger" onClick={handleConfirmDelete}>삭제</Button>
        </Modal.Footer>
      </Modal>

      {/* 관리자 설정 모달 */}
      <Modal show={showAdminModal} onHide={handleCloseAdminModal}>
        <Modal.Header closeButton>
          <Modal.Title>관리자 비밀번호 변경</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>기존 비밀번호</Form.Label>
              <Form.Control type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>새 비밀번호</Form.Label>
              <Form.Control type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseAdminModal}>취소</Button>
          <Button variant="primary" onClick={handleChangePassword}>변경</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MemberListPage;