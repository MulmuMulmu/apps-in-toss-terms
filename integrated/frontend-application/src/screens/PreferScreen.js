import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NormalizedIngredientPicker from '../components/NormalizedIngredientPicker';

const QUICK_PREFER_ITEMS = ['소고기', '돼지고기', '닭고기', '새우', '김치', '두부', '양파', '대파'];

export default function PreferScreen({ navigation, route }) {
  const allergies = route?.params?.allergies ?? [];
  const [selectedItems, setSelectedItems] = useState(route?.params?.preferIngredients ?? []);

  const goNext = () => {
    navigation.navigate('Dislike', {
      allergies,
      preferIngredients: selectedItems,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>이전</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.stepText}>맞춤 추천 설정 2/3</Text>
        <Text style={styles.question}>선호하는 식재료를 선택해주세요</Text>
        <Text style={styles.description}>
          좋아하는 식재료를 추천 점수에 반영해요. 선택하지 않아도 앱을 사용할 수 있어요.
        </Text>

        <NormalizedIngredientPicker
          selectedItems={selectedItems}
          onChange={setSelectedItems}
          quickItems={QUICK_PREFER_ITEMS}
          placeholder="선호 식재료 검색"
          helperText="추천 품질을 위해 레시피와 같은 표준 식재료명으로 저장해요."
        />
      </ScrollView>

      <TouchableOpacity
        style={selectedItems.length > 0 ? styles.nextButton : styles.skipButton}
        onPress={goNext}
      >
        <Text style={selectedItems.length > 0 ? styles.nextButtonText : styles.skipButtonText}>
          {selectedItems.length > 0 ? '다음' : '건너뛰기'}
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
