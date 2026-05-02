import React, { useState, forwardRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getReportDetail, getReports, maskPost } from '../../../api/reports';
import ReportItem from './ReportItem';
import UserProcessModal from '../UserProcessModal/UserProcessModal';
import PostDetailModal from '../PostDetailModal/PostDetailModal';
import { formatAdminUserLabel } from '../../../utils/adminUserDisplay';
import styles from './ReportList.module.css';

// 커스텀 입력 컴포넌트
const CustomInput = forwardRef(({ value, onClick, inputText, setInputText, onDateSelect }, ref) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const rawValue = inputText.replace(/\./g, ''); 
      if (rawValue.length === 8) {
        const year = parseInt(rawValue.substring(0, 4));
        const month = parseInt(rawValue.substring(4, 6)) - 1;
        const day = parseInt(rawValue.substring(6, 8));
        const newDate = new Date(year, month, day);

        // 유효성 심화 검사: 날짜가 실제로 존재하고(자동 보정 방지), 오늘 이전인지 확인
        if (
          !isNaN(newDate.getTime()) && 
          newDate.getFullYear() === year &&
          newDate.getMonth() === month &&
          newDate.getDate() === day &&
          newDate <= new Date()
        ) {
          onDateSelect(newDate);
          e.target.blur();
        } else {
          setTimeout(() => alert('옳지 않은 값입니다.'), 10);
          setInputText(value); // 기존값(달력 기준 값)으로 복원
        }
      } else {
        setTimeout(() => alert('옳지 않은 값입니다.'), 10);
        setInputText(value); // 기존값으로 복원
      }
    }
  };

  return (
    <div className={styles.dateSelector}>
      <input
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={(e) => {
          e.stopPropagation();
        }}
        ref={ref}
        className={styles.dateInput}
        placeholder="YYYY.MM.DD"
      />
      <span className={styles.arrow} onClick={onClick}>▼</span>
    </div>
  );
});

const ReportList = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [inputText, setInputText] = useState(''); 
  const [currentType, setCurrentType] = useState('all');
  const [currentReportArea, setCurrentReportArea] = useState('all');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 모달 상태
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // 날짜 포맷 변환 함수 (YYYY-MM-DD)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 날짜 포맷 변환 함수 (YYYY.MM.DD)
  const formatDisplayDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 날짜 또는 필터 변경 시 호출
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const response = await getReports({
          Date: formatDate(selectedDate),
          type: currentType
        });
        
        if (response.success) {
          setReports(response.result.reports || []);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
    setInputText(formatDisplayDate(selectedDate));
  }, [selectedDate, currentType]);

  // 핸들러: 사용자 처리 모달 열기
  const handleOpenProcessModal = async (report) => {
    const detailResponse = await getReportDetail(report.reportId);
    const detail = detailResponse.success ? detailResponse.result : {};
    setSelectedReport({
      ...report,
      ...detail,
      targetId: detail.reportedNameId,
      targetName: detail.reportedName,
      targetTossUserKey: detail.reportedTossUserKey,
      targetLoginProvider: detail.reportedLoginProvider,
      title: detail.title || report.content,
    });
    setIsProcessModalOpen(true);
    setIsPostModalOpen(false); // 게시물 모달이 열려있었다면 닫기
  };

  // 핸들러: 게시물 보기 모달 열기
  const handleOpenPostModal = (report) => {
    if (!report.shareId) {
      alert('연관 게시물 정보를 불러올 수 없습니다.');
      return;
    }
    setSelectedReport(report);
    setIsPostModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsProcessModalOpen(false);
    setIsPostModalOpen(false);
    setSelectedReport(null);
  };

  // 핸들러: 게시물 숨김 처리
  const handleMaskPost = async (report) => {
    if (report.reportType === 'CHAT') {
      alert('채팅 신고는 사용자 처리에서 조치해주세요.');
      return;
    }
    if (!window.confirm(`'${report.content}' 게시물을 숨김 처리하시겠습니까?`)) return;

    const response = await maskPost(report.shareId);
    if (response.success) {
      alert(response.result);
      setReports((prevReports) => prevReports.filter((item) => item.shareId !== report.shareId));
    } else {
      alert(response.result);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (currentReportArea === 'chat') return report.reportType === 'CHAT';
    if (currentReportArea === 'share') return report.reportType !== 'CHAT';
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>신고 리스트</h2>
        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${currentType === 'all' ? styles.active : ''}`}
            onClick={() => setCurrentType('all')}
          >
            전체
          </button>
          <button 
            className={`${styles.filterBtn} ${currentType === 'completed' ? styles.active : ''}`}
            onClick={() => setCurrentType('completed')}
          >
            완료
          </button>
          <button 
            className={`${styles.filterBtn} ${currentType === 'notCompleted' ? styles.active : ''}`}
            onClick={() => setCurrentType('notCompleted')}
          >
            미완
          </button>
        </div>
      </div>
      
      <DatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        dateFormat="yyyy.MM.dd"
        maxDate={new Date()}
        customInput={
          <CustomInput 
            inputText={inputText} 
            setInputText={setInputText} 
            onDateSelect={setSelectedDate} 
          />
        }
      />

      <div className={styles.areaFilterGroup}>
        <span className={styles.areaFilterLabel}>신고 영역</span>
        <button
          className={`${styles.areaFilterBtn} ${currentReportArea === 'all' ? styles.activeArea : ''}`}
          onClick={() => setCurrentReportArea('all')}
        >
          전체
        </button>
        <button
          className={`${styles.areaFilterBtn} ${currentReportArea === 'share' ? styles.activeArea : ''}`}
          onClick={() => setCurrentReportArea('share')}
        >
          나눔 신고
        </button>
        <button
          className={`${styles.areaFilterBtn} ${currentReportArea === 'chat' ? styles.activeArea : ''}`}
          onClick={() => setCurrentReportArea('chat')}
        >
          채팅 신고
        </button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <ReportItem 
              key={report.reportId} 
              title={report.content} 
              reporter={formatAdminUserLabel({
                name: report.reporterName,
                userId: report.reporterUserId,
                tossUserKey: report.reporterTossUserKey,
                loginProvider: report.reporterLoginProvider,
              })}
              content={report.reportType === 'CHAT'
                ? '채팅방과 메시지 기준으로 접수된 신고입니다.'
                : '상품 상세 보기 및 숨김 처리가 가능한 게시물입니다.'}
              status={report.status}
              reportTypeLabel={report.reportTypeLabel}
              isChatReport={report.reportType === 'CHAT'}
              onProcessUser={() => handleOpenProcessModal(report)}
              onViewPost={() => handleOpenPostModal(report)}
              onMaskPost={() => handleMaskPost(report)}
            />
          ))
        ) : (
          <div className={styles.empty}>신고 내역이 없습니다.</div>
        )}
      </div>

      {/* 사용자 처리 상세 모달 */}
      <UserProcessModal 
        isOpen={isProcessModalOpen}
        onClose={handleCloseModals}
        reportData={selectedReport}
      />

      {/* 게시물 상세 보기 모달 */}
      <PostDetailModal 
        isOpen={isPostModalOpen}
        onClose={handleCloseModals}
        reportData={selectedReport}
        onProcessUser={() => {
          setIsPostModalOpen(false); // 게시물 창만 닫고
          setIsProcessModalOpen(true); // 처리 창은 열기 (데이터는 유지)
        }} 
      />
    </div>
  );
};

export default ReportList;
