-- 1. 사용자 (user) 생성
-- 관리자 계정 (비밀번호: 1234)
INSERT INTO `user` (user_id, password, nick_name, first_login, status, role, warming_count)
VALUES 
('mulmuAdmin', '$2a$10$XmSlyh.Z5J7v.A6.R.E.e.W7uE9Zp9W1Vp.X9p9W1Vp.X9p9W1Vp.', '최고관리자', 0, 'NORMAL', 'ADMIN', 0),
('user1', '$2a$10$XmSlyh.Z5J7v.A6.R.E.e.W7uE9Zp9W1Vp.X9p9W1Vp.X9p9W1Vp.', '나연', 0, 'NORMAL', 'USER', 0),
('user2', '$2a$10$XmSlyh.Z5J7v.A6.R.E.e.W7uE9Zp9W1Vp.X9p9W1Vp.X9p9W1Vp.', '다연', 0, 'NORMAL', 'USER', 1),
('user3', '$2a$10$XmSlyh.Z5J7v.A6.R.E.e.W7uE9Zp9W1Vp.X9p9W1Vp.X9p9W1Vp.', '모모', 0, 'WARMING', 'USER', 1),
('user4', '$2a$10$XmSlyh.Z5J7v.A6.R.E.e.W7uE9Zp9W1Vp.X9p9W1Vp.X9p9W1Vp.', '사나', 0, 'NORMAL', 'USER', 0),
('user5', '$2a$10$XmSlyh.Z5J7v.A6.R.E.e.W7uE9Zp9W1Vp.X9p9W1Vp.X9p9W1Vp.', '지효', 0, 'NORMAL', 'USER', 0),
('user6', '$2a$10$XmSlyh.Z5J7v.A6.R.E.e.W7uE9Zp9W1Vp.X9p9W1Vp.X9p9W1Vp.', '미나', 0, 'NORMAL', 'USER', 0),
('user7', '$2a$10$XmSlyh.Z5J7v.A6.R.E.e.W7uE9Zp9W1Vp.X9p9W1Vp.X9p9W1Vp.', '다현', 0, 'BLOCKED', 'USER', 3),
('user8', '$2a$10$XmSlyh.Z5J7v.A6.R.E.e.W7uE9Zp9W1Vp.X9p9W1Vp.X9p9W1Vp.', '채영', 0, 'NORMAL', 'USER', 0),
('user9', '$2a$10$XmSlyh.Z5J7v.A6.R.E.e.W7uE9Zp9W1Vp.X9p9W1Vp.X9p9W1Vp.', '쯔위', 0, 'NORMAL', 'USER', 0);

-- 2. OCR 스캔 이력 (ocr)
INSERT INTO `ocr` (ocr_id, user_id, image_url, purchase_time, create_time, accuracy)
SELECT 
    UNHEX(REPLACE(UUID(), '-', '')), 
    u.user_id, 
    CASE (t.id % 3)
        WHEN 0 THEN 'https://storage.googleapis.com/mulmumulmu_picture/ocr/나연/2026-04-26/receipt_conv.png'
        WHEN 1 THEN 'https://storage.googleapis.com/mulmumulmu_picture/ocr/다연/2026-04-26/receipt_market.png'
        ELSE 'https://storage.googleapis.com/mulmumulmu_picture/ocr/모모/2026-04-26/receipt_organic.png'
    END,
    DATE_SUB(NOW(), INTERVAL (t.id % 7) DAY),
    DATE_SUB(NOW(), INTERVAL (t.id % 7) DAY),
    85.5
FROM `user` u
CROSS JOIN (SELECT 1 as id UNION SELECT 2 UNION SELECT 3) t
WHERE u.role = 'USER' LIMIT 20;

-- 3. OCR 상세 품목 (ocr_ingredient)
INSERT INTO `ocr_ingredient` (ocr_ingredient_id, ocr_id, ocr_ingredient_name, quantity)
SELECT UNHEX(REPLACE(UUID(), '-', '')), ocr_id, '테스트 식재료', 1 FROM `ocr`;

-- 4. 사용자 식재료 (user_ingredient)
INSERT INTO `user_ingredient` (user_ingredient_id, user_id, ingredient_id, expiration_date, status, source, ocr_ingredient_id, create_time)
SELECT 
    UNHEX(REPLACE(UUID(), '-', '')), 
    o.user_id, 
    (SELECT ingredient_id FROM ingredient LIMIT 1), 
    DATE_ADD(o.create_time, INTERVAL 10 DAY), 
    'NORMAL', 
    'OCR', 
    oi.ocr_ingredient_id,
    o.create_time
FROM `ocr` o
JOIN `ocr_ingredient` oi ON o.ocr_id = oi.ocr_id;

-- 5. 나눔 게시글 (share)
-- ShareStatus: AVAILABLE, COMPLETED (SHARING은 잘못된 값임)
INSERT INTO `share` (share_id, user_id, user_ingredient_id, title, content, status, category, expiration_date, is_view, create_time, update_time)
SELECT 
    UNHEX(REPLACE(UUID(), '-', '')), 
    ui.user_id, 
    ui.user_ingredient_id, 
    '신선한 식재료 나눔합니다!', 
    '상세 내용은 채팅으로 문의주세요.', 
    'AVAILABLE', 
    '기타', 
    ui.expiration_date,
    1, 
    ui.create_time,
    ui.create_time
FROM `user_ingredient` ui LIMIT 15;

-- 6. 나눔 사진 (share_picture)
INSERT INTO `share_picture` (share_picture_id, share_id, picture_url)
SELECT 
    UNHEX(REPLACE(UUID(), '-', '')), 
    s.share_id, 
    'https://storage.googleapis.com/mulmumulmu_picture/share/나연/2026-04-26/share_apple.png'
FROM `share` s;

-- 7. 신고 내역 (report)
INSERT INTO `report` (report_id, reporter_id, share_id, title, content, create_time, status)
SELECT 
    UNHEX(REPLACE(UUID(), '-', '')), 
    'user1', 
    share_id, 
    '부적절한 게시글 신고',
    '내용이 실제와 다릅니다.', 
    DATE_ADD(create_time, INTERVAL 1 HOUR),
    'NOT_COMPLETED'
FROM `share` LIMIT 5;
