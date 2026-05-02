import React, { useEffect, useMemo, useState } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getShareDetail, reportSharePost } from '../api/shares';
import { startChat } from '../api/chats';
import { getIngredientVisualForItem } from '../data/categoryVisuals';

export default function MarketDetailScreen({ navigation, route }) {
  const routePost = route?.params?.post || null;
  const postId = routePost?.postId || routePost?.id || route?.params?.postId;
  const [detail, setDetail] = useState(routePost);
  const [loading, setLoading] = useState(Boolean(postId));
  const [startingChat, setStartingChat] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      if (!postId) {
        setLoading(false);
        setError('게시글 정보를 찾지 못했어요.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getShareDetail(postId);
        if (!cancelled) {
          setDetail({
            ...routePost,
            ...response,
            postId,
            description: response?.content,
            author: response?.sellerName,
            food: routePost?.food || response?.ingredientName || response?.title,
          });
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : '게시글을 불러오지 못했어요.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [postId, routePost]);

  const visual = useMemo(() => getIngredientVisualForItem({
    name: detail?.food || detail?.title,
    category: detail?.category,
  }), [detail?.category, detail?.food, detail?.title]);

  const handleReport = () => {
    if (!postId) return;
    showAppDialog('신고', '이 게시물을 신고하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '신고',
        style: 'destructive',
        onPress: async () => {
          try {
            await reportSharePost({
              postId,
              title: '부적절한 나눔글',
              content: '사용자 신고',
            });
            showAppDialog('신고가 접수되었습니다.');
          } catch (caughtError) {
            showAppDialog('신고 실패', caughtError instanceof Error ? caughtError.message : '신고를 접수하지 못했어요.');
          }
        },
      },
    ]);
  };

  const handleStartChat = async () => {
    if (!postId || startingChat) return;
    setStartingChat(true);
    try {
      const response = await startChat(postId);
      navigation.navigate('채팅', {
        screen: 'ChatRoom',
        params: {
          chatRoomId: response?.chatRoomId,
          chat: { chatRoomId: response?.chatRoomId, name: detail?.sellerName || detail?.author || '상대방' },
          post: detail,
        },
      });
    } catch (caughtError) {
      showAppDialog('채팅 시작 실패', caughtError instanceof Error ? caughtError.message : '채팅방을 만들지 못했어요.');
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerPage}>
        <ActivityIndicator color="#3182F6" />
        <Text style={styles.centerText}>나눔글을 불러오고 있어요.</Text>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={styles.centerPage}>
        <Text style={styles.centerText}>{error || '게시글을 찾지 못했어요.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          {detail.image ? (
            <Image source={{ uri: detail.image }} style={styles.image} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: visual.backgroundColor }]}>
              <Image source={visual.image} style={styles.imagePlaceholderIcon} />
            </View>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>이전</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
            <Ionicons name="alert-circle-outline" size={20} color="#495057" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <View style={styles.avatarPlaceholder} />
          </View>
          <Text style={styles.authorName}>{detail.sellerName || detail.author || '나눔 이웃'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.content}>
          <Text style={styles.title}>{detail.title}</Text>
          <Text style={styles.foodInfo}>
            {detail.category || '카테고리 없음'}
            {detail.expirationDate ? ` · ${detail.expirationDate}까지` : ''}
          </Text>
          <Text style={styles.description}>{detail.content || detail.description || '내용이 없어요.'}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.chatButton, startingChat && styles.chatButtonDisabled]}
          onPress={handleStartChat}
          disabled={startingChat}
        >
          <Text style={styles.chatButtonText}>{startingChat ? '연결 중' : '채팅하기'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF9FF' },
  centerPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF9FF',
    paddingHorizontal: 24,
  },
  centerText: { marginTop: 10, fontSize: 15, color: '#8B95A1', textAlign: 'center' },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#E8F3FF',
  },
  retryButtonText: { color: '#3182F6', fontWeight: '800' },
  imageContainer: {
    width: '100%',
    height: 280,
  },
  image: { width: '100%', height: 280 },
  imagePlaceholder: {
    width: '100%',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: { width: 190, height: 190, borderRadius: 42 },
  backButton: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { fontSize: 18, fontWeight: 'bold', color: '#495057' },
  reportButton: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dee2e6',
  },
  authorName: { fontSize: 15, fontWeight: '600', color: '#495057' },
  divider: { height: 0.5, backgroundColor: '#dee2e6', marginHorizontal: 20 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#495057', marginBottom: 8 },
  foodInfo: { fontSize: 14, color: '#adb5bd', marginBottom: 16 },
  description: { fontSize: 15, color: '#495057', lineHeight: 24 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FBF9FF',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#dee2e6',
  },
  chatButton: {
    height: 52,
    backgroundColor: '#87CEEB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonDisabled: { opacity: 0.6 },
  chatButtonText: { color: '#ffffff', fontSize: 17, fontWeight: 'bold' },
});
