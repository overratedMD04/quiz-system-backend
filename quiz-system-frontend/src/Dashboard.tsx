import { useEffect, useState } from 'react';
import { Card, Button, Table, message, Space, Tag, Tabs, Modal, Form, Input, InputNumber, Select, Popconfirm } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, DeleteOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();

  // 1. CHUYỂN TOKEN LÊN ĐẦU TIÊN ĐỂ CÁC HÀM BÊN DƯỚI DÙNG ĐƯỢC
  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  // 2. SAU ĐÓ MỚI TIẾN HÀNH GIẢI MÃ TOKEN
  const getUsernameFromToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username;
    } catch (e) { return null; }
  };
  const username = getUsernameFromToken();

  // 3. KHAI BÁO STATE
  const [myResults, setMyResults] = useState<any[]>([]); // Lưu lịch sử điểm
  const [classList, setClassList] = useState([]); // Lưu danh sách lớp học
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  // Trạng thái Modal
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false); // Modal tạo lớp học
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  const [examForm] = Form.useForm();
  const [questionForm] = Form.useForm();
  const [classForm] = Form.useForm();

  // Hàm đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  // Các hàm Fetch API
  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/exams', { headers });
      setExams(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách đề thi!');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://localhost:3000/classes', { headers });
      setClassList(response.data);
    } catch (error) {
      console.error('Không thể tải danh sách lớp học');
    }
  };

  const fetchResults = async () => {
    if (!username) return;
    try {
      const response = await axios.get(`http://localhost:3000/exams/results/${username}`, { headers });
      setMyResults(response.data);
    } catch (error) {
      console.error('Không thể tải lịch sử');
    }
  };

  useEffect(() => {
    fetchExams();
    fetchClasses();
    fetchResults();
  }, []);

  // --- XỬ LÝ LỚP HỌC ---
  const handleCreateClass = async (values: any) => {
    try {
      await axios.post('http://localhost:3000/classes', values, { headers });
      message.success('Tạo lớp học mới thành công!');
      setIsClassModalOpen(false);
      classForm.resetFields();
      fetchClasses();
    } catch (error) {
      message.error('Tạo lớp học thất bại!');
    }
  };

  // --- XỬ LÝ ĐỀ THI ---
  const handleCreateExam = async (values: any) => {
    try {
      await axios.post('http://localhost:3000/exams', values, { headers });
      message.success('Tạo đề thi mới thành công!');
      setIsExamModalOpen(false);
      examForm.resetFields();
      fetchExams();
    } catch (error) {
      message.error('Tạo đề thi thất bại!');
    }
  };

  const handleDeleteExam = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3000/exams/${id}`, { headers });
      message.success('Xóa đề thi thành công!');
      fetchExams();
    } catch (error) {
      message.error('Không thể xóa đề thi này!');
    }
  };

  // --- XỬ LÝ CÂU HỎI ---
  const handleCreateQuestion = async (values: any) => {
    try {
      const formattedOptions = [
        `A. ${values.optA}`,
        `B. ${values.optB}`,
        `C. ${values.optC}`,
        `D. ${values.optD}`
      ];

      const payload = {
        exam_id: selectedExamId,
        content: values.content,
        options: formattedOptions,
        correct_answer: `${values.correct_answer}. ${values[ `opt${values.correct_answer}` ]}`
      };

      await axios.post('http://localhost:3000/questions', payload, { headers });
      message.success('Thêm câu hỏi vào đề thành công!');
      setIsQuestionModalOpen(false);
      questionForm.resetFields();
    } catch (error) {
      message.error('Thêm câu hỏi thất bại!');
    }
  };

  // Cấu hình Cột Học Viên
  const studentColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên Đề Thi', dataIndex: 'title', key: 'title', render: (text: string) => <b>{text}</b> },
    { title: 'Thời gian', dataIndex: 'duration_minutes', key: 'duration_minutes', render: (m: number) => <Tag color="blue">{m} phút</Tag> },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record: any) => {
        const isDone = myResults.some((r: any) => r.exam_id === record.id);
        return (
          <Button 
            type={isDone ? "default" : "primary"} 
            disabled={isDone} 
            onClick={() => navigate(`/exam/${record.id}`)}
          >
            {isDone ? 'Đã Hoàn Thành' : 'Làm bài'}
          </Button>
        );
      },
    },
  ];

  // Cấu hình Cột Giáo Viên
  const teacherColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên Đề Thi', dataIndex: 'title', key: 'title', render: (text: string) => <span>{text}</span> },
    { title: 'Mã Lớp', dataIndex: 'class_id', key: 'class_id', render: (id: number) => <Tag color="purple">Lớp {id}</Tag> },
    { title: 'Thời gian', dataIndex: 'duration_minutes', key: 'duration_minutes', render: (m: number) => <span>{m} phút</span> },
    {
      title: 'Quản trị phân hệ',
      key: 'admin_action',
      render: (_, record: any) => (
        <Space size="small">
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => { setSelectedExamId(record.id); setIsQuestionModalOpen(true); }}>
            Thêm câu hỏi
          </Button>
          <Popconfirm
            title="Cảnh báo nguy hiểm"
            description="Xóa đề này sẽ mất toàn bộ câu hỏi. Chắc chắn chứ?"
            onConfirm={() => handleDeleteExam(record.id)}
            okText="Xóa luôn" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>Xóa đề</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '40px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card 
        title={<h1 style={{ margin: 0, color: '#1677b9', fontSize: '22px' }}>🎯 TRUNG TÂM KHẢO THÍ QUIZ</h1>} 
        extra={<Button danger size="large" onClick={handleLogout}>Đăng xuất</Button>}
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '10px' }}
      >
        <Tabs defaultActiveKey="1" size="large" type="card">
          <Tabs.TabPane tab="📝 Khu Vực Làm Bài (Học Viên)" key="1">
            <Table columns={studentColumns} dataSource={exams} rowKey="id" loading={loading} bordered />
          </Tabs.TabPane>

          <Tabs.TabPane tab="🛠️ Quản Trị Hệ Thống (Giáo Viên)" key="2">
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button icon={<TeamOutlined />} size="large" onClick={() => setIsClassModalOpen(true)}>
                Thêm Lớp Học Mới
              </Button>
              <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsExamModalOpen(true)}>
                Tạo Đề Thi Mới
              </Button>
            </div>
            <Table columns={teacherColumns} dataSource={exams} rowKey="id" loading={loading} bordered />
          </Tabs.TabPane>

          <Tabs.TabPane tab="📊 Lịch Sử Làm Bài" key="3">
            <h2 style={{ fontFamily: 'Palatino Linotype, serif', color: 'rgb(22, 119, 185)', marginBottom: '20px' }}>
              Bảng Thành Tích Cá Nhân
            </h2>
            <Table 
              dataSource={myResults} 
              rowKey="id" 
              bordered
              columns={[
                { title: 'ID Đề thi', dataIndex: 'exam_id', key: 'exam_id', width: 100 },
                { title: 'Tài khoản', dataIndex: 'username', key: 'username' },
                { 
                  title: 'Điểm số đạt được', 
                  dataIndex: 'score', 
                  key: 'score', 
                  render: (score: number) => (
                    <Tag color={score >= 5 ? 'success' : 'error'} style={{ fontSize: '14px', padding: '4px 8px' }}>
                      {score} / 10
                    </Tag>
                  ) 
                }
              ]} 
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* MODAL: THÊM LỚP HỌC */}
      <Modal title="THÊM LỚP HỌC VÀO HỆ THỐNG" open={isClassModalOpen} onCancel={() => setIsClassModalOpen(false)} footer={null}>
        <Form form={classForm} layout="vertical" onFinish={handleCreateClass} style={{ marginTop: '20px' }}>
          <Form.Item name="name" label="Tên Lớp Học" rules={[{ required: true, message: 'Không được để trống tên lớp!' }]}>
            <Input placeholder="Ví dụ: Lớp Web Công Nghệ - Nhóm 1" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsClassModalOpen(false)}>Hủy bỏ</Button>
              <Button type="primary" htmlType="submit">Lưu Lớp</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 1: TẠO ĐỀ THI */}
      <Modal title="TẠO ĐỀ THI MỚI VÀO DATABASE" open={isExamModalOpen} onCancel={() => setIsExamModalOpen(false)} footer={null}>
        <Form form={examForm} layout="vertical" onFinish={handleCreateExam} style={{ marginTop: '20px' }}>
          <Form.Item name="title" label="Tên đề thi" rules={[{ required: true, message: 'Không được để trống tên đề!' }]}>
            <Input placeholder="Ví dụ: Đề thi thử Cuối Kỳ mạng máy tính" />
          </Form.Item>
          <Form.Item name="duration_minutes" label="Thời gian làm bài (Phút)" rules={[{ required: true }]} initialValue={60}>
            <InputNumber min={1} max={180} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="class_id" label="Chọn lớp học áp dụng đề thi" rules={[{ required: true, message: 'Vui lòng chọn lớp!' }]}>
            <Select 
              placeholder="Chọn một lớp học trong danh sách"
              options={classList.map((c: any) => ({ value: c.id, label: `ID: ${c.id} - ${c.name}` }))} 
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsExamModalOpen(false)}>Hủy bỏ</Button>
              <Button type="primary" htmlType="submit">Ghi vào DB</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 2: THÊM CÂU HỎI */}
      <Modal title={`THÊM CÂU HỎI VÀO ĐỀ THI (ID ĐỀ: ${selectedExamId})`} open={isQuestionModalOpen} onCancel={() => setIsQuestionModalOpen(false)} footer={null} width={600}>
        <Form form={questionForm} layout="vertical" onFinish={handleCreateQuestion} style={{ marginTop: '20px' }}>
          <Form.Item name="content" label="Nội dung câu hỏi quiz" rules={[{ required: true, message: 'Hãy điền câu hỏi!' }]}>
            <Input.TextArea rows={2} placeholder="Ví dụ: Hệ điều hành nào mã nguồn mở phổ biến nhất?" />
          </Form.Item>
          <Space direction="vertical" style={{ width: '100%', background: '#fafafa', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
            <span style={{ fontWeight: '500' }}>Khai báo 4 phương án lựa chọn:</span>
            <Form.Item name="optA" label="Đáp án A" rules={[{ required: true, message: 'Nhập lựa chọn A!' }]} style={{ marginBottom: '8px' }}><Input /></Form.Item>
            <Form.Item name="optB" label="Đáp án B" rules={[{ required: true, message: 'Nhập lựa chọn B!' }]} style={{ marginBottom: '8px' }}><Input /></Form.Item>
            <Form.Item name="optC" label="Đáp án C" rules={[{ required: true, message: 'Nhập lựa chọn C!' }]} style={{ marginBottom: '8px' }}><Input /></Form.Item>
            <Form.Item name="optD" label="Đáp án D" rules={[{ required: true, message: 'Nhập lựa chọn D!' }]} style={{ marginBottom: '0px' }}><Input /></Form.Item>
          </Space>
          <Form.Item name="correct_answer" label="Chỉ định đáp án đúng chuẩn xác" rules={[{ required: true }]} initialValue="C">
            <Select options={[{ value: 'A', label: 'Đáp án A' }, { value: 'B', label: 'Đáp án B' }, { value: 'C', label: 'Đáp án C' }, { value: 'D', label: 'Đáp án D' }]} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsQuestionModalOpen(false)}>Đóng</Button>
              <Button type="primary" htmlType="submit" icon={<FileTextOutlined />}>Đẩy vào Database</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}