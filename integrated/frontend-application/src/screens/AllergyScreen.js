import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NormalizedIngredientPicker from '../components/NormalizedIngredientPicker';

const REPRESENTATIVE_ALLERGIES = [
  '계란',
  '메밀',
  '땅콩',
  '대두',
  '밀',
  '고등어',
  '게',
  '새우',
  '돼지고기',
  '우유',
  '복숭아',
  '토마토',
];

export default function AllergyScreen({ navigation, route }) {
  const [selected, setSelected] = useState(route?.params?.allergies ?? []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>이전</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.stepText}>맞춤 추천 설정 1/3</Text>
        <Text style={styles.question}>알레르기가 있는 식재료를 선택해주세요</Text>
        <Text style={styles.description}>
          선택한 식재료는 레시피 추천에서 제외할 수 있도록 표준 식재료명으로 저장해요.
        </Text>

        <NormalizedIngredientPicker
          selectedItems={selected}
          onChange={setSelected}
          quickItems={REPRESENTATIVE_ALLERGIES}
          allowNone
          placeholder="알레르기 식재료 검색"
          helperText="직접 문자를 저장하지 않고, 정규화된 식재료 목록에서만 선택해요."
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => navigation.navigate('Prefer', { allergies: selected })}
      >
        <Text style={styles.nextButtonText}>다음</Text>
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
});
