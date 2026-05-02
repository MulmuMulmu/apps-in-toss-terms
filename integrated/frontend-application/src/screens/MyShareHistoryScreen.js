import React, { useCallback, useState } from 'react';
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
import { getMyShareList } from '../api/shares';
import { getIngredientVisualForItem } from '../data/categoryVisuals';

const normalizeHistory = (post, index) => ({
  id: post.postId || post.id || index,
  title: post.title || '제목 없음',
  content: post.content || post.description || '',
  image: post.image || null,
  ingredientName: post.ingredientName || post.food || '',
  category: post.category || '',
});

export default function MyShareHistoryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const list = await getMyShareList('나눔 완료');
      setItems((Array.isArray(list) ? list : []).map(normalizeHistory));
    } catch (caughtError) {
      setItems([]);
      setError(caughtError instanceof Error ? caughtError.message : '나눔 내역을 불러오지 못했어요.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadHistory();
  }, [loadHistory]));

  const renderImage = (item) => {
    if (item.image) {
      return <Image source={{ uri: item.image }} style={styles.image} />;
    }
    const visual = getIngredientVisualForItem({ name: item.ingredientName || item.title, category: item.category });
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
        <Text style={styles.headerTitle}>나눔 내역</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.emptyText}>나눔 내역을 불러오고 있어요.</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>나눔 완료한 내역이 없어요.</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} />}
        >
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.imageBox}>{renderImage(item)}</View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc} numberOfLines={1}>{item.content}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>나눔완료</Text>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    gap: 14,
  },
  imageBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: 56, height: 56 },
  defaultImageBox: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  defaultImage: { width: 50, height: 50, borderRadius: 8 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  desc: { fontSize: 13, color: colors.placeholder },
  badge: {
    backgroundColor: '#E8F3FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, color: colors.primary, fontWeight: 'bold' },
});
