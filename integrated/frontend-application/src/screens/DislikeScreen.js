import React, { useState } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NormalizedIngredientPicker from '../components/NormalizedIngredientPicker';
import { saveFirstLoginIngredients, updatePreferenceIngredients } from '../api/ingredients';

const QUICK_DISLIKE_ITEMS = ['오이', '고수', '가지', '당근', '양파', '대파', '마늘', '생강'];

export default function DislikeScreen({ navigation, route }) {
  const allergies = route?.params?.allergies ?? [];
  const preferIngredients = route?.params?.preferIngredients ?? [];
  const [selectedItems, setSelectedItems] = useState(route?.params?.dispreferIngredients ?? []);
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      const response = await saveFirstLoginIngredients({
        allergies,
        preferIngredients,
        dispreferIngredients: selectedItems,
      });

      if (!response?.success) {
        await updatePreferenceIngredients({
          type: 'DISPREFER',
          newPrefer: selectedItems,
        });
      }
    } catch (error) {
      try {
        await updatePreferenceIngredients({
          type: 'DISPREFER',
          newPrefer: selectedItems,
        });
      } catch (innerError) {
        showAppDialog('알림', '맞춤 설정 저장에 실패했어요. 잠시 후 다시 시도해주세요.');
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>이전</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.stepText}>맞춤 추천 설정 3/3</Text>
        <Text style={styles.question}>비선호 식재료를 선택해주세요</Text>
        <Text style={styles.description}>
          싫어하는 식재료는 추천 점수를 낮추는 데 사용해요. 앱 안에서 언제든 다시 수정할 수 있어요.
        </Text>

        <NormalizedIngredientPicker
          selectedItems={selectedItems}
          onChange={setSelectedItems}
          quickItems={QUICK_DISLIKE_ITEMS}
          placeholder="비선호 식재료 검색"
          helperText="사용자 입력값도 레시피 추천과 같은 표준 식재료명으로 맞춰 저장해요."
        />
      </ScrollView>

      <TouchableOpacity
        style={selectedItems.length > 0 ? styles.nextButton : styles.skipButton}
        onPress={finish}
        disabled={saving}
      >
        <Text style={selectedItems.length > 0 ? styles.nextButtonText : styles.skipButtonText}>
          {saving ? '저장 중' : selectedItems.length > 0 ? '완료' : '건너뛰기'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9FF',
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#495057',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 116,
  },
  stepText: {
    color: '#228BE6',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  question: {
    fontSize: 20,
    fontWeight: '900',
    color: '#343A40',
    marginBottom: 10,
  },
  description: {
    color: '#868E96',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },
  nextButton: {
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
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    height: 52,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  skipButtonText: {
    color: '#495057',
    fontSize: 18,
    fontWeight: '700',
  },
});
