import React from 'react';
import UserTable from '../components/user/UserTable/UserTable';
import styles from './UserManagementPage.module.css';

const UserManagementPage = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>전체 사용자 관리</h1>
      <div className={styles.content}>
        <UserTable />
      </div>
    </div>
  );
};

export default UserManagementPage;
