import React, { useState } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import {
  ActivityIndicator,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { searchShareLocations, updateShareLocation } from '../api/shares';
import administrativeRegions from '../data/administrativeRegions.json';

const activeSiList = administrativeRegions.si;
const activeGuList = administrativeRegions.gu;
const activeDongList = administrativeRegions.dong;

const getCurrentPosition = () => new Promise((resolve, reject) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    reject(new Error('현재 실행 환경에서 위치 권한을 사용할 수 없어요.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => resolve({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }),
    () => reject(new Error('위치 권한을 허용한 뒤 다시 시도해 주세요.')),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
});

export default function LocationSettingScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [selectedSiCode, setSelectedSiCode] = useState(activeSiList[0]?.code || null);
  const [selectedGuCode, setSelectedGuCode] = useState(null);
  const [selectedDongCode, setSelectedDongCode] = useState(null);
  const [savedLocation, setSavedLocation] = useState(null);

  const guOptions = activeGuList.filter((item) => item.siCode === selectedSiCode);
  const dongOptions = selectedGuCode
    ? activeDongList.filter((item) => item.guCode === selectedGuCode)
    : [];
  const selectedDong = activeDongList.find((item) => item.code === selectedDongCode);

  const handleSelectSi = (siCode) => {
    setSelectedSiCode(siCode);
    setSelectedGuCode(null);
    setSelectedDongCode(null);
  };

  const handleSelectGu = (guCode) => {
    setSelectedGuCode(guCode);
    setSelectedDongCode(null);
  };

  const saveCoordinate = async (coordinate) => {
    const result = await updateShareLocation(coordinate);
    setSavedLocation(result);
    showAppDialog('위치 설정 완료', `${result?.display_address || '선택한 위치'} 기준으로 근처 나눔을 보여드려요.`);
    navigation.goBack();
  };

  const handleUseCurrentLocation = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const coordinate = await getCurrentPosition();
      await saveCoordinate(coordinate);
    } catch (error) {
      showAppDialog('위치 설정 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSelectedLocation = async () => {
    if (!selectedDong) {
      showAppDialog('지역 선택 필요', '시/도, 시/군/구, 읍/면/동을 순서대로 선택해 주세요.');
      return;
    }

    setResolving(true);
    try {
      const candidates = await searchShareLocations(selectedDong.fullName);
      const candidate = candidates.find((item) => item.full_address === selectedDong.fullName)
        || candidates[0];
      if (!candidate) {
        showAppDialog('위치 변환 실패', '선택한 행정구역의 좌표를 찾지 못했어요. 현재 위치로 설정해 주세요.');
        return;
      }

      await saveCoordinate({
        latitude: candidate.latitude,
        longitude: candidate.longitude,
      });
    } catch (error) {
      showAppDialog('위치 변환 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>이전</Text>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>나눔 위치 설정</Text>
        <Text style={styles.subtitle}>
          시/도, 시/군/구, 읍/면/동을 선택해서 나눔글 노출 기준 위치를 설정해요.
        </Text>

        <View style={styles.selectorGrid}>
          <View style={styles.selectorColumn}>
            <Text style={styles.selectorLabel}>시/도</Text>
            <ScrollView style={styles.selectorList} contentContainerStyle={styles.selectorContent}>
              {activeSiList.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.optionButton,
                    selectedSiCode === item.code ? styles.optionButtonSelected : null,
                  ]}
                  onPress={() => handleSelectSi(item.code)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} 선택`}
                >
                  <Text style={[
                    styles.optionText,
                    selectedSiCode === item.code ? styles.optionTextSelected : null,
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.selectorColumn}>
            <Text style={styles.selectorLabel}>시/군/구</Text>
            <ScrollView style={styles.selectorList} contentContainerStyle={styles.selectorContent}>
              {guOptions.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.optionButton,
                    selectedGuCode === item.code ? styles.optionButtonSelected : null,
                  ]}
                  onPress={() => handleSelectGu(item.code)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} 선택`}
                >
                  <Text style={[
                    styles.optionText,
                    selectedGuCode === item.code ? styles.optionTextSelected : null,
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <ScrollView
          style={styles.dongList}
          contentContainerStyle={styles.dongContent}
          keyboardShouldPersistTaps="handled"
        >
          {dongOptions.length === 0 ? (
            <Text style={styles.emptyText}>시/군/구를 선택하면 읍/면/동이 표시돼요.</Text>
          ) : null}
          {dongOptions.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.dongButton,
                selectedDongCode === item.code ? styles.dongButtonSelected : null,
              ]}
              onPress={() => setSelectedDongCode(item.code)}
              accessibilityRole="button"
              accessibilityLabel={`${item.fullName} 선택`}
            >
              <Text style={[
                styles.dongName,
                selectedDongCode === item.code ? styles.dongNameSelected : null,
              ]}>
                {item.name}
              </Text>
              <Text style={styles.dongAddress}>{item.fullName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>나눔 위치 기준</Text>
          <Text style={styles.guideText}>
            위치를 저장하면 나눔 탭에서 원하는 반경을 선택해 주변 나눔글을 볼 수 있어요. 동 이름은 카카오 주소 변환 결과로 표시돼요.
          </Text>
          {savedLocation ? (
            <Text style={styles.savedLocationText}>
              {savedLocation.display_address || savedLocation.full_address}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.selectedLocationButton,
            (!selectedDong || resolving) ? styles.secondaryButtonDisabled : null,
          ]}
          onPress={handleUseSelectedLocation}
          disabled={!selectedDong || resolving}
          accessibilityRole="button"
          accessibilityLabel="선택한 행정구역으로 나눔 위치 설정"
        >
          {resolving ? <ActivityIndicator color="#3182F6" /> : null}
          <Text style={styles.selectedLocationButtonText}>
            {selectedDong ? `${selectedDong.name}으로 설정` : '읍/면/동을 선택해 주세요'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.locationButton, loading ? styles.locationButtonDisabled : null]}
          onPress={handleUseCurrentLocation}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="현재 위치로 나눔 위치 설정"
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : null}
          <Text style={styles.locationButtonText}>
            {loading ? '위치 저장 중' : '현재 위치로 설정하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9FF',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#495057',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 108,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#191F28',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7684',
    marginBottom: 4,
  },
  selectorGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  selectorColumn: {
    flex: 1,
  },
  selectorLabel: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '800',
    color: '#4E5968',
  },
  selectorList: {
    maxHeight: 172,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  selectorContent: {
    padding: 8,
    gap: 6,
  },
  optionButton: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#E8F3FF',
  },
  optionText: {
    fontSize: 14,
    color: '#4E5968',
    fontWeight: '700',
  },
  optionTextSelected: {
    color: '#1B64DA',
  },
  dongList: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  dongContent: {
    padding: 8,
    gap: 8,
  },
  emptyText: {
    paddingVertical: 24,
    textAlign: 'center',
    color: '#8B95A1',
    fontSize: 13,
  },
  dongButton: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    gap: 3,
  },
  dongButtonSelected: {
    backgroundColor: '#E8F3FF',
    borderWidth: 1,
    borderColor: '#8BC8FF',
  },
  dongName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191F28',
  },
  dongNameSelected: {
    color: '#1B64DA',
  },
  dongAddress: {
    fontSize: 12,
    color: '#8B95A1',
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  selectedLocationButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B9DCFF',
    backgroundColor: '#F5FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  selectedLocationButtonText: {
    color: '#3182F6',
    fontSize: 15,
    fontWeight: '800',
  },
  guideBox: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#E8F3FF',
    borderWidth: 1,
    borderColor: '#B9DCFF',
    gap: 6,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B64DA',
  },
  guideText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4E5968',
  },
  savedLocationText: {
    marginTop: 4,
    fontSize: 13,
    color: '#191F28',
    fontWeight: '700',
  },
  locationButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: '#3182F6',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  locationButtonDisabled: {
    backgroundColor: '#9EC5FE',
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
