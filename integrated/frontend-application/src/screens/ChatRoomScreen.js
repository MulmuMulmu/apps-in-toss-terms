import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { blockChat, deleteChatRoom, getChatMessagesPage, markChatAsRead, reportChat, sendChatMessage, startChat } from '../api/chats';
import { completeShareSuccession } from '../api/shares';
import { getIngredientVisualForItem } from '../data/categoryVisuals';

const formatMessageTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
};

const formatMessageDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};
const MESSAGE_PAGE_SIZE = 30;
const REPORT_REASONS = ['부적절한 대화', '거래 약속 불이행', '스팸/광고', '기타'];

export default function ChatRoomScreen({ navigation, route }) {
  const chat = route?.params?.chat || {};
  const post = route?.params?.post || null;
  const [chatRoomId, setChatRoomId] = useState(chat.chatRoomId || route?.params?.chatRoomId || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [messagePage, setMessagePage] = useState(0);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportContent, setReportContent] = useState('');
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const opponentName = chat.name || post?.sellerName || post?.author || '상대방';
  const postId = post?.postId || chat?.postId || route?.params?.postId;
  const canCompleteShare = chat?.type === 'give';
  const visual = useMemo(() => getIngredientVisualForItem({
    name: post?.food || post?.title,
    category: post?.category,
  }), [post?.category, post?.food, post?.title]);

  const normalizeMessage = useCallback((message, index) => ({
    id: message.messageId || `${message.sendTime}-${index}`,
    text: message.content || '',
    isMine: message.senderNicName !== opponentName,
    time: formatMessageTime(message.sendTime),
    date: formatMessageDate(message.sendTime),
    isRead: message.isRead !== false,
    rawTime: message.sendTime,
  }), [opponentName]);

  const loadMessages = useCallback(async (roomId, options = {}) => {
    if (!roomId) return;
    const silent = options.silent === true;
    const targetPage = options.page ?? 0;
    if (!silent && targetPage === 0) {
      setLoading(true);
      setError(null);
    } else if (targetPage > 0) {
      setLoadingOlder(true);
    }
    try {
      const response = await getChatMessagesPage({ chatRoomId: roomId, page: targetPage, size: MESSAGE_PAGE_SIZE });
      const normalized = (Array.isArray(response?.items) ? response.items : [])
        .map(normalizeMessage)
        .sort((left, right) => new Date(left.rawTime || 0) - new Date(right.rawTime || 0));
      setMessages((current) => (targetPage === 0 ? normalized : [...normalized, ...current]));
      setMessagePage(targetPage);
      setHasOlderMessages(response?.hasNext === true);
      setError(null);
      await markChatAsRead(roomId);
    } catch (caughtError) {
      if (!silent) {
        setMessages([]);
        setError(caughtError instanceof Error ? caughtError.message : '메시지를 불러오지 못했어요.');
      }
    } finally {
      if (!silent) setLoading(false);
      setLoadingOlder(false);
    }
  }, [normalizeMessage]);

  useEffect(() => {
    let cancelled = false;

    const prepareRoom = async () => {
      setLoading(true);
      try {
        let roomId = chatRoomId;
        if (!roomId && post?.postId) {
          const response = await startChat(post.postId);
          roomId = response?.chatRoomId;
          if (!cancelled) setChatRoomId(roomId);
        }
        if (!cancelled && roomId) {
          await loadMessages(roomId);
        } else if (!cancelled) {
          setError('채팅방 정보를 찾지 못했어요.');
          setLoading(false);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : '채팅방을 시작하지 못했어요.');
          setLoading(false);
        }
      }
    };

    void prepareRoom();
    return () => {
      cancelled = true;
    };
  }, [chatRoomId, loadMessages, post?.postId]);

  useFocusEffect(
    useCallback(() => {
      if (!chatRoomId) return undefined;

      const timer = setInterval(() => {
        void loadMessages(chatRoomId, { silent: true });
      }, 3000);

      return () => clearInterval(timer);
    }, [chatRoomId, loadMessages])
  );

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !chatRoomId || sending) return;

    setSending(true);
    try {
      await sendChatMessage({ chatRoomId, content });
      setInput('');
      await loadMessages(chatRoomId);
    } catch (caughtError) {
      showAppDialog('전송 실패', caughtError instanceof Error ? caughtError.message : '메시지를 전송하지 못했어요.');
    } finally {
      setSending(false);
    }
  };

  const handleCompleteShare = async () => {
    if (!canCompleteShare) {
      showAppDialog('완료 불가', '나눔 완료 처리는 게시글 작성자만 할 수 있어요.');
      return;
    }

    if (!postId) {
      showAppDialog('완료 불가', '나눔 게시글 정보를 찾지 못했어요.');
      return;
    }

    setCompleting(true);
    try {
      await completeShareSuccession({
        postId,
        takerNickName: opponentName,
        type: '전체',
      });
      setConfirmVisible(false);
      showAppDialog('나눔 완료', '나눔 상태가 완료로 변경되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (caughtError) {
      showAppDialog('완료 실패', caughtError instanceof Error ? caughtError.message : '나눔 완료 처리에 실패했어요.');
    } finally {
      setCompleting(false);
    }
  };

  const handleReportChat = async () => {
    if (!chatRoomId || reporting) return;
    setReporting(true);
    try {
      await reportChat({
        chatRoomId,
        reason: reportReason,
        content: reportContent,
      });
      setReportVisible(false);
      setReportContent('');
      setReportReason(REPORT_REASONS[0]);
      showAppDialog('신고 접수', '채팅 신고가 접수되었습니다.');
    } catch (caughtError) {
      showAppDialog('신고 실패', caughtError instanceof Error ? caughtError.message : '신고를 접수하지 못했어요.');
    } finally {
      setReporting(false);
    }
  };

  const handleBlockChat = () => {
    if (!chatRoomId || blocking) return;
    showAppDialog('상대방 차단', '차단하면 이 채팅방에서 더 이상 메시지를 주고받을 수 없어요. 차단할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '차단',
        style: 'destructive',
        onPress: async () => {
          setBlocking(true);
          try {
            await blockChat(chatRoomId);
            setReportVisible(false);
            showAppDialog('차단 완료', '상대방을 차단했습니다.', [
              { text: '확인', onPress: () => navigation.goBack() },
            ]);
          } catch (caughtError) {
            showAppDialog('차단 실패', caughtError instanceof Error ? caughtError.message : '상대방을 차단하지 못했어요.');
          } finally {
            setBlocking(false);
          }
        },
      },
    ]);
  };

  const handleDeleteChatRoom = () => {
    if (!chatRoomId) {
      showAppDialog('삭제 불가', '채팅방 정보를 찾지 못했어요.');
      return;
    }
    showAppDialog(
      '채팅방 삭제',
      '내 채팅 목록에서만 삭제돼요. 신고 및 운영 확인을 위해 대화 기록은 서버에 보관됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChatRoom(chatRoomId);
              navigation.goBack();
            } catch (caughtError) {
              showAppDialog('삭제 실패', caughtError instanceof Error ? caughtError.message : '채팅방을 삭제하지 못했어요.');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>이전</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{opponentName}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconActionButton}
            onPress={handleDeleteChatRoom}
            accessibilityLabel="채팅방 삭제"
          >
            <Ionicons name="trash-outline" size={18} color="#F04452" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setReportVisible(true)}
          >
            <Ionicons name="alert-circle-outline" size={16} color="#8B95A1" />
            <Text style={styles.reportButtonText}>신고</Text>
          </TouchableOpacity>
          {canCompleteShare ? (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => setConfirmVisible(true)}
            >
              <Text style={styles.completeButtonText}>완료</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      >
        {post ? (
          <View style={styles.postCard}>
            <View style={styles.postImageBox}>
              {post.image ? (
                <Image source={{ uri: post.image }} style={styles.postImage} />
              ) : (
                <View style={[styles.defaultImageBox, { backgroundColor: visual.backgroundColor }]}>
                  <Image source={visual.image} style={styles.defaultImage} />
                </View>
              )}
            </View>
            <View style={styles.postCardInfo}>
              <Text style={styles.postCardTitle} numberOfLines={1}>{post.title}</Text>
              <Text style={styles.postCardDesc} numberOfLines={1}>{post.content || post.description}</Text>
            </View>
          </View>
        ) : null}

        {!loading && !error && hasOlderMessages ? (
          <TouchableOpacity
            style={styles.loadOlderButton}
            onPress={() => loadMessages(chatRoomId, { page: messagePage + 1 })}
            disabled={loadingOlder}
          >
            <Text style={styles.loadOlderText}>{loadingOlder ? '불러오는 중' : '이전 메시지 더 보기'}</Text>
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#3182F6" />
            <Text style={styles.centerText}>메시지를 불러오고 있어요.</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>아직 대화가 없어요. 먼저 메시지를 보내보세요.</Text>
          </View>
        ) : (
          messages.map((msg, index) => {
            const showDate = index === 0 || messages[index - 1].date !== msg.date;
            return (
              <View key={msg.id}>
                {showDate && msg.date ? (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>{msg.date}</Text>
                  </View>
                ) : null}
                <View style={[styles.messageRow, msg.isMine ? styles.messageRowMine : styles.messageRowOther]}>
                  {!msg.isMine && <View style={styles.otherAvatar} />}
                  <View style={styles.messageBubbleWrapper}>
                    <View style={[styles.bubble, msg.isMine ? styles.bubbleMine : styles.bubbleOther]}>
                      <Text style={[styles.bubbleText, msg.isMine && styles.bubbleTextMine]}>
                        {msg.text}
                      </Text>
                    </View>
                    <Text style={[styles.messageTime, msg.isMine && { textAlign: 'right' }]}>
                      {msg.isMine ? `${msg.isRead ? '읽음' : '전송됨'} · ${msg.time}` : msg.time}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="메시지를 입력하세요"
          placeholderTextColor="#adb5bd"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || !chatRoomId || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || !chatRoomId || sending}
        >
          <Ionicons name="send" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.completeModal}>
            <Text style={styles.completeModalTitle}>나눔을 완료할까요?</Text>
            <Text style={styles.completeModalDesc}>
              {opponentName}님에게 나눔 완료로 처리됩니다.
            </Text>
            <View style={styles.completeModalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, completing && styles.sendButtonDisabled]}
                onPress={handleCompleteShare}
                disabled={completing}
              >
                <Text style={styles.modalConfirmText}>{completing ? '처리 중' : '완료'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={reportVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.completeModal}>
            <Text style={styles.completeModalTitle}>채팅 신고</Text>
            <Text style={styles.completeModalDesc}>부적절한 대화나 약속 불이행이 있으면 신고할 수 있어요.</Text>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.shareTypeButton, reportReason === reason && styles.shareTypeButtonSelected]}
                onPress={() => setReportReason(reason)}
              >
                <Text style={[styles.shareTypeText, reportReason === reason && styles.shareTypeTextSelected]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.reportInput}
              placeholder="상세 내용을 입력해주세요"
              placeholderTextColor="#adb5bd"
              value={reportContent}
              onChangeText={setReportContent}
              multiline
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.blockUserButton, blocking && styles.sendButtonDisabled]}
              onPress={handleBlockChat}
              disabled={blocking}
            >
              <Ionicons name="ban-outline" size={17} color="#E5484D" />
              <Text style={styles.blockUserText}>{blocking ? '차단 중' : '이 상대방 차단하기'}</Text>
            </TouchableOpacity>
            <View style={styles.completeModalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setReportVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, reporting && styles.sendButtonDisabled]}
                onPress={handleReportChat}
                disabled={reporting}
              >
                <Text style={styles.modalConfirmText}>{reporting ? '접수 중' : '신고'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF9FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dee2e6',
    backgroundColor: '#FBF9FF',
  },
  backButton: { fontSize: 24, fontWeight: 'bold', color: '#495057' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#495057' },
  completeButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#E8F3FF',
  },
  completeButtonText: { fontSize: 13, fontWeight: 'bold', color: '#3182F6' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F2F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportButtonText: { fontSize: 13, fontWeight: '700', color: '#8B95A1' },
  messageList: { flex: 1 },
  messageListContent: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end' },
  messageRowMine: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  otherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dee2e6',
    marginRight: 8,
    flexShrink: 0,
  },
  messageBubbleWrapper: { maxWidth: '70%', gap: 4 },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: '#87CEEB',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: '#dee2e6',
  },
  bubbleText: { fontSize: 15, color: '#495057', lineHeight: 22 },
  bubbleTextMine: { color: '#ffffff' },
  messageTime: { fontSize: 11, color: '#adb5bd' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#dee2e6',
    backgroundColor: '#FBF9FF',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    fontSize: 15,
    color: '#495057',
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#87CEEB',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#dee2e6' },
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#dee2e6',
    gap: 12,
  },
  postImageBox: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  postImage: { width: 52, height: 52 },
  defaultImageBox: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultImage: { width: 46, height: 46, borderRadius: 8 },
  postCardInfo: { flex: 1 },
  postCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#495057', marginBottom: 4 },
  postCardDesc: { fontSize: 13, color: '#adb5bd' },
  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateSeparatorText: { fontSize: 12, color: '#adb5bd' },
  centerContainer: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 },
  centerText: { marginTop: 10, fontSize: 14, color: '#8B95A1' },
  emptyText: { fontSize: 14, color: '#8B95A1', textAlign: 'center' },
  loadOlderButton: {
    alignSelf: 'center',
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D0E5FF',
    backgroundColor: '#F4FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loadOlderText: { fontSize: 13, fontWeight: '700', color: '#3182F6' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  completeModal: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 22,
  },
  completeModalTitle: { fontSize: 17, fontWeight: 'bold', color: '#495057', marginBottom: 8 },
  completeModalDesc: { fontSize: 13, color: '#8B95A1', lineHeight: 20, marginBottom: 16 },
  shareTypeButton: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 10,
  },
  shareTypeButtonSelected: { borderColor: '#3182F6', backgroundColor: '#E8F3FF' },
  shareTypeText: { fontSize: 15, color: '#495057', fontWeight: '600' },
  shareTypeTextSelected: { color: '#3182F6' },
  completeModalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 15, color: '#495057', fontWeight: '700' },
  modalConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#3182F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 15, color: '#ffffff', fontWeight: '800' },
  reportInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#495057',
    fontSize: 14,
    textAlignVertical: 'top',
    marginTop: 4,
    marginBottom: 12,
  },
  blockUserButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE1E4',
    backgroundColor: '#FFF5F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  blockUserText: { fontSize: 14, fontWeight: '800', color: '#E5484D' },
});
