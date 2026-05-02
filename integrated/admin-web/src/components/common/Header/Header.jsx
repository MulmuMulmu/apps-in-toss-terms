import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.title}>Dashboard</div>
      <div className={styles.user}>Admin User</div>
    </header>
  );
};

export default Header;
