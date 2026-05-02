import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { KAKAO_MAP_JAVASCRIPT_KEY } from '../config/appsInToss';
import { colors } from '../styles/tossTokens';

const KAKAO_MAP_KEY = KAKAO_MAP_JAVASCRIPT_KEY;

const loadKakaoMapSdk = () => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') {
    reject(new Error('Kakao Map은 웹 런타임에서만 사용할 수 있어요.'));
    return;
  }

  if (window.kakao?.maps) {
    window.kakao.maps.load(() => resolve(window.kakao));
    return;
  }

  if (!KAKAO_MAP_KEY) {
    reject(new Error('EXPO_PUBLIC_KAKAO_MAP_KEY가 설정되지 않았어요.'));
    return;
  }

  const existingScript = document.querySelector('script[data-kakao-map-sdk="true"]');
  if (existingScript) {
    existingScript.addEventListener('load', () => window.kakao.maps.load(() => resolve(window.kakao)));
    existingScript.addEventListener('error', reject);
    return;
  }

  const script = document.createElement('script');
  script.dataset.kakaoMapSdk = 'true';
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(KAKAO_MAP_KEY)}&autoload=false`;
  script.async = true;
  script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
  script.onerror = reject;
  document.head.appendChild(script);
});

export default function KakaoMapView({ center, markers = [], style }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    let cancelled = false;

    loadKakaoMapSdk()
      .then((kakao) => {
        if (cancelled || !containerRef.current || !center?.latitude || !center?.longitude) return;

        const mapCenter = new kakao.maps.LatLng(center.latitude, center.longitude);
        const map = new kakao.maps.Map(containerRef.current, {
          center: mapCenter,
          level: 4,
        });

        new kakao.maps.Marker({
          position: mapCenter,
          map,
        });

        markers
          .filter((marker) => marker?.latitude && marker?.longitude)
          .forEach((marker) => {
            new kakao.maps.Marker({
              position: new kakao.maps.LatLng(marker.latitude, marker.longitude),
              map,
              title: marker.title,
            });
          });
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : '지도를 불러오지 못했어요.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [center?.latitude, center?.longitude, markers]);

  if (Platform.OS !== 'web' || !KAKAO_MAP_KEY || error) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackTitle}>현재 위치 지도</Text>
        <Text style={styles.fallbackText}>
          {error || '카카오 지도 JavaScript 키를 설정하면 지도가 표시돼요.'}
        </Text>
        {center?.latitude && center?.longitude ? (
          <Text style={styles.coordinateText}>
            {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
          </Text>
        ) : null}
      </View>
    );
  }

  return React.createElement('div', {
    ref: containerRef,
    style: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
      overflow: 'hidden',
      ...StyleSheet.flatten(style),
    },
  });
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7EF',
    paddingHorizontal: 18,
  },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  fallbackText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.subText,
    textAlign: 'center',
  },
  coordinateText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.placeholder,
  },
});
