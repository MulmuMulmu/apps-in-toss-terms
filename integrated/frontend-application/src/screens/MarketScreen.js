import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../styles/tossTokens';
import { getMyShareLocation, getShareList, updateShareLocation } from '../api/shares';
import KakaoMapView from '../components/KakaoMapView';
import { getIngredientVisualForItem } from '../data/categoryVisuals';

const DEFAULT_COORDINATE = { latitude: 37.5665, longitude: 126.9780 };
const RADIUS_OPTIONS = [3, 5, 10, 20, 50];
const SHARE_PAGE_SIZE = 10;

const formatDistance = (distance) => {
  if (distance === null || distance === undefined) return '';
  const numeric = Number(distance);
  if (Number.isNaN(numeric)) return String(distance);
  if (numeric < 1) return `${Math.round(numeric * 1000)}m`;
  return `${numeric.toFixed(1)}km`;
};

const formatTimeAgo = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${Math.floor(diffHours / 24)}일 전`;
};

const normalizeSharePost = (item, index) => ({
  id: item.postId || item.id || index,
  postId: item.postId || item.id,
  title: item.title || '제목 없음',
  food: item.ingredientName || item.ingredient || item.title,
  category: item.category || '',
  description: item.content || '',
  distance: formatDistance(item.distance),
  neighborhood: item.locationName || '위치 정보 없음',
  timeAgo: formatTimeAgo(item.createdAt || item.createTime),
  image: item.image || null,
  latitude: item.latitude,
  longitude: item.longitude,
});

const getBrowserPosition = () => new Promise((resolve, reject) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    reject(new Error('현재 위치를 가져올 수 없는 환경이에요.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => resolve({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }),
    reject,
    { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
  );
});

export default function MarketScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [location, setLocation] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [radiusModalVisible, setRadiusModalVisible] = useState(false);
  const [sharePage, setSharePage] = useState(0);
  const [hasNextSharePage, setHasNextSharePage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((post) =>
      [post.title, post.food, post.category, post.description, post.neighborhood]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [posts, search]);

  const loadShares = useCallback(async ({
    asRefresh = false,
    nextRadiusKm = radiusKm,
    nextPage = 0,
    append = false,
  } = {}) => {
    if (append) setLoadingMore(true);
    else if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await getShareList({
        radiusKm: nextRadiusKm,
        page: nextPage,
        size: SHARE_PAGE_SIZE,
      });
      const items = Array.isArray(response?.items) ? response.items : [];
      const nextPosts = items.map(normalizeSharePost);
      setPosts((currentPosts) => (append ? [...currentPosts, ...nextPosts] : nextPosts));
      setSharePage(response?.page ?? nextPage);
      setHasNextSharePage(Boolean(response?.hasNext));
    } catch (caughtError) {
      if (!append) setPosts([]);
      setError(caughtError instanceof Error ? caughtError.message : '근처 나눔 게시글을 불러오지 못했어요.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [radiusKm]);

  const loadSavedLocation = useCallback(async () => {
    try {
      const response = await getMyShareLocation();
      const coordinate = response?.latitude && response?.longitude
        ? { latitude: response.latitude, longitude: response.longitude }
        : DEFAULT_COORDINATE;
      setLocation({
        name: response?.display_address || response?.full_address || '주소 설정 필요',
        address: response?.full_address || response?.display_address || '주소를 설정하면 근처 나눔을 보여드려요.',
        coordinate,
      });
      return true;
    } catch (caughtError) {
      setLocation(null);
      return false;
    }
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const coordinate = await getBrowserPosition();
      const response = await updateShareLocation(coordinate);
      setLocation({
        name: response?.display_address || '현재 위치',
        address: response?.full_address || '현재 위치 기준',
        coordinate: response?.latitude && response?.longitude
          ? { latitude: response.latitude, longitude: response.longitude }
          : coordinate,
      });
      await loadShares({ nextRadiusKm: radiusKm });
    } catch (caughtError) {
      setLocation({
        name: '위치 미설정',
        address: '현재 위치 권한이 필요해요.',
        coordinate: DEFAULT_COORDINATE,
      });
      setError(caughtError instanceof Error ? caughtError.message : '현재 위치를 설정하지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [loadShares, radiusKm]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadInitialData = async () => {
        setLoading(true);
        const hasLocation = await loadSavedLocation();
        if (!active) return;
        if (hasLocation) {
          await loadShares({ nextRadiusKm: radiusKm });
        } else {
          setPosts([]);
          setError(null);
          setLoading(false);
        }
      };

      void loadInitialData();
      return () => {
        active = false;
      };
    }, [loadSavedLocation, loadShares, radiusKm])
  );

  const handleRadiusChange = useCallback((nextRadiusKm) => {
    setRadiusKm(nextRadiusKm);
    setRadiusModalVisible(false);
    if (location) {
      void loadShares({ nextRadiusKm, nextPage: 0 });
    }
  }, [loadShares, location]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasNextSharePage) {
      return;
    }
    void loadShares({
      nextRadiusKm: radiusKm,
      nextPage: sharePage + 1,
      append: true,
    });
  }, [hasNextSharePage, loadShares, loading, loadingMore, radiusKm, sharePage]);

  const renderPostImage = (post, imageStyle = styles.image) => {
    if (post.image) {
      return <Image source={{ uri: post.image }} style={imageStyle} />;
    }

    const visual = getIngredientVisualForItem({ name: post.food || post.title, category: post.category });
    return (
      <View style={[styles.defaultImageBox, { backgroundColor: visual.backgroundColor }]}>
        <Image source={visual.image} style={styles.defaultImage} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>나눔</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LocationSetting')}>
              <Text style={styles.location}>{location?.name || '주소 설정 필요'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setSearchVisible(!searchVisible)}
          >
            <Ionicons name="search-outline" size={21} color={colors.subText} />
          </TouchableOpacity>
        </View>

        {searchVisible && (
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={colors.placeholder} />
            <TextInput
              style={styles.searchInput}
              placeholder="나눔 품목이나 동네를 검색하세요"
              placeholderTextColor={colors.placeholder}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.placeholder} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentBody}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadShares({ asRefresh: true, nextRadiusKm: radiusKm })} />
        }
      >
        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <View>
              <Text style={styles.mapEyebrow}>현재 위치 기준</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LocationSetting')}>
                <Text style={styles.mapTitle}>{location?.address || '주소를 설정하면 근처 나눔을 보여드려요.'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.changeLocationButton}
              onPress={handleUseCurrentLocation}
            >
              <Text style={styles.changeLocationText}>현재 위치</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapCanvas}>
            <KakaoMapView
              center={location?.coordinate || DEFAULT_COORDINATE}
              markers={posts}
              style={styles.mapCanvas}
            />
          </View>

          <View style={styles.mapFooter}>
            <Text style={styles.mapFooterText}>
              반경 {radiusKm}km 안의 나눔 {posts.length}건을 보여줘요.
            </Text>
            <TouchableOpacity
              style={styles.radiusChip}
              onPress={() => setRadiusModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`현재 나눔 반경 ${radiusKm}킬로미터, 반경 변경`}
            >
              <Text style={styles.radiusChipText}>{radiusKm}km</Text>
              <Ionicons name="chevron-down" size={15} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>근처 나눔 게시글</Text>
          <Text style={styles.sectionCount}>{filteredPosts.length}개</Text>
        </View>

        {loading ? (
          <View style={styles.emptyList}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.emptyListText}>나눔 게시글을 불러오고 있어요.</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>{error}</Text>
            <TouchableOpacity style={styles.locationButton} onPress={handleUseCurrentLocation}>
              <Text style={styles.locationButtonText}>현재 위치 설정하기</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>근처 나눔 게시글이 없어요.</Text>
          </View>
        ) : (
          filteredPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postCard}
              onPress={() => navigation.navigate('MarketDetail', { post })}
            >
              <View style={styles.postImage}>
                {renderPostImage(post)}
              </View>
              <View style={styles.postInfo}>
                <View style={styles.postTitleRow}>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.distance}>{post.distance}</Text>
                </View>
                <Text style={styles.postMeta}>
                  {post.neighborhood}
                  {post.timeAgo ? ` · ${post.timeAgo}` : ''}
                  {post.category ? ` · ${post.category}` : ''}
                </Text>
                <Text style={styles.postDescription} numberOfLines={2}>
                  {post.description || '상세 내용은 게시글에서 확인해주세요.'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {!loading && !error && hasNextSharePage ? (
          <TouchableOpacity
            style={[styles.loadMoreButton, loadingMore ? styles.loadMoreButtonDisabled : null]}
            onPress={handleLoadMore}
            disabled={loadingMore}
            accessibilityRole="button"
            accessibilityLabel="나눔 게시글 더 보기"
          >
            {loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
            <Text style={styles.loadMoreText}>{loadingMore ? '불러오는 중' : '더 보기'}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <TouchableOpacity
        style={styles.writeButton}
        onPress={() => navigation.navigate('MarketWrite')}
      >
        <Text style={styles.writeButtonText}>+ 글쓰기</Text>
      </TouchableOpacity>

      <Modal
        visible={radiusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRadiusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setRadiusModalVisible(false)}
        >
          <View
            style={styles.radiusModal}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.radiusModalHeader}>
              <View>
                <Text style={styles.radiusModalTitle}>나눔 반경 설정</Text>
                <Text style={styles.radiusModalSubtitle}>
                  가까운 동네부터 넓은 지역까지 필요한 만큼 조정해요.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setRadiusModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="나눔 반경 설정 닫기"
              >
                <Ionicons name="close" size={20} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <View style={styles.radiusPanel}>
              <View style={styles.radiusHeader}>
                <Text style={styles.radiusLabel}>현재 반경</Text>
                <Text style={styles.radiusValue}>{radiusKm}km</Text>
              </View>
              <View style={styles.radiusTrack}>
                <View
                  style={[
                    styles.radiusTrackFill,
                    { width: `${(RADIUS_OPTIONS.indexOf(radiusKm) / (RADIUS_OPTIONS.length - 1)) * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.radiusOptions}>
                {RADIUS_OPTIONS.map((option) => {
                  const selected = option === radiusKm;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.radiusOption, selected ? styles.radiusOptionSelected : null]}
                      onPress={() => handleRadiusChange(option)}
                      accessibilityRole="button"
                      accessibilityLabel={`나눔 반경 ${option}킬로미터로 설정`}
                    >
                      <Text style={[styles.radiusOptionText, selected ? styles.radiusOptionTextSelected : null]}>
                        {option}km
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 14,
    backgroundColor: colors.surfaceRaised,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  location: {
    fontSize: 15,
    color: colors.subText,
    marginTop: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentBody: {
    padding: 20,
    paddingBottom: 120,
  },
  mapCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#193B5A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  mapEyebrow: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 5,
  },
  mapTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  changeLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#E8F3FF',
  },
  changeLocationText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  mapCanvas: {
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#EAF7EF',
  },
  mapFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  mapFooterText: {
    flex: 1,
    fontSize: 13,
    color: colors.subText,
  },
  radiusChip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F5FAFF',
    borderWidth: 1,
    borderColor: '#D5E9FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  radiusChipText: { fontSize: 12, fontWeight: '900', color: colors.primary },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
    justifyContent: 'flex-end',
  },
  radiusModal: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 26,
  },
  radiusModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 16,
  },
  radiusModalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.text,
  },
  radiusModalSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.subText,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusPanel: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F5FAFF',
    borderWidth: 1,
    borderColor: '#D5E9FF',
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  radiusLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  radiusValue: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.primary,
  },
  radiusTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#DDEAFB',
    overflow: 'hidden',
    marginBottom: 12,
  },
  radiusTrackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: '#DDE3EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusOptionText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.subText,
  },
  radiusOptionTextSelected: {
    color: colors.surfaceRaised,
  },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 13,
    color: colors.subText,
  },
  postCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postImage: {
    width: 78,
    height: 78,
    borderRadius: radius.md,
    backgroundColor: '#F0F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  image: {
    width: 78,
    height: 78,
    borderRadius: radius.md,
  },
  defaultImageBox: {
    width: 78,
    height: 78,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  defaultImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  postInfo: {
    flex: 1,
  },
  postTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  postTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  distance: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  postMeta: {
    marginTop: 5,
    fontSize: 12,
    color: colors.placeholder,
  },
  postDescription: {
    marginTop: 8,
    fontSize: 14,
    color: colors.subText,
    lineHeight: 20,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
  },
  emptyListText: {
    fontSize: 14,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 20,
  },
  locationButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  locationButtonText: {
    color: colors.surfaceRaised,
    fontSize: 14,
    fontWeight: '800',
  },
  loadMoreButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D5E9FF',
    backgroundColor: '#F5FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  loadMoreButtonDisabled: {
    opacity: 0.7,
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  writeButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 13,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  writeButtonText: {
    color: colors.surfaceRaised,
    fontSize: 16,
    fontWeight: '800',
  },
});
