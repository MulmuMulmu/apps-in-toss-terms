import React, { useCallback, useState } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { deleteChatRooms, getChatListPage } from '../api/chats';

const TABS = [
  { label: '전체', value: 'all' },
  { label: '나눔받기', value: 'take' },
  { label: '나눔하기', value: 'give' },
];
const CHAT_PAGE_SIZE = 20;

const formatChatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
};

const normalizeChat = (item, index) => ({
  id: item.chatRoomId || item.id || `${item.senderNicName}-${item.sendTime}-${index}`,
  chatRoomId: item.chatRoomId,
  postId: item.postId,
  name: item.senderNicName || item.name || '상대방',
  lastMessage: item.lastMessage || '아직 메시지가 없어요.',
  time: formatChatTime(item.sendTime),
  rawTime: item.sendTime,
  type: item.type || 'take',
});

export default function ChatScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChatRoomIds, setSelectedChatRoomIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const loadChats = useCallback(async (tab = activeTab, asRefresh = false, targetPage = 0) => {
    if (asRefresh) setRefreshing(true);
    else if (targetPage === 0) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const response = await getChatListPage({ type: tab.value, page: targetPage, size: CHAT_PAGE_SIZE });
      const nextItems = (Array.isArray(response?.items) ? response.items : []).map(normalizeChat);
      setChats((current) => (targetPage === 0 ? nextItems : [...current, ...nextItems]));
      setPage(targetPage);
      setHasNextPage(response?.hasNext === true);
    } catch (caughtError) {
      if (targetPage === 0) setChats([]);
      setError(caughtError instanceof Error ? caughtError.message : '채팅 목록을 불러오지 못했어요.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      void loadChats(activeTab);
    }, [activeTab, loadChats])
  );

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    setPage(0);
    setHasNextPage(false);
    setSelectionMode(false);
    setSelectedChatRoomIds([]);
    void loadChats(tab, false, 0);
  };

  const selectableChats = chats.filter((chat) => chat.chatRoomId);
  const selectedCount = selectedChatRoomIds.length;

  const toggleSelectionMode = () => {
    setSelectionMode((current) => !current);
    setSelectedChatRoomIds([]);
  };

  const toggleChatSelection = (chatRoomId) => {
    if (!chatRoomId) return;
    setSelectedChatRoomIds((current) => (
      current.includes(chatRoomId)
        ? current.filter((id) => id !== chatRoomId)
        : [...current, chatRoomId]
    ));
  };

  const removeDeletedChatsFromState = (chatRoomIds) => {
    setChats((current) => current.filter((chat) => !chatRoomIds.includes(chat.chatRoomId)));
    setSelectedChatRoomIds([]);
    setSelectionMode(false);
  };

  const runDelete = async (chatRoomIds) => {
    if (!chatRoomIds.length || deleting) return;
    setDeleting(true);
    try {
      await deleteChatRooms(chatRoomIds);
      removeDeletedChatsFromState(chatRoomIds);
    } catch (caughtError) {
      showAppDialog(
        '삭제 실패',
        caughtError instanceof Error ? caughtError.message : '채팅방을 삭제하지 못했어요.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (chatRoomIds) => {
    if (!chatRoomIds.length) return;
    showAppDialog(
      '채팅방 삭제',
      '내 채팅 목록에서만 삭제돼요. 신고 및 운영 확인을 위해 대화 기록은 서버에 보관됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => runDelete(chatRoomIds) },
      ]
    );
  };

  const handleChatPress = (chat) => {
    if (selectionMode) {
      toggleChatSelection(chat.chatRoomId);
      return;
    }
    navigation.navigate('ChatRoom', { chat });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>대화</Text>
        {selectableChats.length > 0 ? (
          <TouchableOpacity
            style={[styles.headerAction, selectionMode && styles.headerActionActive]}
            onPress={toggleSelectionMode}
            disabled={deleting}
            accessibilityLabel={selectionMode ? '선택 취소' : '채팅 선택 메뉴'}
          >
            <Ionicons
              name={selectionMode ? 'close-outline' : 'menu-outline'}
              size={22}
              color={selectionMode ? '#3182F6' : '#4E5968'}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={styles.tabItem}
            onPress={() => handleTabPress(tab)}
          >
            <Text style={[styles.tabText, activeTab.value === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {activeTab.value === tab.value && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#3182F6" />
          <Text style={styles.centerText}>채팅 목록을 불러오고 있어요.</Text>
        </View>
      ) : (
        <>
        {selectionMode ? (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>{selectedCount}개 선택됨</Text>
            <TouchableOpacity
              style={[styles.bulkDeleteButton, selectedCount === 0 && styles.bulkDeleteButtonDisabled]}
              onPress={() => confirmDelete(selectedChatRoomIds)}
              disabled={selectedCount === 0 || deleting}
            >
              <Text style={[styles.bulkDeleteText, selectedCount === 0 && styles.bulkDeleteTextDisabled]}>
                {deleting ? '삭제 중' : '선택 삭제'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadChats(activeTab, true)} />
          }
        >
          {error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : chats.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>채팅이 없어요</Text>
            </View>
          ) : (
            chats.map((chat) => (
              <View
                key={chat.id}
                style={[
                  styles.chatItem,
                  selectedChatRoomIds.includes(chat.chatRoomId) && styles.chatItemSelected,
                ]}
              >
                {selectionMode ? (
                  <TouchableOpacity
                    style={[
                      styles.selectionCircle,
                      selectedChatRoomIds.includes(chat.chatRoomId) && styles.selectionCircleActive,
                    ]}
                    onPress={() => toggleChatSelection(chat.chatRoomId)}
                    disabled={!chat.chatRoomId || deleting}
                    accessibilityLabel="채팅방 선택"
                  >
                    {selectedChatRoomIds.includes(chat.chatRoomId) ? (
                      <Text style={styles.selectionCheck}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.chatPressArea}
                  disabled={!chat.chatRoomId || deleting}
                  onPress={() => handleChatPress(chat)}
                >
                <View style={styles.avatar} />
                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatLastMessage} numberOfLines={1}>
                    {chat.lastMessage}
                  </Text>
                </View>
                <View style={styles.chatMeta}>
                  <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                </TouchableOpacity>
              </View>
            ))
          )}
          {!error && chats.length > 0 && hasNextPage ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => loadChats(activeTab, false, page + 1)}
              disabled={loadingMore}
            >
              <Text style={styles.loadMoreText}>{loadingMore ? '불러오는 중' : '더 보기'}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF9FF' },
  header: {
    paddingTop: 80,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 25, fontWeight: 'bold', color: '#495057' },
  headerAction: {
    minWidth: 52,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionActive: { backgroundColor: '#E8F3FF' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dee2e6',
    paddingHorizontal: 20,
  },
  tabItem: {
    marginRight: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: { fontSize: 15, color: '#adb5bd' },
  tabTextActive: { color: '#495057', fontWeight: 'bold' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#495057',
    borderRadius: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f3f5',
  },
  chatItemSelected: { backgroundColor: '#F4FAFF' },
  chatPressArea: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dee2e6',
    marginRight: 14,
  },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: 'bold', color: '#495057', marginBottom: 4 },
  chatLastMessage: { fontSize: 13, color: '#adb5bd' },
  chatMeta: { alignItems: 'flex-end', gap: 6 },
  chatTime: { fontSize: 12, color: '#adb5bd' },
  selectionBar: {
    minHeight: 52,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionText: { fontSize: 14, fontWeight: '700', color: '#4E5968' },
  bulkDeleteButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkDeleteButtonDisabled: { backgroundColor: '#F2F4F6' },
  bulkDeleteText: { fontSize: 14, fontWeight: '800', color: '#F04452' },
  bulkDeleteTextDisabled: { color: '#B0B8C1' },
  selectionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#D1D6DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCircleActive: {
    borderColor: '#3182F6',
    backgroundColor: '#3182F6',
  },
  selectionCheck: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  centerContainer: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  centerText: { marginTop: 10, fontSize: 14, color: '#8B95A1' },
  emptyText: { fontSize: 15, color: '#adb5bd', textAlign: 'center' },
  loadMoreButton: {
    height: 44,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0E5FF',
    backgroundColor: '#F4FAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: { fontSize: 14, fontWeight: '700', color: '#3182F6' },
});
