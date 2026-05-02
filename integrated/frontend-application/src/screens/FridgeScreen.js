import React, { useEffect, useMemo, useState } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteMyIngredients, getMyIngredientsPage } from '../api/ingredients';
import { getIngredientVisualForItem } from '../data/categoryVisuals';
import { colors, radius } from '../styles/tossTokens';

const categories = ['전체', '정육/계란', '해산물', '채소/과일', '유제품', '쌀/면/빵', '소스/조미료/오일', '가공식품', '기타'];
const statusOptions = ['미사용', '사용 중', '사용 완료'];
const INGREDIENT_PAGE_SIZE = 20;

const getDdayColor = (dday) => {
  const day = parseInt(String(dday).replace('D-', ''), 10);
  if (Number.isNaN(day)) return colors.placeholder;
  if (day <= 3) return colors.danger;
  if (day <= 7) return colors.warning;
  return colors.primary;
};

export default function FridgeScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [sortVisible, setSortVisible] = useState(false);
  const [sortType, setSortType] = useState('날짜순');
  const [addVisible, setAddVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItemKeys, setSelectedItemKeys] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const getSortParam = () => {
    if (sortType === '날짜순(내림차순)') return 'date&descending';
    if (sortType === '이름순(오름차순)') return 'name&ascending';
    if (sortType === '이름순(내림차순)') return 'name&descending';
    return 'date&ascending';
  };

  const loadIngredients = async ({ targetPage = 0, append = false } = {}) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const data = await getMyIngredientsPage({
        page: targetPage,
        size: INGREDIENT_PAGE_SIZE,
        sort: getSortParam(),
        categories: selectedCategories,
      });
      const pageResult = data?.result ?? data?.data ?? {};
      const result = pageResult?.items ?? [];
      if (!data?.success || !Array.isArray(result)) {
        setLoadError('식재료 목록을 불러오지 못했어요.');
        return;
      }

      const mappedItems = result.map((item, index) => {
        const dday = item.dDay ?? item.dday;
        return {
          id: item.userIngredientId ?? item.id ?? item.ingredientId ?? `${item.ingredient ?? item.name ?? 'item'}-${item.expirationDate ?? 'date'}-${index}`,
          userIngredientId: item.userIngredientId ?? item.id ?? item.ingredientId ?? null,
          name: item.ingredient ?? item.name ?? item.productName ?? '이름 없는 재료',
          status: '미사용',
          dday: dday === undefined || dday === null ? 'D-?' : `D-${dday}`,
          date: item.expirationDate ?? '',
          category: item.category ?? '기타',
        };
      });
      setItems((current) => (append ? [...current, ...mappedItems] : mappedItems));
      setPage(targetPage);
      setHasNextPage(pageResult?.hasNext === true);
      setLoadError('');
    } catch (error) {
      setLoadError('서버와 연결할 수 없어 식재료를 불러오지 못했어요.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadIngredients();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    loadIngredients();
  }, [selectedCategories, sortType]);

  const toggleCategory = (cat) => {
    if (cat === '전체') {
      setSelectedCategories([]);
      return;
    }
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const getDdayNumber = (dday) => {
    const value = parseInt(String(dday).replace('D-', ''), 10);
    return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
  };

  const warningCount = items.filter(item => getDdayNumber(item.dday) <= 3).length;

  const openEditModal = (item) => {
    setEditingItem({ ...item });
    setEditVisible(true);
  };

  const toggleSelectedItem = (id) => {
    setSelectedItemKeys((current) => (
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    ));
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedItemKeys([]);
  };

  const saveEditModal = () => {
    if (!editingItem) return;
    setItems((current) => current.map((item) => (
      item.id === editingItem.id ? editingItem : item
    )));
    setEditVisible(false);
    setEditingItem(null);
  };

  const deleteItems = async (targetIds) => {
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    const validIds = ids.filter(Boolean);
    if (validIds.length === 0) {
      showAppDialog('삭제 불가', '삭제할 식재료 정보를 찾지 못했어요.');
      return;
    }

    try {
      await deleteMyIngredients(validIds);
      setItems((current) => current.filter((item) => !validIds.includes(item.userIngredientId)));
      setEditVisible(false);
      setEditingItem(null);
      exitSelectionMode();
    } catch (error) {
      showAppDialog('삭제 실패', error instanceof Error ? error.message : '식재료를 삭제하지 못했어요.');
    }
  };

  const getSelectedBackendIds = () => (
    items
      .filter((item) => selectedItemKeys.includes(item.id))
      .map((item) => item.userIngredientId)
      .filter(Boolean)
  );

  const confirmDeleteItems = (targetIds, message) => {
    showAppDialog('식재료 삭제', message, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteItems(targetIds),
      },
    ]);
  };

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = items.filter(item => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
      const matchesSearch = keyword.length === 0 || item.name.toLowerCase().includes(keyword);
      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortType === '날짜순(내림차순)') {
        return getDdayNumber(b.dday) - getDdayNumber(a.dday);
      }
      if (sortType === '이름순(오름차순)') {
        return a.name.localeCompare(b.name, 'ko');
      }
      if (sortType === '이름순(내림차순)') {
        return b.name.localeCompare(a.name, 'ko');
      }
      return getDdayNumber(a.dday) - getDdayNumber(b.dday);
    });
  }, [items, search, selectedCategories, sortType]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>내 식자재</Text>
          <TouchableOpacity
            style={[styles.selectModeButton, selectionMode && styles.selectModeButtonActive]}
            onPress={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
            accessibilityLabel={selectionMode ? '선택 취소' : '식자재 선택 메뉴'}
          >
            <Ionicons
              name={selectionMode ? 'close-outline' : 'menu-outline'}
              size={22}
              color={selectionMode ? colors.primary : colors.subText}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>소비기한이 3일 이내 식자재가 {warningCount}개 있어요.</Text>

        {selectionMode && (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>{selectedItemKeys.length}개 선택됨</Text>
            <TouchableOpacity
              style={[styles.selectionDeleteButton, selectedItemKeys.length === 0 && styles.selectionDeleteButtonDisabled]}
              disabled={selectedItemKeys.length === 0}
              onPress={() => {
                const backendIds = getSelectedBackendIds();
                if (backendIds.length !== selectedItemKeys.length) {
                  showAppDialog('삭제 불가', '일부 식재료의 삭제 ID를 찾지 못했어요. 목록을 새로고침한 뒤 다시 시도해주세요.');
                  return;
                }
                confirmDeleteItems(backendIds, `선택한 식재료 ${selectedItemKeys.length}개를 삭제할까요?`);
              }}
            >
              <Text style={styles.selectionDeleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortVisible(true)}
          >
            <Text style={styles.sortButtonText}>{sortType} ∨</Text>
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  (cat === '전체' && selectedCategories.length === 0) ||
                  selectedCategories.includes(cat)
                    ? styles.categoryButtonSelected
                    : null,
                ]}
                onPress={() => toggleCategory(cat)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  (cat === '전체' && selectedCategories.length === 0) ||
                  selectedCategories.includes(cat)
                    ? styles.categoryButtonTextSelected
                    : null,
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="검색어를 입력하세요"
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          <Ionicons name="search-outline" size={20} color={colors.placeholder} />
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>식재료를 불러오는 중이에요.</Text>
        </View>
      ) : loadError ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>식재료를 불러오지 못했어요.</Text>
          <Text style={styles.emptySubText}>{loadError}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>등록된 재료가 없어요.</Text>
          <Text style={styles.emptySubText}>{'\'추가\' 버튼을 눌러\n재료를 추가해 주세요.'}</Text>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>조건에 맞는 재료가 없어요.</Text>
          <Text style={styles.emptySubText}>검색어나 카테고리를 다시 확인해 주세요.</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {filteredData.map((item) => {
            const visual = getIngredientVisualForItem({ name: item.name, category: item.category });
            const selected = selectedItemKeys.includes(item.id);

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, selected && styles.itemCardSelected]}
                onPress={() => {
                  if (selectionMode) {
                    toggleSelectedItem(item.id);
                  } else {
                    openEditModal(item);
                  }
                }}
              >
                {selectionMode && (
                  <View style={[
                    styles.checkCircle,
                    selected && styles.checkCircleSelected,
                  ]}>
                    {selected && (
                      <Ionicons name="checkmark" size={15} color="#ffffff" />
                    )}
                  </View>
                )}
                <View style={[styles.itemImageContainer, { backgroundColor: visual.backgroundColor }]}>
                  <Image source={visual.image} style={styles.itemCategoryImage} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemStatus}>{item.status}</Text>
                </View>
                <View style={styles.itemRight}>
                  <View style={[styles.ddayBadge, { backgroundColor: getDdayColor(item.dday) }]}>
                    <Text style={styles.ddayText}>{item.dday}</Text>
                  </View>
                  <Text style={styles.itemDate}>{item.date}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {hasNextPage && search.trim().length === 0 ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => loadIngredients({ targetPage: page + 1, append: true })}
              disabled={loadingMore}
            >
              <Text style={styles.loadMoreText}>{loadingMore ? '불러오는 중' : '더 보기'}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setAddVisible(!addVisible)}
      >
        <Text style={styles.addButtonText}>+ 추가</Text>
      </TouchableOpacity>

      {addVisible && (
        <View style={styles.addPopupContainer}>
          <View style={styles.addPopup}>
            <TouchableOpacity
              style={styles.addPopupItem}
              onPress={() => {
                setAddVisible(false);
                navigation.navigate('DirectInput');
              }}
            >
              <Text style={styles.addPopupText}>직접 입력</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addPopupItem}
              onPress={() => {
                setAddVisible(false);
                navigation.navigate('ReceiptGallery');
              }}
            >
              <Text style={styles.addPopupText}>영수증 등록</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addPopupItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setAddVisible(false);
                navigation.navigate('ReceiptCamera');
              }}
            >
              <Text style={styles.addPopupText}>영수증 촬영</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.addCloseButton}
            onPress={() => setAddVisible(false)}
          >
            <Text style={styles.addCloseButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {sortVisible && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setSortVisible(false)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>정렬</Text>
            {['날짜순(오름차순)', '날짜순(내림차순)', '이름순(오름차순)', '이름순(내림차순)'].map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalItem}
                onPress={() => {
                  setSortType(type);
                  setSortVisible(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  sortType === type && styles.modalItemTextSelected,
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}

      <Modal visible={editVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.editModalHeader}>
              <Text style={styles.modalTitle}>식재료 수정</Text>
              <TouchableOpacity
                style={styles.editTopDeleteButton}
                onPress={() => confirmDeleteItems(editingItem?.userIngredientId, `${editingItem?.name || '이 식재료'}를 삭제할까요?`)}
              >
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
                <Text style={styles.editTopDeleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.editLabel}>식재료명</Text>
            <TextInput
              style={styles.editInput}
              value={editingItem?.name || ''}
              onChangeText={(name) => setEditingItem((current) => ({ ...current, name }))}
              placeholder="식재료명"
              placeholderTextColor={colors.placeholder}
              returnKeyType="done"
            />

            <Text style={styles.editLabel}>사용 여부</Text>
            <View style={styles.optionRow}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.optionChip, editingItem?.status === status && styles.optionChipSelected]}
                  onPress={() => setEditingItem((current) => ({ ...current, status }))}
                >
                  <Text style={[
                    styles.optionChipText,
                    editingItem?.status === status && styles.optionChipTextSelected,
                  ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.editLabel}>분류</Text>
            <View style={styles.optionRow}>
              {categories.filter((category) => category !== '전체').map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.optionChip, editingItem?.category === category && styles.optionChipSelected]}
                  onPress={() => setEditingItem((current) => ({ ...current, category }))}
                >
                  <Text style={[
                    styles.optionChipText,
                    editingItem?.category === category && styles.optionChipTextSelected,
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.editActionRow}>
              <TouchableOpacity style={styles.editCancelButton} onPress={() => setEditVisible(false)}>
                <Text style={styles.editCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editSaveButton} onPress={saveEditModal}>
                <Text style={styles.editSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectModeButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectModeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: '#E8F3FF',
  },
  subtitle: {
    fontSize: 15,
    color: colors.danger,
    backgroundColor: colors.dangerSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginBottom: 14,
    overflow: 'hidden',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  selectionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  selectionDeleteButton: {
    backgroundColor: colors.danger,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  selectionDeleteButtonDisabled: {
    opacity: 0.35,
  },
  selectionDeleteText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  sortButtonText: {
    fontSize: 13,
    color: colors.subText,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    marginRight: 6,
  },
  categoryButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 13,
    color: colors.subText,
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  searchIcon: {
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyContainer: {
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
     marginTop: -150,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.placeholder,
    textAlign: 'center',
    lineHeight: 22,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  itemImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemCategoryImage: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  itemStatus: {
    fontSize: 13,
    color: colors.placeholder,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  ddayBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  ddayText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemDate: {
    fontSize: 12,
    color: colors.placeholder,
  },
  loadMoreButton: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D0E5FF',
    backgroundColor: '#F4FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 96,
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPopupContainer: {
    position: 'absolute',
    bottom: 75,
    right: 20,
    alignItems: 'center',
  },
  addPopup: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
  },
  addPopupItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  addPopupText: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  addCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addCloseButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  editTopDeleteButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFE1E4',
    backgroundColor: '#FFF5F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editTopDeleteText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },
  modalItemTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  itemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F1F8FF',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  editModal: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: 20,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.subText,
    marginTop: 12,
    marginBottom: 8,
  },
  editInput: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionChipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F3FF',
  },
  optionChipText: {
    fontSize: 13,
    color: colors.subText,
    fontWeight: '600',
  },
  optionChipTextSelected: {
    color: colors.primary,
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  editCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  editSaveButton: {
    flex: 1,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveText: {
    color: colors.surfaceRaised,
    fontSize: 15,
    fontWeight: '800',
  },
});
