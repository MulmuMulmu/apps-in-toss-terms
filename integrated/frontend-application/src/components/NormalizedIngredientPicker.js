import React, { useEffect, useState } from 'react';
import {
  Modal,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getIngredientsByCategory, searchIngredients } from '../api/ingredients';
import { getIngredientCategoryVisual } from '../data/categoryVisuals';

export const INGREDIENT_CATEGORIES = [
  '정육/계란',
  '해산물',
  '채소/과일',
  '유제품',
  '쌀/면/빵',
  '소스/조미료/오일',
  '가공식품',
  '기타',
];

export default function NormalizedIngredientPicker({
  selectedItems,
  onChange,
  placeholder = '표준 식재료를 검색해주세요',
  helperText = '검색 또는 카테고리 선택으로 표준 식재료만 추가할 수 있어요.',
  quickItems = [],
  allowNone = false,
}) {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState(INGREDIENT_CATEGORIES[0]);
  const [categoryItems, setCategoryItems] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const normalizedSelectedItems = selectedItems ?? [];
  const hasNone = normalizedSelectedItems.length === 0;

  useEffect(() => {
    const keyword = search.trim();
    if (keyword.length < 1) {
      setSuggestions([]);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await searchIngredients(keyword);
        const names = response?.result?.ingredientNames ?? [];
        if (!cancelled) {
          setSuggestions(names.filter((name) => !normalizedSelectedItems.includes(name)));
        }
      } catch (error) {
        if (!cancelled) {
          setSuggestions([]);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, normalizedSelectedItems]);

  const loadCategory = async (category) => {
    setActiveCategory(category);
    setCategoryLoading(true);
    try {
      const response = await getIngredientsByCategory(category);
      setCategoryItems(response?.result?.ingredientNames ?? []);
    } catch (error) {
      setCategoryItems([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  const openPicker = () => {
    setPickerVisible(true);
    loadCategory(activeCategory || INGREDIENT_CATEGORIES[0]);
  };

  const addItem = (name) => {
    if (!name || normalizedSelectedItems.includes(name)) {
      return;
    }
    onChange([...normalizedSelectedItems, name]);
    setSearch('');
    setSuggestions([]);
  };

  const removeItem = (name) => {
    onChange(normalizedSelectedItems.filter((item) => item !== name));
  };

  return (
    <View style={styles.container}>
      {allowNone && (
        <TouchableOpacity
          style={[styles.noneChip, hasNone && styles.noneChipActive]}
          onPress={() => onChange([])}
        >
          <Text style={[styles.noneChipText, hasNone && styles.noneChipTextActive]}>없음</Text>
        </TouchableOpacity>
      )}

      {normalizedSelectedItems.length > 0 && (
        <View style={styles.selectedWrap}>
          {normalizedSelectedItems.map((item) => (
            <TouchableOpacity key={item} style={styles.selectedChip} onPress={() => removeItem(item)}>
              <Text style={styles.selectedChipText}>{item} x</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {quickItems.length > 0 && (
        <View style={styles.quickWrap}>
          {quickItems.map((item) => {
            const active = normalizedSelectedItems.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.quickChip, active && styles.quickChipActive]}
                onPress={() => (active ? removeItem(item) : addItem(item))}
              >
                <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#adb5bd"
          value={search}
          onChangeText={setSearch}
        />
        <Ionicons name="search-outline" size={20} color="#adb5bd" />
      </View>
      <Text style={styles.helperText}>{helperText}</Text>

      {suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {suggestions.map((name) => (
            <TouchableOpacity key={name} style={styles.suggestionItem} onPress={() => addItem(name)}>
              <Text style={styles.suggestionText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.categoryButton} onPress={openPicker}>
        <Text style={styles.categoryButtonText}>카테고리에서 표준 식재료 고르기</Text>
        <Text style={styles.categoryButtonHint}>검색이 어렵다면 목록에서 선택하세요.</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>표준 식재료 선택</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
              {INGREDIENT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryTab, activeCategory === category && styles.categoryTabActive]}
                  onPress={() => loadCategory(category)}
                >
                  <Image source={getIngredientCategoryVisual(category).image} style={styles.categoryTabImage} />
                  <Text style={[styles.categoryTabText, activeCategory === category && styles.categoryTabTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={styles.categoryList} contentContainerStyle={styles.categoryListContent}>
              {categoryLoading ? (
                <Text style={styles.emptyText}>식재료를 불러오는 중이에요.</Text>
              ) : categoryItems.length === 0 ? (
                <Text style={styles.emptyText}>표시할 식재료가 없어요.</Text>
              ) : (
                categoryItems.map((name) => {
                  const active = normalizedSelectedItems.includes(name);
                  return (
                    <TouchableOpacity
                      key={`${activeCategory}-${name}`}
                      style={styles.categoryItem}
                      onPress={() => (active ? removeItem(name) : addItem(name))}
                    >
                      <Text style={[styles.categoryItemText, active && styles.categoryItemTextActive]}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  noneChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  noneChipActive: {
    backgroundColor: '#E8F7FD',
    borderColor: '#87CEEB',
  },
  noneChipText: {
    color: '#495057',
    fontSize: 13,
    fontWeight: '700',
  },
  noneChipTextActive: {
    color: '#228BE6',
  },
  selectedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#87CEEB',
  },
  selectedChipText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  quickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  quickChipActive: {
    backgroundColor: '#E8F7FD',
    borderColor: '#87CEEB',
  },
  quickChipText: {
    color: '#495057',
    fontSize: 13,
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: '#228BE6',
  },
  searchContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: '#343A40',
    fontSize: 14,
  },
  helperText: {
    color: '#868E96',
    fontSize: 12,
    lineHeight: 17,
  },
  suggestionBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F3F5',
  },
  suggestionText: {
    color: '#343A40',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryButton: {
    backgroundColor: '#F1FAFF',
    borderWidth: 1,
    borderColor: '#BEE9F7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  categoryButtonText: {
    color: '#228BE6',
    fontSize: 14,
    fontWeight: '800',
  },
  categoryButtonHint: {
    color: '#5C7C89',
    fontSize: 12,
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
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    maxHeight: '86%',
  },
  modalTitle: {
    color: '#343A40',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  categoryTabs: {
    flexGrow: 0,
    marginBottom: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F1F3F5',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#E8F7FD',
  },
  categoryTabImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  categoryTabText: {
    color: '#868E96',
    fontSize: 13,
    fontWeight: '700',
  },
  categoryTabTextActive: {
    color: '#228BE6',
  },
  categoryList: {
    maxHeight: 420,
  },
  categoryListContent: {
    paddingBottom: 24,
  },
  categoryItem: {
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E9ECEF',
  },
  categoryItemText: {
    color: '#495057',
    fontSize: 15,
    fontWeight: '600',
  },
  categoryItemTextActive: {
    color: '#228BE6',
    fontWeight: '800',
  },
  emptyText: {
    color: '#868E96',
    fontSize: 14,
    paddingVertical: 18,
    textAlign: 'center',
  },
});
