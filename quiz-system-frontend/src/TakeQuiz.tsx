import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, message, Spin, Radio, Space, Typography, Modal } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

export default function TakeQuiz() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 1. Thêm cái giỏ hàng để lưu đáp án học viên chọn
  // Cấu trúc sẽ có dạng: { question_id_1: "A. Windows", question_id_2: "C. Linux" }
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`http://localhost:3000/exams/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExam(response.data);
      } catch (error) {
        message.error('Lỗi khi tải đề thi!');
      } finally {
        setLoading(false);
      }
    };
    fetchExamDetails();
  }, [id]);

  // 2. Hàm ghi nhận mỗi khi học viên click chọn 1 đáp án A, B, C hoặc D
  const handleAnswerSelect = (questionId: number, selectedOption: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  // 3. Hàm kích hoạt khi bấm nút "Nộp Bài"
  const handleSubmit = () => {
    // Kiểm tra xem đã làm hết các câu chưa
    const totalQuestions = exam.questions.length;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < totalQuestions) {
      Modal.confirm({
        title: 'Bạn chưa làm hết bài!',
        content: `Bạn mới làm ${answeredCount}/${totalQuestions} câu. Bạn có chắc chắn muốn nộp không?`,
        okText: 'Vẫn nộp',
        cancelText: 'Làm tiếp',
        onOk: sendAnswersToBackend,
      });
    } else {
      sendAnswersToBackend();
    }
  };
  
  // 4. Hàm bắn gói dữ liệu xuống Backend để nhờ chấm điểm
  const sendAnswersToBackend = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      // Giải mã token để lấy username
      const payload = JSON.parse(atob(token.split('.')[1]));
      const username = payload.username;

      const response = await axios.post(
        `http://localhost:3000/exams/${id}/submit`, 
        { answers, username }, // Gửi kèm username
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Modal.success({
        title: 'Nộp bài thành công!',
        content: `Điểm số của bạn: ${response.data.score} / 10`,
        onOk: () => navigate('/dashboard')
      });
      
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        message.error('Bạn đã hoàn thành bài thi này rồi!');
        navigate('/dashboard');
      } else {
        message.error('Lỗi khi nộp bài!');
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}><Spin size="large" /></div>;
  if (!exam) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Không tìm thấy dữ liệu</div>;

  return (
    <div style={{ padding: '50px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={<Title level={3} style={{ margin: 0, color: '#1677b9' }}>{exam.title}</Title>}
        extra={<Button onClick={() => navigate('/dashboard')}>Thoát ra</Button>}
        style={{ maxWidth: '800px', margin: '0 auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
      >
        <Text type="secondary" style={{ fontSize: '16px' }}>⏳ Thời gian: {exam.duration_minutes} phút</Text>
        <hr style={{ margin: '20px 0', border: '1px solid #f0f0f0' }} />

        {exam.questions && exam.questions.length > 0 ? (
          exam.questions.map((q: any, index: number) => (
            <div key={q.id} style={{ marginBottom: '30px', padding: '15px', background: '#fafafa', borderRadius: '8px' }}>
              <Text strong style={{ fontSize: '16px' }}>Câu {index + 1}: {q.content}</Text>
              <div style={{ marginTop: '15px' }}>
                {/* Liên kết Radio với State answers */}
                <Radio.Group 
                  onChange={(e) => handleAnswerSelect(q.id, e.target.value)} 
                  value={answers[q.id]}
                >
                  <Space direction="vertical">
                    {q.options.map((opt: string, i: number) => (
                      <Radio key={i} value={opt} style={{ fontSize: '15px' }}>{opt}</Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>
            </div>
          ))
        ) : (
          <Text type="warning">Đề thi này chưa có câu hỏi!</Text>
        )}

        <Button 
          type="primary" size="large" style={{ marginTop: '20px', width: '100%' }} 
          onClick={handleSubmit} // Gắn hàm Nộp bài vào nút này
          disabled={!exam.questions || exam.questions.length === 0}
        >
          Nộp Bài Của Tôi
        </Button>
      </Card>
    </div>
  );
}