import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ReportManagementPage from '../pages/ReportManagementPage';
import UserManagementPage from '../pages/UserManagementPage';
import OcrVerificationPage from '../pages/OcrVerificationPage';
import OcrListPage from '../pages/OcrListPage';
import StatisticsPage from '../pages/StatisticsPage';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />, // 인증 확인을 최상위에 배치
    children: [
      {
        path: '/',
        element: <AdminLayout />, // 인증 통과 시 레이아웃 렌더링
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          // Other routes will be added here
          {
            path: 'reports',
            element: <ReportManagementPage />,
          },
          {
            path: 'users',
            element: <UserManagementPage />,
          },
          {
            path: 'ocr',
            element: <OcrListPage />,
          },
          {
            path: 'ocr/:id',
            element: <OcrVerificationPage />,
          },
          {
            path: 'statistics',
            element: <StatisticsPage />,
          },
        ],
      },
    ],
  },
]);
