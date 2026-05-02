import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { analyzeReceipt } from '../api/ingredients';
import { colors, radius } from '../styles/tossTokens';

export default function ReceiptLoadingScreen({ navigation, route }) {
  useEffect(() => {
    let mounted = true;

    const runAnalysis = async () => {
      try {
        const photoUri = route?.params?.photoUri;
        if (!photoUri) {
          navigation.replace('Fridge');
          return;
        }

        const data = await analyzeReceipt(photoUri);
        const items = data?.result?.food_items ?? [];
        if (mounted && items.length > 0) {
          navigation.replace('DirectInput', {
            items,
            purchaseDate: data?.result?.purchased_at,
          });
          return;
        }
      } catch (error) {
        // 실패 시에도 사용자가 수동 입력으로 이어갈 수 있게 한다.
      }

      if (mounted) {
        navigation.replace('DirectInput');
      }
    };

    runAnalysis();
    return () => {
      mounted = false;
    };
  }, [navigation, route?.params?.photoUri]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>영수증 분석중...</Text>
      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>AI 분석 결과 안내</Text>
        <Text style={styles.noticeText}>
          영수증 OCR 결과는 자동 분석이라 품목명, 수량, 카테고리가 실제와 다를 수 있어요. 저장하기 전에 사용자가 한 번 확인하고 수정하는 흐름으로 구성했어요.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    color: colors.text,
    fontWeight: 'bold',
  },
  noticeBox: {
    marginTop: 24,
    padding: 16,
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
    fontSize: 13,
    lineHeight: 20,
  },
});
