import React, { useEffect, useState } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import {
  createIngredients,
  getMyIngredients,
  getIngredientsByCategory,
  predictIngredientExpirations,
  searchIngredients,
} from '../api/ingredients';

const categories = ['전체', '정육/계란', '해산물', '채소/과일', '유제품', '쌀/면/빵', '소스/조미료/오일', '가공식품', '기타'];

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DirectInputScreen({ navigation, route }) {
  const initialItems = route?.params?.items ?? (route?.params?.item ? [route.params.item] : []);
  const purchaseDate = route?.params?.purchaseDate;
  const [items, setItems] = useState(
    initialItems.length > 0
      ? initialItems.map((item) => ({
          name: item?.ingredientName ?? item?.normalized_name ?? item?.product_name ?? '',
          rawName: item?.raw_product_name ?? item?.product_name ?? '',
          purchaseDate: purchaseDate || formatDate(new Date()),
          expirationDate: '',
          category: item?.category ?? '',
          selected: item?.mapping_status === 'MAPPED' || Boolean(item?.ingredientId || item?.ingredientName),
        }))
      : [{ name: '', rawName: '', purchaseDate: formatDate(new Date()), expirationDate: '', category: '', selected: false }]
  );
  const [editingIndex, setEditingIndex] = useState(0);
  const [categoryVisible, setCategoryVisible] = useState(false);
  const [ingredientSuggestions, setIngredientSuggestions] = useState([]);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [activeIngredientCategory, setActiveIngredientCategory] = useState('');
  const [categoryIngredientSuggestions, setCategoryIngredientSuggestions] = useState([]);
  const [categoryIngredientLoading, setCategoryIngredientLoading] = useState(false);
  const [ingredientCategoryIndex, setIngredientCategoryIndex] = useState({});
  const [existingIngredientNames, setExistingIngredientNames] = useState(new Set());
  const [predictionLoading, setPredictionLoading] = useState(false);

  const currentItem = items[editingIndex] ?? items[0];

  const parseDate = (value) => {
    const normalized = normalizeDate(value ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return null;
    }
    const [year, month, day] = normalized.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year
      || parsed.getMonth() !== month - 1
      || parsed.getDate() !== day
    ) {
      return null;
    }
    return parsed;
  };

  const openDatePicker = () => {
    const selectedDate = parseDate(currentItem?.purchaseDate);
    setCalendarMonth(selectedDate ?? new Date());
    setDatePickerVisible(true);
  };

  const moveCalendarMonth = (amount) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: lastDate }, (_, index) => new Date(year, month, index + 1)),
    ];
  };

  useEffect(() => {
    let cancelled = false;

    const loadIngredientCategoryIndex = async () => {
      const categoryEntries = await Promise.all(
        categories
          .filter((category) => category !== '전체')
          .map(async (category) => {
            try {
              const response = await getIngredientsByCategory(category);
              const names = response?.result?.ingredientNames ?? [];
              return names.map((name) => [name, category]);
            } catch (error) {
              return [];
            }
          })
      );

      if (!cancelled) {
        setIngredientCategoryIndex(Object.fromEntries(categoryEntries.flat()));
      }
    };

    loadIngredientCategoryIndex();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadExistingIngredients = async () => {
      try {
        const response = await getMyIngredients();
        const names = response?.result?.map((item) => item.ingredient).filter(Boolean) ?? [];
        if (!cancelled) {
          setExistingIngredientNames(new Set(names));
        }
      } catch (error) {
        if (!cancelled) {
          setExistingIngredientNames(new Set());
        }
      }
    };

    loadExistingIngredients();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (Object.keys(ingredientCategoryIndex).length === 0) {
      return;
    }

    setItems((prev) => prev.map((item) => {
      const canonicalCategory = ingredientCategoryIndex[item.name];
      if (!canonicalCategory || item.category === canonicalCategory) {
        return item;
      }
      return { ...item, category: canonicalCategory };
    }));
  }, [ingredientCategoryIndex]);

  useEffect(() => {
    const keyword = (currentItem?.name ?? '').trim();
    if (currentItem?.selected || keyword.length < 1) {
      setIngredientSuggestions([]);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await searchIngredients(keyword);
        const names = response?.result?.ingredientNames ?? [];
        if (!cancelled) {
          setIngredientSuggestions(names);
        }
      } catch (error) {
        if (!cancelled) {
          setIngredientSuggestions([]);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentItem?.name, currentItem?.selected, editingIndex]);

  useEffect(() => {
    const ingredientsToPredict = items
      .map((item, index) => ({
        index,
        name: item.name.trim(),
        purchaseDate: normalizeDate(item.purchaseDate ?? ''),
        shouldPredict: item.selected && item.name.trim() && item.purchaseDate && !item.expirationDate,
      }))
      .filter((item) => item.shouldPredict);

    if (ingredientsToPredict.length === 0) {
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setPredictionLoading(true);
      try {
        const predictionsByIndex = {};
        const groupedByPurchaseDate = ingredientsToPredict.reduce((acc, item) => {
          acc[item.purchaseDate] = [...(acc[item.purchaseDate] ?? []), item];
          return acc;
        }, {});

        await Promise.all(Object.entries(groupedByPurchaseDate).map(async ([groupPurchaseDate, groupItems]) => {
          const response = await predictIngredientExpirations({
            purchaseDate: groupPurchaseDate,
            ingredients: groupItems.map((item) => item.name),
          });
          const predictions = response?.result?.ingredients ?? [];
          const predictedDateByName = Object.fromEntries(
            predictions
              .filter((prediction) => prediction?.ingredientName && prediction?.expirationDate)
              .map((prediction) => [prediction.ingredientName, prediction.expirationDate])
          );

          groupItems.forEach((item) => {
            const predictedDate = predictedDateByName[item.name];
            if (predictedDate) {
              predictionsByIndex[item.index] = predictedDate;
            }
          });
        }));

        if (cancelled || Object.keys(predictionsByIndex).length === 0) {
          return;
        }

        setItems((prev) => prev.map((item, index) => {
          const predictedDate = predictionsByIndex[index];
          return predictedDate && !item.expirationDate ? { ...item, expirationDate: predictedDate } : item;
        }));
      } catch (error) {
        // 예측 실패 시 저장 단계에서 재시도를 안내한다.
      } finally {
        if (!cancelled) {
          setPredictionLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [items, purchaseDate]);

  const normalizeDate = (value) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    if (/^\d{2}\.\d{2}\.\d{2}$/.test(value)) {
      const [year, month, day] = value.split('.');
      return `20${year}-${month}-${day}`;
    }
    return value;
  };

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )));
  };

  const addBlankItem = () => {
    setItems((prev) => [...prev, {
      name: '',
      rawName: '',
      purchaseDate: formatDate(new Date()),
      expirationDate: '',
      category: '',
      selected: false,
    }]);
    setEditingIndex(items.length);
  };

  const removeItem = (index) => {
    setItems((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [{
        name: '',
        rawName: '',
        purchaseDate: formatDate(new Date()),
        expirationDate: '',
        category: '',
        selected: false,
      }];
    });
    setEditingIndex((prev) => Math.max(0, Math.min(prev, items.length - 2)));
  };

  const loadCategoryIngredients = async (category) => {
    setActiveIngredientCategory(category);
    setCategoryIngredientLoading(true);
    try {
      const response = await getIngredientsByCategory(category);
      setCategoryIngredientSuggestions(response?.result?.ingredientNames ?? []);
    } catch (error) {
      setCategoryIngredientSuggestions([]);
    } finally {
      setCategoryIngredientLoading(false);
    }
  };

  const handleAdd = async () => {
    const validItems = items
      .map((item) => ({
        ingredient: item.name.trim(),
        purchaseDate: normalizeDate(item.purchaseDate ?? ''),
        expirationDate: normalizeDate(item.expirationDate ?? ''),
        category: item.category,
      }))
      .filter((item) => item.ingredient || item.expirationDate || item.category);
    const duplicateNames = validItems
      .map((item) => item.ingredient)
      .filter(Boolean)
      .filter((name, index, names) => existingIngredientNames.has(name) || names.indexOf(name) !== index);

    if (duplicateNames.length > 0) {
      showAppDialog('알림', `${[...new Set(duplicateNames)].join(', ')}은 이미 추가된 식재료예요.`);
      return;
    }

    const hasUnselectedIngredient = items.some((item) => item.name.trim() && !item.selected);
    if (hasUnselectedIngredient) {
      showAppDialog('알림', '검색 결과에서 표준 식재료를 선택해주세요!');
      return;
    }

    const hasMissingPurchaseDate = items.some((item) => item.name.trim() && !item.purchaseDate);
    if (hasMissingPurchaseDate) {
      showAppDialog('알림', '구매일자를 선택해주세요!');
      return;
    }

    const hasPendingPrediction = items.some((item) => (
      item.name.trim() && item.selected && item.purchaseDate && !item.expirationDate
    ));
    if (hasPendingPrediction) {
      showAppDialog('알림', '소비기한 예측이 끝난 뒤 다시 저장해주세요!');
      return;
    }

    if (validItems.length === 0 || validItems.some((item) => !item.ingredient || !item.expirationDate || !item.category)) {
      showAppDialog('알림', '모든 항목을 입력해주세요!');
      return;
    }
    try {
      await createIngredients(validItems);
    } catch (error) {
      showAppDialog('알림', '식재료 저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      return;
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>이전</Text>
        </TouchableOpacity>
        <Text style={styles.title}>식재료 추가</Text>
        <TouchableOpacity onPress={handleAdd}>
          <Text style={styles.completeText}>완료</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        {items.length > 1 && (
          <View style={styles.detectedHeader}>
            <Text style={styles.detectedTitle}>인식된 품목 {items.length}개</Text>
            <Text style={styles.detectedHint}>각 품목을 눌러 구매일자와 카테고리를 확인해 주세요.</Text>
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.detectedList}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={`${item.name}-${index}`}
              style={[styles.detectedChip, editingIndex === index && styles.detectedChipActive]}
              onPress={() => setEditingIndex(index)}
            >
              <Text style={[styles.detectedChipText, editingIndex === index && styles.detectedChipTextActive]}>
                {item.name || `품목 ${index + 1}`}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.detectedAddChip} onPress={addBlankItem}>
            <Text style={styles.detectedAddText}>+ 추가</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.inputCard}>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>식재료</Text>
            <View style={styles.nameContainer}>
              <TextInput
                style={styles.nameInput}
                placeholder="표준 식재료를 검색하거나 선택해주세요"
                placeholderTextColor="#adb5bd"
                value={currentItem?.name ?? ''}
                onChangeText={(value) => updateItem(editingIndex, { name: value, selected: false, expirationDate: '' })}
                returnKeyType="search"
              />
              {(currentItem?.name ?? '').length > 0 && (
                <TouchableOpacity onPress={() => updateItem(editingIndex, { name: '', selected: false, expirationDate: '' })}>
                  <Text style={styles.clearButton}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.fieldBlockHalf}>
              <Text style={styles.fieldLabel}>구매일자</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={openDatePicker}
              >
                <Text style={[
                  styles.dateInputText,
                  !currentItem?.purchaseDate && styles.dateInputPlaceholder,
                ]}>
                  {currentItem?.purchaseDate ? normalizeDate(currentItem.purchaseDate) : '날짜 선택'}
                </Text>
                <Text style={styles.selectArrow}>∨</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldBlockHalf}>
              <Text style={styles.fieldLabel}>카테고리</Text>
              <TouchableOpacity
                style={styles.categorySelect}
                onPress={() => setCategoryVisible(true)}
              >
                <Text style={[
                  styles.categorySelectText,
                  currentItem?.category && { color: '#495057' }
                ]}>
                  {currentItem?.category || '선택'}
                </Text>
                <Text style={styles.selectArrow}>∨</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.fieldGuideText}>구매일자를 기준으로 소비기한을 자동 계산해요.</Text>
        </View>
        {currentItem?.rawName && currentItem.rawName !== currentItem.name && (
          <Text style={styles.rawNameText}>영수증 원문: {currentItem.rawName}</Text>
        )}
        {currentItem?.expirationDate ? (
          <Text style={styles.predictionHint}>자동 계산된 소비기한: {normalizeDate(currentItem.expirationDate)} · 구매일자를 바꾸면 다시 계산돼요.</Text>
        ) : currentItem?.selected && currentItem?.purchaseDate ? (
          <Text style={styles.predictionHint}>{predictionLoading ? '소비기한 예측 중이에요.' : '소비기한 예측을 기다리는 중이에요.'}</Text>
        ) : null}
        {(currentItem?.name ?? '').length > 0 && (
          <Text style={[styles.selectionHint, currentItem?.selected && styles.selectionHintSelected]}>
            {currentItem?.selected ? '표준 식재료로 선택됨' : '아래 검색 결과에서 표준 식재료를 선택해야 저장할 수 있어요.'}
          </Text>
        )}
        {ingredientSuggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {ingredientSuggestions.map((name) => (
              <TouchableOpacity
                key={name}
                style={styles.suggestionItem}
                onPress={() => {
                  updateItem(editingIndex, {
                    name,
                    category: ingredientCategoryIndex[name] ?? currentItem?.category ?? '',
                    selected: true,
                    expirationDate: '',
                  });
                  setIngredientSuggestions([]);
                }}
              >
                <Text style={styles.suggestionText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={styles.categoryPickerButton}
          onPress={() => {
            setCategoryPickerVisible(true);
            if (!activeIngredientCategory) {
              loadCategoryIngredients(categories.find((category) => category !== '전체') ?? '');
            }
          }}
        >
          <Text style={styles.categoryPickerButtonText}>표준 식재료 목록에서 고르기</Text>
          <Text style={styles.categoryPickerButtonHint}>검색 결과가 애매하면 카테고리별 목록에서 선택하세요.</Text>
        </TouchableOpacity>

        {items.length > 1 && (
          <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(editingIndex)}>
            <Text style={styles.removeButtonText}>이 품목 제외</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>추가</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={categoryVisible}
        animationType="slide"
        onRequestClose={() => setCategoryVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setCategoryVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>카테고리 선택</Text>
            <ScrollView>
              {categories.filter(c => c !== '전체').map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.modalItem}
                  onPress={() => {
                    updateItem(editingIndex, { category: cat });
                    setCategoryVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    currentItem?.category === cat && styles.modalItemTextSelected,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent
        visible={datePickerVisible}
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setDatePickerVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.datePickerModal} onPress={(event) => event.stopPropagation()}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity style={styles.dateNavButton} onPress={() => moveCalendarMonth(-1)}>
                <Text style={styles.dateNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>
                {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
              </Text>
              <TouchableOpacity style={styles.dateNavButton} onPress={() => moveCalendarMonth(1)}>
                <Text style={styles.dateNavText}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weekRow}>
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <Text key={day} style={styles.weekText}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {getCalendarDays().map((date, index) => {
                const selected = date && normalizeDate(currentItem?.purchaseDate ?? '') === formatDate(date);
                return (
                  <TouchableOpacity
                    key={date ? formatDate(date) : `blank-${index}`}
                    style={[styles.dayCell, selected && styles.dayCellSelected]}
                    disabled={!date}
                    onPress={() => {
                      updateItem(editingIndex, { purchaseDate: formatDate(date), expirationDate: '' });
                      setDatePickerVisible(false);
                    }}
                  >
                    <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                      {date ? date.getDate() : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => {
                const today = new Date();
                updateItem(editingIndex, { purchaseDate: formatDate(today), expirationDate: '' });
                setCalendarMonth(today);
                setDatePickerVisible(false);
              }}
            >
              <Text style={styles.todayButtonText}>오늘 날짜 선택</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent
        visible={categoryPickerVisible}
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setCategoryPickerVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.categoryPickerModal}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>카테고리에서 식재료 선택</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
              {categories.filter(c => c !== '전체').map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryTab,
                    activeIngredientCategory === cat && styles.categoryTabActive,
                  ]}
                  onPress={() => loadCategoryIngredients(cat)}
                >
                  <Text style={[
                    styles.categoryTabText,
                    activeIngredientCategory === cat && styles.categoryTabTextActive,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={styles.categoryIngredientList} contentContainerStyle={styles.categoryIngredientListContent}>
              {categoryIngredientLoading ? (
                <Text style={styles.categoryEmptyText}>식재료를 불러오는 중이에요.</Text>
              ) : categoryIngredientSuggestions.length === 0 ? (
                <Text style={styles.categoryEmptyText}>이 카테고리에 표시할 식재료가 없어요.</Text>
              ) : (
                categoryIngredientSuggestions.map((name) => (
                  <TouchableOpacity
                    key={`${activeIngredientCategory}-${name}`}
                    style={styles.modalItem}
                    onPress={() => {
                      updateItem(editingIndex, {
                        name,
                        category: activeIngredientCategory,
                        selected: true,
                        expirationDate: '',
                      });
                      setIngredientSuggestions([]);
                      setCategoryPickerVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{name}</Text>
                  </TouchableOpacity>
                ))
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
    flex: 1,
    backgroundColor: '#FBF9FF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dee2e6',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
  },
  completeText: {
    fontSize: 16,
    color: '#87CEEB',
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  detectedHeader: {
    gap: 4,
  },
  detectedTitle: {
    fontSize: 16,
    color: '#495057',
    fontWeight: 'bold',
  },
  detectedHint: {
    fontSize: 12,
    color: '#868e96',
  },
  detectedList: {
    flexGrow: 0,
  },
  detectedChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 8,
  },
  detectedChipActive: {
    backgroundColor: '#E8F7FD',
    borderColor: '#87CEEB',
  },
  detectedChipText: {
    color: '#868e96',
    fontSize: 13,
    fontWeight: '600',
  },
  detectedChipTextActive: {
    color: '#228BE6',
  },
  detectedAddChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f1f3f5',
    marginRight: 8,
  },
  detectedAddText: {
    color: '#495057',
    fontSize: 13,
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  fieldBlock: {
    gap: 7,
  },
  fieldBlockHalf: {
    flex: 1,
    gap: 7,
  },
  fieldLabel: {
    color: '#343a40',
    fontSize: 13,
    fontWeight: '700',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#ffffff',
  },
  removeButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  removeButtonText: {
    color: '#fa5252',
    fontSize: 13,
    fontWeight: '600',
  },
  nameInput: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
  },
  rawNameText: {
    color: '#868e96',
    fontSize: 12,
    marginTop: -4,
  },
  predictionHint: {
    color: '#228BE6',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -4,
  },
  selectionHint: {
    color: '#fa5252',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -4,
  },
  selectionHintSelected: {
    color: '#228BE6',
  },
  suggestionBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f3f5',
  },
  suggestionText: {
    color: '#343a40',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryPickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8F1FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  categoryPickerButtonText: {
    color: '#228BE6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryPickerButtonHint: {
    color: '#5C7C89',
    fontSize: 12,
  },
  clearButton: {
    fontSize: 14,
    color: '#adb5bd',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldGuideText: {
    color: '#74838F',
    fontSize: 12,
    lineHeight: 17,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#ffffff',
  },
  dateInputText: {
    fontSize: 14,
    color: '#495057',
  },
  dateInputPlaceholder: {
    color: '#adb5bd',
  },
  selectArrow: {
    color: '#868e96',
    fontSize: 16,
    lineHeight: 18,
  },
  categorySelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#ffffff',
  },
  categorySelectText: {
    fontSize: 14,
    color: '#adb5bd',
  },
  addButton: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    height: 52,
    backgroundColor: '#87CEEB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingBottom: 40,
    maxHeight: 400,
  },
  categoryPickerModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    maxHeight: '86%',
  },
  datePickerModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  datePickerTitle: {
    color: '#343a40',
    fontSize: 17,
    fontWeight: 'bold',
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1FAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavText: {
    color: '#228BE6',
    fontSize: 28,
    lineHeight: 32,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekText: {
    flex: 1,
    textAlign: 'center',
    color: '#868e96',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  dayCellSelected: {
    backgroundColor: '#87CEEB',
  },
  dayText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  todayButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1FAFF',
    borderWidth: 1,
    borderColor: '#BEE9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonText: {
    color: '#228BE6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  categoryTabs: {
    flexGrow: 0,
    marginBottom: 12,
  },
  categoryIngredientList: {
    maxHeight: 420,
  },
  categoryIngredientListContent: {
    paddingBottom: 24,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f1f3f5',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#E8F7FD',
  },
  categoryTabText: {
    color: '#868e96',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#228BE6',
  },
  categoryEmptyText: {
    color: '#868e96',
    fontSize: 14,
    paddingVertical: 18,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dee2e6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#495057',
  },
  modalItemTextSelected: {
    color: '#87CEEB',
    fontWeight: 'bold',
  },
});
