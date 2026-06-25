import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import TakeQuiz from './TakeQuiz'; 
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 2. Thêm tuyến đường cho trang làm bài thi */}
        <Route path="/exam/:id" element={<TakeQuiz />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;