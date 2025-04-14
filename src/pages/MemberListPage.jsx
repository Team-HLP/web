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
  const [showModal, setShowModal] = useState(false);
  const [dummyUser, setDummyUser] = useState({
    loginId: '',
    name: '',
    age: '',
    sex: '',
    password: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

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

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setDummyUser({ loginId: '', name: '', age: '', sex: '', password: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDummyUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitDummy = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const plainPhone = dummyUser.loginId.replace(/-/g, '');
      const gender = dummyUser.sex === '남자' ? 'MAN' : 'WOMAN';

      const payload = {
        name: dummyUser.name,
        phone_number: plainPhone,
        age: Number(dummyUser.age),
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
      handleCloseModal();
      fetchMembers();
    } catch (error) {
      console.error('회원 등록 실패:', error);
      alert('회원 등록 실패');
    }
  };
  const [password, setPassword] = useState('');

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`https://api-hlp.o-r.kr/admin/user/${selectedUser.loginId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { password },
      });
      alert('회원이 삭제되었습니다.');
      setShowDeleteModal(false);
      fetchMembers(); // 회원 목록 갱신
    } catch (error) {
      console.error('회원 삭제 실패:', error);
      alert('회원 삭제에 실패했습니다.');
    }
  };

  const columns = [
    { dataField: 'loginId', text: 'ID', sort: true },
    { dataField: 'name', text: '이름', sort: true },
    {
      dataField: 'age',
      text: '나이',
      formatter: (value) => `${value}세`,
      sort: true,
    },
    { dataField: 'sex', text: '성별', sort: true },
    { dataField: 'createdAt', text: '가입일', sort: true },
    {
      dataField: 'actions',
      text: '',
      formatter: (cell, row) => (
        <div className="d-flex gap-2">
          <Button variant="info" size="sm" onClick={() => {/* 상세 보기 기능 구현 예정 */ }}>
            View
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteClick(row)}>
            Delete
          </Button>
        </div>
      ),
      headerStyle: { width: '180px' },
      align: 'center',
    },
  ];

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">회원 리스트</h2>
        <div>
          <Button variant="outline-primary" className="me-2" onClick={handleShowModal}>
            회원 아이디 발급
          </Button>
          <Button variant="outline-danger" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </div>

      <BootstrapTable
        keyField="loginId"
        data={members}
        columns={columns}
        bordered={false}
        striped
        hover
        condensed
        pagination={paginationFactory({ sizePerPage: 10 })}
        noDataIndication="회원 정보가 없습니다."
      />

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>회원 아이디 발급</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>전화번호 (하이픈 없이 입력)</Form.Label>
              <Form.Control
                type="text"
                name="loginId"
                value={dummyUser.loginId}
                onChange={handleChange}
                placeholder="01012345678"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>이름</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={dummyUser.name}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>나이</Form.Label>
              <Form.Control
                type="number"
                name="age"
                value={dummyUser.age}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>성별</Form.Label>
              <Form.Select
                name="sex"
                value={dummyUser.sex}
                onChange={handleChange}
              >
                <option value="">선택</option>
                <option value="남자">남자</option>
                <option value="여자">여자</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmitDummy}>
            확인
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>회원 삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>비밀번호를 입력하세요</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>
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
    </div>
  );
};

export default MemberListPage;