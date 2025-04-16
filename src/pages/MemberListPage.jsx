import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const MemberListPage = () => {
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

  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('https://api-hlp.o-r.kr/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('회원 목록 응답:', response.data);
      setMembers(response.data);
    } catch (error) {
      console.error('회원 목록 불러오기 실패:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  const handleShowRegisterModal = () => setShowRegisterModal(true);
  const handleCloseRegisterModal = () => {
    setShowRegisterModal(false);
    setNewUser({ login_id: '', name: '', age: '', sex: '', password: '' });
  };

  const handleChangeNewUser = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const plainPhone = newUser.login_id.replace(/-/g, '');
      const gender = newUser.sex === '남자' ? 'MAN' : 'WOMAN';

      const payload = {
        name: newUser.name,
        phone_number: plainPhone,
        age: Number(newUser.age),
        sex: gender,
      };

      console.log('access_token:', token);
      console.log('등록 요청 데이터:', payload);

      await axios.post('https://api-hlp.o-r.kr/admin/user/register', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert('회원 등록 성공!');
      handleCloseRegisterModal();
      fetchMembers();
    } catch (error) {
      console.error('회원 등록 실패:', error);
      alert('회원 등록 실패');
    }
  };

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

  const columns = [
    { dataField: 'login_id', text: 'ID', sort: true },
    { dataField: 'name', text: '이름', sort: true },
    {
      dataField: 'age',
      text: '나이',
      formatter: (value) => `${value}세`,
      sort: true,
    },
    { dataField: 'sex', text: '성별', sort: true },
    { dataField: 'created_at', text: '가입일', sort: true },
    {
      dataField: 'actions',
      text: '',
      formatter: (cell, row) => (
        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="warning"
            size="sm"
            onClick={() => navigate(`/admin/member/${row.id}`)}
          >
            조회
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteClick(row)}>
            삭제
          </Button>
        </div>
      ),
      headerStyle: { width: '180px' },
      align: 'center',
    },
  ];

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  const handleChangePassword = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const hashedOld = await hashPassword(oldPwd);
      const hashedNew = await hashPassword(newPwd);

      await axios.put('https://api-hlp.o-r.kr/admin/password', {
        old_password: hashedOld,
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

  return (
    <div className="container mt-5">
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

      <BootstrapTable
        keyField="id"
        data={members}
        columns={columns}
        bordered={false}
        striped
        hover
        condensed
        pagination={paginationFactory({ sizePerPage: 10 })}
        noDataIndication="회원 정보가 없습니다."
      />

      <Modal show={showRegisterModal} onHide={handleCloseRegisterModal}>
        <Modal.Header closeButton>
          <Modal.Title>회원 아이디 발급</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>전화번호 (하이픈 없이 입력)</Form.Label>
              <Form.Control
                type="text"
                name="login_id"
                value={newUser.login_id}
                onChange={handleChangeNewUser}
                placeholder="01012345678"
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
          <Button variant="primary" onClick={() => setShowConfirmModal(true)}>
            확인
          </Button>
        </Modal.Footer>
      </Modal>

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
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={async () => {
            await handleRegisterUser();
            setShowConfirmModal(false);
          }}>
            등록
          </Button>
        </Modal.Footer>
      </Modal>

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