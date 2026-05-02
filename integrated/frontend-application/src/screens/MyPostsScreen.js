import React, { useCallback, useState } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius } from '../styles/tossTokens';
import { deleteMySharePost, getMyShareList } from '../api/shares';
import { getIngredientVisualForItem } from '../data/categoryVisuals';

const normalizeMyPost = (post, index) => ({
  id: post.postId || post.id || index,
  postId: post.postId || post.id,
  title: post.title || '제목 없음',
  content: post.content || post.description || '',
  image: post.image || null,
  ingredientName: post.ingredientName || post.food || '',
  category: post.category || '',
  expirationDate: post.expirationDate || '',
});

export default function MyPostsScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const list = await getMyShareList('나눔 중');
      setPosts((Array.isArray(list) ? list : []).map(normalizeMyPost));
    } catch (caughtError) {
      setPosts([]);
      setError(caughtError instanceof Error ? caughtError.message : '내가 쓴 글을 불러오지 못했어요.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadPosts();
  }, [loadPosts]));

  const handleDelete = (postId) => {
    showAppDialog('삭제', '게시글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMySharePost(postId);
            setPosts((current) => current.filter((post) => post.postId !== postId));
          } catch (caughtError) {
            showAppDialog('삭제 실패', caughtError instanceof Error ? caughtError.message : '게시글을 삭제하지 못했어요.');
          }
        },
      },
    ]);
  };

  const renderImage = (post) => {
    if (post.image) {
      return <Image source={{ uri: post.image }} style={styles.postImage} />;
    }
    const visual = getIngredientVisualForItem({ name: post.ingredientName || post.title, category: post.category });
    return (
      <View style={[styles.defaultImageBox, { backgroundColor: visual.backgroundColor }]}>
        <Image source={visual.image} style={styles.defaultImage} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>이전</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내가 쓴 글</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.emptyText}>작성한 글을 불러오고 있어요.</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>작성한 글이 없어요.</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPosts(true)} />}
        >
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postImageBox}>{renderImage(post)}</View>
              <View style={styles.postInfo}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postDesc} numberOfLines={1}>{post.content}</Text>
                <Text style={styles.postDate}>{post.expirationDate ? `${post.expirationDate}까지` : '소비기한 정보 없음'}</Text>
              </View>
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('MyPostEdit', { post })}
                >
                  <Text style={styles.editButtonText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(post.postId)}
                >
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backButton: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontSize: 15, color: colors.placeholder, textAlign: 'center' },
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    gap: 14,
  },
  postImageBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  postImage: { width: 56, height: 56 },
  defaultImageBox: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  defaultImage: { width: 50, height: 50, borderRadius: 8 },
  postInfo: { flex: 1 },
  postTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  postDesc: { fontSize: 13, color: colors.placeholder, marginBottom: 4 },
  postDate: { fontSize: 12, color: colors.placeholder },
  postActions: { gap: 8 },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: { fontSize: 13, color: colors.text },
  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: { fontSize: 13, color: colors.danger },
});
