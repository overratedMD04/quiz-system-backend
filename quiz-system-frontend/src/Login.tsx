import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const { Link, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: any) => {
    try {
      // 1. SỬA LẠI ĐƯỜNG DẪN URL THÀNH /users/login
      const response = await axios.post('http://localhost:3000/users/login', values);
      
      // 2. BÓC 2 LỚP VỎ ĐỂ LẤY TOKEN (response.data.data)
      const token = response.data.data.access_token; 
      
      localStorage.setItem('access_token', token);
      messageApi.success('Đăng nhập thành công! Đang chuyển hướng...');
      console.log('Token thu được:', token);
      setTimeout(() => {
  navigate('/dashboard');
}, 1000); // Đợi 1 giây cho người dùng đọc xong câu thông báo xanh rồi mới chuyển
      
    } catch (error: any) {
      if (error.response) {
        messageApi.error(`Lỗi từ Server: ${error.response.data.message || 'Sai tài khoản/mật khẩu'}`);
      } else {
        messageApi.error('Không thể kết nối đến Backend. Hãy kiểm tra server!');
      }
      console.error('Chi tiết lỗi:', error);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      {contextHolder}
      
      <Card title="ĐĂNG NHẬP HỆ THỐNG QUIZ" style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <Form name="login_form" onFinish={onFinish}>
          
          <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tài khoản!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Tài khoản (vd: admin)" size="large" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu (vd: 123456)" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              Đăng nhập
            </Button>
          </Form.Item>

          {/* KHU VỰC NÚT MỚI THÊM */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <Link onClick={() => messageApi.info('Tính năng đổi mật khẩu đang được xây dựng!')}>
              Quên mật khẩu?
            </Link>
            <Text>
              Chưa có tài khoản? <Link onClick={() => messageApi.info('Tính năng đăng ký đang được xây dựng!')}>Đăng ký ngay!</Link>
            </Text>
          </div>

        </Form>
      </Card>
    </div>
  );
}