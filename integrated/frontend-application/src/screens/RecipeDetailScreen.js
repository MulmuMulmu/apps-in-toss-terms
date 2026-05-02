import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { getRecipeDetail } from '../api/recipes';
import { getRecipeVisualForItem } from '../data/categoryVisuals';

const dummyRecipe = {
  id: 1,
  title: '시금치무침',
  image: null,
  emoji: '🥬',
  ingredients: [
    { name: '마늘', amount: '3알' },
    { name: '참기름', amount: '1스푼' },
    { name: '깨소금', amount: '1스푼' },
    { name: '시금치', amount: '300g' },
  ],
  steps: [
    '시금치는 뿌리를 잘라 낸 후 한일한일 떼어서 찬물에 흔들어 가면서 씻어 흙과 불순물을 제거해 준다.',
    '냄비에 물을 넉넉히 붓고 소금 1스푼을 넣은 뒤 끓으면 시금치를 넣고 30초간 데친다.',
    '데친 시금치를 찬물에 헹궈 물기를 꼭 짜준다.',
    '볼에 시금치를 넣고 마늘, 참기름, 깨소금을 넣어 조물조물 무쳐준다.',
  ],
};

export default function RecipeDetailScreen({ navigation, route }) {
  const initialRecipe = route?.params?.recipe || dummyRecipe;
  const myIngredients = route?.params?.myIngredients || [];
  const [recipe, setRecipe] = useState(initialRecipe);

  useEffect(() => {
    const recipeId = initialRecipe?.recipeId || initialRecipe?.id;
    if (!recipeId || typeof recipeId !== 'string') {
      return undefined;
    }

    let mounted = true;
    const loadRecipeDetail = async () => {
      try {
        const data = await getRecipeDetail(recipeId);
        if (!mounted || !data?.success || !data.result) {
          return;
        }

        setRecipe({
          id: data.result.recipeId,
          recipeId: data.result.recipeId,
          title: data.result.name,
          category: data.result.category,
          image: data.result.imageUrl,
          ingredients: (data.result.ingredients ?? []).map((ingredient) => ({
            name: ingredient.ingredientName,
            amount: [
              ingredient.amount == null ? '' : String(ingredient.amount).replace(/\.0$/, ''),
              ingredient.unit ?? '',
            ].join('').trim(),
          })),
          steps: (data.result.steps ?? [])
            .sort((left, right) => (left.stepOrder ?? 0) - (right.stepOrder ?? 0))
            .map((step) => step.description),
        });
      } catch (error) {
        // 상세 API 연결 실패 시 진입 시 전달받은 최소 정보만 유지한다.
      }
    };

    loadRecipeDetail();
    return () => {
      mounted = false;
    };
  }, [initialRecipe?.id, initialRecipe?.recipeId]);

  const recipeIngredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients.map((ingredient) => (
        typeof ingredient === 'string'
          ? { name: ingredient, amount: '' }
          : { name: ingredient?.name ?? '', amount: ingredient?.amount ?? '' }
      ))
    : dummyRecipe.ingredients;
  const detail = {
    ...dummyRecipe,
    ...recipe,
    ingredients: recipeIngredients,
    steps: Array.isArray(recipe?.steps) ? recipe.steps : dummyRecipe.steps,
  };
  const visual = getRecipeVisualForItem(detail);
  const ownedIngredientSet = new Set(myIngredients.map((name) => String(name).trim()));
  const fallbackMissingSet = new Set((initialRecipe?.missingIngredients ?? []).map((name) => String(name).trim()));
  const isMissingIngredient = (name) => {
    const normalizedName = String(name ?? '').trim();
    if (!normalizedName) return false;
    if (fallbackMissingSet.has(normalizedName)) return true;
    return ownedIngredientSet.size > 0 && !ownedIngredientSet.has(normalizedName);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>이전</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>레시피</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* 음식 사진 */}
        <View style={styles.imageContainer}>
          {detail.image ? (
            <Image source={{ uri: detail.image }} style={styles.image} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: visual.backgroundColor }]}>
              <Image source={visual.image} style={styles.imageCategoryIcon} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* 음식 이름 */}
          <Text style={styles.recipeTitle}>{detail.title}</Text>

          {/* 재료 */}
          <Text style={styles.sectionTitle}>재료</Text>
          <View style={styles.ingredientList}>
            {detail.ingredients?.map((item, index) => (
              <View key={index} style={styles.ingredientRow}>
                <Text style={[styles.ingredientName, isMissingIngredient(item.name) && styles.missingIngredient]}>
                  {item.name}
                </Text>
                <Text style={[styles.ingredientAmount, isMissingIngredient(item.name) && styles.missingIngredient]}>
                  {item.amount}
                </Text>
              </View>
            ))}
          </View>

          {/* 요리순서 */}
          <Text style={styles.sectionTitle}>요리순서</Text>
          <View style={styles.stepList}>
            {detail.steps?.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <Text style={styles.stepNumber}>{index + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  imageContainer: { width: '100%', height: 260 },
  image: { width: '100%', height: 260 },
  imagePlaceholder: {
    width: '100%',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCategoryIcon: { width: 180, height: 180, borderRadius: 40 },
  content: { padding: 20, paddingBottom: 40 },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 12,
  },
  ingredientList: {
    marginBottom: 28,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f3f5',
  },
  ingredientName: { fontSize: 15, color: '#495057' },
  ingredientAmount: { fontSize: 15, color: '#495057' },
  missingIngredient: { color: '#F04452', fontWeight: '700' },
  stepList: { gap: 16 },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#495057',
    lineHeight: 24,
  },
});
