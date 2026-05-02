import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * 로그인 상태를 확인하여 비로그인 사용자의 접근을 차단하는 컴포넌트
 */
const ProtectedRoute = () => {
  const token = localStorage.getItem('admin_token');

  // 토큰이 없으면 로그인 페이지로 리다이렉트
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 토큰이 있으면 자식 컴포넌트(레이아웃 및 하위 페이지) 렌더링
  return <Outlet />;
};

export default ProtectedRoute;
