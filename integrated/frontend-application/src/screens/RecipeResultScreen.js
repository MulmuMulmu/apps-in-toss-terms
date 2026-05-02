import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { recommendRecipes } from '../api/recipes';
import { colors, radius } from '../styles/tossTokens';
import { getRecipeVisualForItem } from '../data/categoryVisuals';

const TABS = ['전체', '내 재료로만', '재료 추가 필요'];

const DEFAULT_SELECTED_INGREDIENTS = ['시금치', '돼지고기'];

export default function RecipeResultScreen({ navigation, route }) {
  const selectedIngredients = [...new Set(route?.params?.selectedIngredients || DEFAULT_SELECTED_INGREDIENTS)];
  const selectedIngredientKey = selectedIngredients.join('|');
  const [activeTab, setActiveTab] = useState('전체');
  const [activeIngredients, setActiveIngredients] = useState(selectedIngredients);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setActiveIngredients(selectedIngredients);
  }, [selectedIngredientKey]);

  useEffect(() => {
    let mounted = true;

    const loadRecommendations = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const data = await recommendRecipes({
          ingredients: selectedIngredients,
        });

        if (!mounted || !data?.success || !Array.isArray(data.result?.recommendations)) {
          if (mounted) {
            setResults([]);
            setErrorMessage('추천 결과를 불러오지 못했어요.');
          }
          return;
        }

        setResults(data.result.recommendations.map((recipe, index) => {
          return {
            id: recipe.recipeId ?? index,
            recipeId: recipe.recipeId,
            title: recipe.title,
            category: recipe.category,
            image: null,
            ingredientPreview: [
              ...(recipe.match_details?.matched ?? []),
              ...(recipe.match_details?.missing ?? []),
            ].join(', '),
            matchedIngredients: recipe.match_details?.matched ?? [],
            missingIngredients: recipe.match_details?.missing ?? [],
            score: recipe.score,
            hasAll: (recipe.match_details?.missing ?? []).length === 0,
          };
        }));
      } catch (error) {
        if (mounted) {
          setResults([]);
          setErrorMessage('추천 결과를 불러오지 못했어요.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRecommendations();
    return () => {
      mounted = false;
    };
  }, [selectedIngredientKey]);

  const toggleIngredient = (name) => {
    setActiveIngredients((current) => {
      if (current.includes(name)) {
        return current.filter((item) => item !== name);
      }
      return [...current, name];
    });
  };

  const filtered = useMemo(() => {
    const activeSet = new Set(activeIngredients);
    const byIngredient = activeIngredients.length === 0
      ? results
      : results.filter((recipe) => recipe.matchedIngredients.some((name) => activeSet.has(name)));

    if (activeTab === '내 재료로만') {
      return byIngredient.filter((recipe) => recipe.hasAll);
    }
    if (activeTab === '재료 추가 필요') {
      return byIngredient.filter((recipe) => !recipe.hasAll);
    }
    return byIngredient;
  }, [activeIngredients, activeTab, results]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>이전</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>레시피 추천</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 선택 재료 칩 */}
      <View style={styles.chipContainer}>
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>AI 추천 결과 안내</Text>
          <Text style={styles.noticeText}>
            추천 결과는 보유 재료와 후보 레시피의 재료 겹침을 계산한 결과예요. 알레르기, 비선호 재료, 실제 보유량은 조리 전에 확인해 주세요.
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {selectedIngredients.map((name, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.chip, !activeIngredients.includes(name) && styles.chipInactive]}
              onPress={() => toggleIngredient(name)}
            >
              <Text style={[styles.chipText, !activeIngredients.includes(name) && styles.chipTextInactive]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 탭 */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* 레시피 목록 */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>추천 레시피를 불러오는 중이에요.</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{errorMessage}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>해당하는 레시피가 없어요</Text>
          </View>
        ) : (
          filtered.map(recipe => (
            (() => {
              const visual = getRecipeVisualForItem(recipe);
              return (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => navigation.navigate('RecipeDetail', { recipe, myIngredients: activeIngredients })}
                >
                  <View style={[styles.recipeImageBox, !recipe.image && { backgroundColor: visual.backgroundColor }]}>
                    {recipe.image ? (
                      <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                    ) : (
                      <Image source={visual.image} style={styles.recipeFallbackImage} />
                    )}
                  </View>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    <View style={styles.ingredientPreviewRow}>
                      {recipe.matchedIngredients.slice(0, 4).map((name) => (
                        <Text key={`matched-${name}`} style={styles.matchedIngredientText}>{name}</Text>
                      ))}
                      {recipe.missingIngredients.slice(0, 4).map((name) => (
                        <Text key={`missing-${name}`} style={styles.missingIngredientText}>{name}</Text>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })()
          ))
        )}
      </ScrollView>
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
  chipContainer: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  chipRow: { paddingHorizontal: 20, gap: 8 },
  noticeBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  noticeText: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 18,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#E8F3FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8F3FF',
  },
  chipText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  chipInactive: { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
  chipTextInactive: { color: colors.placeholder },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  tabItem: { marginRight: 20, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: 14, color: colors.placeholder },
  tabTextActive: { color: colors.text, fontWeight: 'bold' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 2,
    backgroundColor: colors.text,
    borderRadius: 1,
  },
  listContent: { padding: 20, gap: 12, paddingBottom: 40 },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImageBox: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  recipeImage: { width: 72, height: 72 },
  recipeFallbackImage: { width: 66, height: 66, borderRadius: 10 },
  recipeInfo: { flex: 1 },
  recipeTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 6 },
  ingredientPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  matchedIngredientText: { fontSize: 13, color: colors.placeholder },
  missingIngredientText: { fontSize: 13, color: colors.danger },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: colors.placeholder },
});
