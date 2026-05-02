import React from 'react';
import styles from './StatCard.module.css';

const StatCard = ({ title, value }) => {
  return (
    <div className={styles.card}>
      <p className={styles.title}>{title}</p>
      <h3 className={styles.value}>{value}</h3>
    </div>
  );
};

export default StatCard;
