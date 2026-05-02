import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRecipes } from '../api/recipes';
import { getRecipeCategoryVisual, getRecipeVisualForItem } from '../data/categoryVisuals';

const RECIPE_CATEGORIES = [
  { name: '반찬' },
  { name: '후식/디저트' },
  { name: '일품요리' },
  { name: '밥류' },
  { name: '국/탕류' },
  { name: '김치류' },
  { name: '면/만두류' },
  { name: '나물/무침류' },
  { name: '찌개/전골류' },
];
const PAGE_SIZE = 20;
export default function RecipeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const browsing = Boolean(activeCategory || debouncedSearch);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!browsing) {
      setRecipes([]);
      setPage(0);
      setHasNext(false);
      setTotalCount(0);
      return undefined;
    }

    let mounted = true;
    const loadRecipes = async () => {
      setLoading(true);
      try {
        const data = await getRecipes({
          page,
          size: PAGE_SIZE,
          category: activeCategory ?? '전체',
          keyword: debouncedSearch,
        });
        if (!mounted || !data?.success || !Array.isArray(data.result?.recipes)) {
          return;
        }

        setRecipes(data.result.recipes.map(toRecipeItem));
        setPage(data.result.page ?? 0);
        setHasNext(Boolean(data.result.hasNext));
        setTotalCount(data.result.totalCount ?? data.result.recipes.length);
      } catch (error) {
        if (mounted) {
          setRecipes([]);
          setHasNext(false);
          setTotalCount(0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRecipes();
    return () => {
      mounted = false;
    };
  }, [activeCategory, debouncedSearch, page, browsing]);

  const movePage = (nextPage) => {
    if (loading || nextPage < 0) {
      return;
    }
    if (nextPage > page && !hasNext) {
      return;
    }
    setPage(nextPage);
  };

  const toRecipeItem = (recipe) => ({
    id: recipe.recipeId,
    recipeId: recipe.recipeId,
    title: recipe.name,
    category: recipe.category,
    image: recipe.imageUrl || null,
    ingredients: (recipe.ingredients ?? []).join(', '),
  });

  const renderRecipe = ({ item: recipe }) => {
    const visual = getRecipeVisualForItem(recipe);
    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => navigation.navigate('RecipeDetail', { recipe })}
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
          <Text style={styles.recipeIngredients} numberOfLines={1}>{recipe.ingredients || recipe.category}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const clearBrowseMode = () => {
    setActiveCategory(null);
    setSearch('');
    setDebouncedSearch('');
    setPage(0);
  };

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.homeContent}>
      <TouchableOpacity
        style={styles.recommendBanner}
        onPress={() => navigation.navigate('RecipeRecommend')}
      >
        <View>
          <Text style={styles.recommendText}>내 식자재로 레시피 추천받기</Text>
          <Text style={styles.recommendSubText}>보유 재료와 알레르기 설정을 먼저 반영해요</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#495057" />
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>카테고리별로 찾기</Text>
      </View>

      <View style={styles.categoryGrid}>
        {RECIPE_CATEGORIES.map((category) => {
          const visual = getRecipeCategoryVisual(category.name);
          return (
            <TouchableOpacity
              key={category.name}
              style={styles.categoryCard}
              onPress={() => {
                setPage(0);
                setActiveCategory(category.name);
              }}
            >
              <View style={[styles.categoryBadge, { backgroundColor: visual.backgroundColor }]}>
                <Image source={visual.image} style={styles.categoryBadgeImage} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const listTitle = debouncedSearch
    ? `"${debouncedSearch}" 검색 결과`
    : `${activeCategory} 레시피`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>레시피</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="레시피명 또는 재료명으로 검색"
          placeholderTextColor="#adb5bd"
          value={search}
          onChangeText={(value) => {
            setSearch(value);
            setPage(0);
            if (value.trim()) {
              setActiveCategory(null);
            }
          }}
        />
        <Ionicons name="search-outline" size={20} color="#adb5bd" />
      </View>

      {!browsing ? renderHome() : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipe}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={(
            <View style={styles.resultHeader}>
              <TouchableOpacity style={styles.backToHomeButton} onPress={clearBrowseMode}>
                <Text style={styles.backToHomeText}>카테고리로 돌아가기</Text>
              </TouchableOpacity>
              <Text style={styles.resultTitle}>{listTitle}</Text>
              <Text style={styles.resultMeta}>
                총 {totalCount}개 · {page + 1}페이지
              </Text>
            </View>
          )}
          ListEmptyComponent={(
            loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>레시피를 불러오는 중이에요</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>표시할 레시피가 없어요</Text>
              </View>
            )
          )}
          ListFooterComponent={recipes.length > 0 ? (
            <View style={styles.paginationBar}>
              <TouchableOpacity
                style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
                disabled={page === 0 || loading}
                onPress={() => movePage(page - 1)}
              >
                <Text style={[styles.pageButtonText, page === 0 && styles.pageButtonTextDisabled]}>
                  이전
                </Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>
                {page + 1} / {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
              </Text>
              <TouchableOpacity
                style={[styles.pageButton, !hasNext && styles.pageButtonDisabled]}
                disabled={!hasNext || loading}
                onPress={() => movePage(page + 1)}
              >
                <Text style={[styles.pageButtonText, !hasNext && styles.pageButtonTextDisabled]}>
                  다음
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF9FF' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 25, fontWeight: 'bold', color: '#495057' },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#495057' },
  homeContent: { paddingHorizontal: 20, paddingBottom: 40 },
  recommendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F7FD',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 24,
  },
  recommendText: { fontSize: 16, fontWeight: '800', color: '#343A40' },
  recommendSubText: { fontSize: 12, color: '#5C7C89', marginTop: 4 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: '#343A40' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 14,
  },
  categoryBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryBadgeImage: { width: 46, height: 46, borderRadius: 14 },
  categoryName: { fontSize: 15, color: '#343A40', fontWeight: '800' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  resultHeader: { marginBottom: 14 },
  backToHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backToHomeText: { color: '#228BE6', fontSize: 13, fontWeight: '800' },
  resultTitle: { color: '#343A40', fontSize: 18, fontWeight: '900' },
  resultMeta: { color: '#868E96', fontSize: 12, marginTop: 4 },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
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
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  recipeImage: { width: 72, height: 72 },
  recipeFallbackImage: { width: 66, height: 66, borderRadius: 10 },
  recipeInfo: { flex: 1 },
  recipeTitle: { fontSize: 16, fontWeight: 'bold', color: '#495057', marginBottom: 6 },
  recipeIngredients: { fontSize: 13, color: '#ADB5BD' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#ADB5BD' },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  pageButton: {
    minWidth: 76,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F7FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButtonDisabled: {
    backgroundColor: '#F1F3F5',
  },
  pageButtonText: {
    color: '#228BE6',
    fontSize: 14,
    fontWeight: '800',
  },
  pageButtonTextDisabled: {
    color: '#ADB5BD',
  },
  pageInfo: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '800',
  },
});
