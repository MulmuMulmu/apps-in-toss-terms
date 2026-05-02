import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOcrList } from '../api/ocr';
import { formatAdminUserLabel } from '../utils/adminUserDisplay';
import styles from './OcrListPage.module.css';

const OcrListPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchNickname, setSearchNickname] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      const response = await getOcrList();
      if (response.success) {
        setReceipts(response.result.receipts);
      }
      setLoading(false);
    };
    fetchList();
  }, []);

  const handleRowClick = (id) => {
    navigate(`/ocr/${id}`);
  };

  // 필터링 및 정렬 로직
  const filteredAndSortedReceipts = receipts
    .filter((r) => {
      const query = searchNickname.toLowerCase();
      const userLabel = formatAdminUserLabel({
        name: r.nickname,
        userId: r.userId,
        tossUserKey: r.tossUserKey,
        loginProvider: r.loginProvider,
      }).toLowerCase();
      return userLabel.includes(query);
    })
    .sort((a, b) => {
      if (sortOrder === 'desc') {
        return new Date(b.uploadedAt.replace(' ', 'T')) - new Date(a.uploadedAt.replace(' ', 'T'));
      }
      if (sortOrder === 'asc') {
        return new Date(a.uploadedAt.replace(' ', 'T')) - new Date(b.uploadedAt.replace(' ', 'T'));
      }
      if (sortOrder === 'acc-desc') {
        return b.accuracy - a.accuracy;
      }
      if (sortOrder === 'acc-asc') {
        return a.accuracy - b.accuracy;
      }
      return 0;
    });

  if (loading) return <div className={styles.loading}>목록을 불러오고 있습니다...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>OCR 검수 대기 목록</h1>
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="사용자 닉네임 검색" 
              value={searchNickname}
              onChange={(e) => setSearchNickname(e.target.value)}
              className={styles.searchInput}
            />
            <svg 
              className={styles.searchIcon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <select 
            className={styles.sortSelect}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">최신 업로드순</option>
            <option value="asc">과거 업로드순</option>
            <option value="acc-desc">정확도 높은순</option>
            <option value="acc-asc">정확도 낮은순</option>
          </select>
        </div>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '10%' }}>ID</th>
              <th style={{ width: '15%' }}>닉네임</th>
              <th style={{ width: '30%' }}>업로드 시간</th>
              <th style={{ width: '15%' }}>정확도</th>
              <th style={{ width: '15%' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedReceipts.length > 0 ? (
              filteredAndSortedReceipts.map((receipt) => (
                <tr key={receipt.id} onClick={() => handleRowClick(receipt.id)} className={styles.row}>
                  <td>{receipt.id}</td>
                  <td title={receipt.tossUserKey || receipt.userId}>
                    {formatAdminUserLabel({
                      name: receipt.nickname,
                      userId: receipt.userId,
                      tossUserKey: receipt.tossUserKey,
                      loginProvider: receipt.loginProvider,
                    })}
                  </td>
                  <td>{receipt.uploadedAt}</td>
                  <td style={{ fontWeight: 'bold', color: receipt.accuracy > 90 ? '#16a34a' : '#ea580c' }}>
                    {receipt.accuracy}%
                  </td>
                  <td>
                    <button className={styles.actionBtn}>검수하기</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className={styles.noResult}>검색 결과가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OcrListPage;
