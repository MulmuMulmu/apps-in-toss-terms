import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login', { replace: true });
  };

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.logoSection}>
          <span className={styles.logoText}>물무물무 관리자</span>
        </div>
        <nav className={styles.nav}>
          <ul>
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ''}>
                운영 대시보드
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" className={({ isActive }) => isActive ? styles.active : ''}>
                신고 접수 및 처리
              </NavLink>
            </li>
            <li>
              <NavLink to="/users" className={({ isActive }) => isActive ? styles.active : ''}>
                전체 사용자
              </NavLink>
            </li>
            <li>
              <NavLink to="/ocr" className={({ isActive }) => isActive ? styles.active : ''}>
                OCR 검수
              </NavLink>
            </li>
            <li>
              <NavLink to="/statistics" className={({ isActive }) => isActive ? styles.active : ''}>
                데이터 통계
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      <div className={styles.logout} onClick={handleLogout}>
        로그아웃
      </div>
    </aside>
  );
};

export default Sidebar;
