import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../../api/auth';
import styles from './LoginForm.module.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError(''); // 입력 시작 시 에러 메시지 초기화
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await loginAdmin({
        email: formData.userId,
        password: formData.password
      });

      if (response.success) {
        localStorage.setItem('admin_token', response.result.jwt);
        navigate('/');
      } else {
        setError(response.result); // 에러 메시지 설정
      }
    } catch {
      setError('로그인 처리 중 서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.title}>물무물무 관리자 웹</h1>
        <h2 className={styles.subtitle}>LOGIN</h2>
      </div>

      {error && (
        <div className={styles.errorMessageBox}>
          <span className={styles.errorText}>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            name="userId"
            placeholder="아이디를 입력해주세요"
            value={formData.userId}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <input
            type="password"
            name="password"
            placeholder="비밀번호를 입력해주세요"
            value={formData.password}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
        <button type="submit" className={styles.loginButton} disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
