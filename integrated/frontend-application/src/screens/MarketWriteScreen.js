import React, { useEffect, useMemo, useState } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getMyIngredients } from '../api/ingredients';
import { createSharePost, updateSharePost } from '../api/shares';
import { getIngredientVisualForItem, inferIngredientCategory } from '../data/categoryVisuals';
import {
  getSharePolicyViolation,
  shareAllowedCategories,
  shareSafetyChecklist,
} from '../policies/sharePolicy';

const categories = shareAllowedCategories;

const unwrap = (response, fallback = []) => {
  if (response?.success === false) {
    throw new Error(response.result || '식재료를 불러오지 못했어요.');
  }
  return response?.result ?? response?.data ?? fallback;
};

const normalizeFood = (item, index) => ({
  id: item.id || item.userIngredientId || `${item.ingredient}-${item.expirationDate}-${index}`,
  name: item.ingredient || item.ingredientName || item.name,
  expirationDate: item.expirationDate || '',
  category: item.category || inferIngredientCategory(item.ingredient || item.ingredientName || item.name, ''),
});

export default function MarketWriteScreen({ navigation, route }) {
  const initialItem = route?.params?.item || null;
  const editPost = route?.params?.post || null;
  const isEditMode = Boolean(editPost?.postId);
  const [photo, setPhoto] = useState(editPost?.image || null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [title, setTitle] = useState(editPost?.title || '');
  const [selectedFood, setSelectedFood] = useState(
    editPost?.ingredientName || editPost?.food || initialItem?.name || initialItem || ''
  );
  const [foodDropdownVisible, setFoodDropdownVisible] = useState(false);
  const [safetyNoticeVisible, setSafetyNoticeVisible] = useState(true);
  const [finalConfirmVisible, setFinalConfirmVisible] = useState(false);
  const [description, setDescription] = useState(editPost?.content || editPost?.description || '');
  const [selectedCategory, setSelectedCategory] = useState(editPost?.category || '');
  const [expiryDate, setExpiryDate] = useState(editPost?.expirationDate || initialItem?.expirationDate || '');
  const [myFoods, setMyFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedFoodObject = useMemo(
    () => myFoods.find((food) => food.name === selectedFood),
    [myFoods, selectedFood]
  );
  const selectedIngredientCategory = inferIngredientCategory(
    selectedFood,
    selectedFoodObject?.category || ''
  );
  const fallbackVisual = getIngredientVisualForItem({
    name: selectedFood,
    category: selectedIngredientCategory,
  });
  const policyViolation = getSharePolicyViolation({
    ingredientName: selectedFood,
    ingredientCategory: selectedIngredientCategory,
    category: selectedCategory,
    title,
    content: description,
    expirationDate: expiryDate,
  });

  useEffect(() => {
    let cancelled = false;

    const loadFoods = async () => {
      setLoadingFoods(true);
      try {
        const response = await getMyIngredients();
        const foods = unwrap(response, []).map(normalizeFood).filter((food) => food.name);
        if (!cancelled) {
          setMyFoods(foods);
          if (initialItem && !selectedFood) {
            setSelectedFood(typeof initialItem === 'string' ? initialItem : initialItem.name);
          }
        }
      } catch (caughtError) {
        if (!cancelled) {
          setMyFoods([]);
          showAppDialog('식재료 조회 실패', caughtError instanceof Error ? caughtError.message : '내 식재료를 불러오지 못했어요.');
        }
      } finally {
        if (!cancelled) setLoadingFoods(false);
      }
    };

    void loadFoods();
    return () => {
      cancelled = true;
    };
  }, [initialItem]);

  useEffect(() => {
    if (selectedFoodObject?.expirationDate && !expiryDate) {
      setExpiryDate(selectedFoodObject.expirationDate);
    }
  }, [expiryDate, selectedFoodObject?.expirationDate]);

  useEffect(() => {
    if (!selectedCategory && shareAllowedCategories.includes(selectedIngredientCategory)) {
      setSelectedCategory(selectedIngredientCategory);
    }
  }, [selectedCategory, selectedIngredientCategory]);

  const openCamera = async () => {
    setPhotoModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAppDialog('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    setPhotoModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAppDialog('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !selectedFood || !description || !selectedCategory || !expiryDate) {
      showAppDialog('알림', '모든 항목을 입력해주세요.');
      return;
    }

    if (policyViolation) {
      showAppDialog('나눔 제한 품목', policyViolation);
      return;
    }

    setFinalConfirmVisible(true);
  };

  const submitSharePost = async () => {
    setFinalConfirmVisible(false);
    setSubmitting(true);
    try {
      const payload = {
        title,
        ingredientName: selectedFood,
        content: description,
        category: selectedCategory,
        expirationDate: expiryDate,
        imageUri: isEditMode && photo === editPost?.image ? null : photo,
      };
      if (isEditMode) {
        await updateSharePost({ ...payload, postId: editPost.postId });
      } else {
        await createSharePost(payload);
      }
      showAppDialog(isEditMode ? '수정 완료' : '등록 완료', isEditMode ? '나눔글이 수정되었습니다.' : '나눔글이 등록되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (caughtError) {
      showAppDialog('등록 실패', caughtError instanceof Error ? caughtError.message : '나눔글을 등록하지 못했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>이전</Text>
        </TouchableOpacity>
      <Text style={styles.headerTitle}>{isEditMode ? '나눔글 수정' : '나눔하기'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.photoBox} onPress={() => setPhotoModalVisible(true)}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photoImage} />
          ) : selectedFood ? (
            <View style={[styles.photoFallbackBox, { backgroundColor: fallbackVisual.backgroundColor }]}>
              <Image source={fallbackVisual.image} style={styles.photoFallbackImage} />
            </View>
          ) : (
            <Ionicons name="camera-outline" size={32} color="#adb5bd" />
          )}
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.policyBox}>
            <Text style={styles.policyTitle}>나눔 가능 품목 안내</Text>
            <Text style={styles.policyText}>
              무료 나눔이어도 식품 안전 기준을 지켜야 해요. 현재는 채소/과일, 쌀/면/빵, 미개봉 가공식품, 미개봉 조미료 중심으로 등록해주세요.
            </Text>
            {policyViolation ? <Text style={styles.policyWarning}>{policyViolation}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            placeholder="제목을 입력해주세요."
            placeholderTextColor="#adb5bd"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>식재료</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setFoodDropdownVisible(true)}
          >
            <Text style={[styles.dropdownText, selectedFood && { color: '#495057' }]}>
              {selectedFood || '내 식재료에서 선택해주세요.'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {selectedFood !== '' && (
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{selectedFood}</Text>
                <TouchableOpacity onPress={() => setSelectedFood('')}>
                  <Text style={styles.tagClose}> X</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{selectedIngredientCategory}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>자세한 설명</Text>
          <TextInput
            style={styles.textarea}
            placeholder={'게시물 내용을 작성해주세요.\n나눔 금지 물품은 게시가 제한될 수 있어요.'}
            placeholderTextColor="#adb5bd"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            returnKeyType="default"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>분류</Text>
          <View style={styles.chipRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipSelected]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.label}>소비기한</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#adb5bd"
            value={expiryDate}
            onChangeText={setExpiryDate}
            keyboardType="numeric"
            returnKeyType="done"
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? (isEditMode ? '수정 중' : '등록 중') : (isEditMode ? '수정 완료' : '작성 완료')}
        </Text>
      </TouchableOpacity>

      {photoModalVisible && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setPhotoModalVisible(false)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>사진 등록</Text>
            <View style={styles.photoOptionRow}>
              <TouchableOpacity style={styles.photoOption} onPress={openCamera}>
                <Ionicons name="camera-outline" size={30} color="#495057" />
                <Text style={styles.photoOptionLabel}>camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoOption} onPress={openGallery}>
                <Ionicons name="image-outline" size={30} color="#495057" />
                <Text style={styles.photoOptionLabel}>gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {safetyNoticeVisible && (
        <View style={styles.overlay}>
          <View style={styles.agreementModal}>
            <Text style={styles.agreementTitle}>나눔 가능한 식재료인지 확인해주세요</Text>
            <Text style={styles.agreementDescription}>
              무료 나눔이어도 식품 안전 기준을 지켜야 합니다. 아래 항목에 동의해야 나눔글을 작성할 수 있어요.
            </Text>
            {shareSafetyChecklist.map((item) => (
              <View key={item} style={styles.checklistRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checklistText}>{item}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.primaryModalButton}
              onPress={() => setSafetyNoticeVisible(false)}
            >
              <Text style={styles.primaryModalButtonText}>동의하고 작성하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryModalButton} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryModalButtonText}>작성하지 않기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {finalConfirmVisible && (
        <View style={styles.overlay}>
          <View style={styles.agreementModal}>
            <Text style={styles.agreementTitle}>이 내용으로 나눔글을 등록할까요?</Text>
            <Text style={styles.agreementDescription}>
              등록 후에도 신고 또는 검수 결과에 따라 글이 숨김 처리될 수 있습니다. 품목명, 소비기한, 보관상태, 사진이 실제와 일치하는지 다시 확인해주세요.
            </Text>
            {[
              '품목 정보가 실제와 일치합니다.',
              '나눔 금지 품목이 아님을 확인했습니다.',
              '수령자는 섭취 전 상태를 직접 확인해야 함을 안내받았습니다.',
            ].map((item) => (
              <View key={item} style={styles.checklistRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checklistText}>{item}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.primaryModalButton} onPress={submitSharePost}>
              <Text style={styles.primaryModalButtonText}>최종 동의 후 등록</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryModalButton} onPress={() => setFinalConfirmVisible(false)}>
              <Text style={styles.secondaryModalButtonText}>다시 확인하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {foodDropdownVisible && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setFoodDropdownVisible(false)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>내 식재료</Text>
            {loadingFoods ? (
              <View style={styles.loadingFoods}>
                <ActivityIndicator color="#3182F6" />
                <Text style={styles.loadingFoodsText}>내 식재료를 불러오고 있어요.</Text>
              </View>
            ) : myFoods.length === 0 ? (
              <Text style={styles.emptyFoodText}>나눔할 수 있는 식재료가 없어요.</Text>
            ) : (
              <ScrollView>
                {myFoods.map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedFood(food.name);
                      setExpiryDate(food.expirationDate || '');
                      setFoodDropdownVisible(false);
                    }}
                  >
                    <View>
                      <Text style={[
                        styles.modalItemText,
                        selectedFood === food.name && styles.modalItemSelected,
                      ]}>
                        {food.name}
                      </Text>
                      {food.expirationDate ? (
                        <Text style={styles.modalItemSubText}>{food.expirationDate}까지</Text>
                      ) : null}
                    </View>
                    {selectedFood === food.name && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
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
  },
  backButton: { fontSize: 24, fontWeight: 'bold', color: '#495057' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#495057' },
  body: { flex: 1, paddingHorizontal: 20 },
  photoBox: {
    marginTop: 20,
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#f1f3f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  photoImage: { width: 80, height: 80, borderRadius: 10 },
  photoFallbackBox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoFallbackImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  section: { marginBottom: 24 },
  policyBox: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B8E5FF',
    backgroundColor: '#F1FAFF',
    padding: 16,
  },
  policyTitle: { fontSize: 15, fontWeight: '800', color: '#1C64F2', marginBottom: 6 },
  policyText: { fontSize: 13, lineHeight: 20, color: '#4E5968' },
  policyWarning: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFF0F0',
    color: '#E03131',
    fontSize: 13,
    fontWeight: '700',
  },
  label: { fontSize: 15, fontWeight: 'bold', color: '#495057', marginBottom: 10 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    fontSize: 14,
    color: '#495057',
  },
  dropdownButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { fontSize: 14, color: '#adb5bd' },
  dropdownArrow: { fontSize: 12, color: '#495057' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { fontSize: 13, color: '#495057' },
  tagClose: { fontSize: 12, color: '#adb5bd' },
  categoryTag: {
    backgroundColor: '#F1FAFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryTagText: {
    fontSize: 13,
    color: '#228BE6',
    fontWeight: '700',
  },
  textarea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#ffffff',
  },
  chipSelected: { backgroundColor: '#495057', borderColor: '#495057' },
  chipText: { fontSize: 13, color: '#495057' },
  chipTextSelected: { color: '#ffffff' },
  submitButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 52,
    backgroundColor: '#87CEEB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { opacity: 0.65 },
  submitButtonText: { color: '#ffffff', fontSize: 17, fontWeight: 'bold' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: 430,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#495057', marginBottom: 8 },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dee2e6',
  },
  modalItemText: { fontSize: 16, color: '#495057' },
  modalItemSubText: { marginTop: 3, fontSize: 12, color: '#8B95A1' },
  modalItemSelected: { color: '#87CEEB', fontWeight: 'bold' },
  checkMark: { fontSize: 16, color: '#87CEEB' },
  photoOptionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  photoOption: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f1f3f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  photoOptionLabel: { fontSize: 12, color: '#495057' },
  loadingFoods: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  loadingFoodsText: { color: '#8B95A1', fontSize: 14 },
  emptyFoodText: { color: '#8B95A1', fontSize: 14, paddingVertical: 28, textAlign: 'center' },
  agreementModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  agreementTitle: { fontSize: 18, fontWeight: '900', color: '#191F28', marginBottom: 8 },
  agreementDescription: { fontSize: 14, lineHeight: 21, color: '#4E5968', marginBottom: 16 },
  checklistRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  checkIcon: { fontSize: 14, color: '#3182F6', fontWeight: '900', marginTop: 1 },
  checklistText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#333D4B' },
  primaryModalButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#3182F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryModalButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  secondaryModalButton: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryModalButtonText: { color: '#6B7684', fontSize: 15, fontWeight: '700' },
});
