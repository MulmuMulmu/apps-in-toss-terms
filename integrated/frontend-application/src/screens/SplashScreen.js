import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { exchangeTossLogin } from '../api/auth';
import { setToken } from '../api/token';
import {
  APPS_IN_TOSS_LOGIN_UNAVAILABLE,
  requestAppsInTossAuthorization,
} from '../services/appInTossAuth';
import { loginWithDevelopmentAccount } from '../services/developmentAuth';

const isDevBypassEnabled = () =>
  typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && process.env.EXPO_PUBLIC_DEV_BYPASS_APPINTOSS_LOGIN !== '0';

export default function SplashScreen({ navigation }) {
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState('토스 로그인 상태를 확인하고 있어요.');
  const [error, setError] = useState(null);
  const devBypassEnabled = isDevBypassEnabled();

  const moveNext = useCallback((session) => {
    setToken(session.jwt);
    const firstLogin = session.firstLogin === true || session.firstLogin === 'true';
    navigation.replace(firstLogin ? 'Allergy' : 'Main');
  }, [navigation]);

  const startAppsInTossLogin = useCallback(async () => {
    setBusy(true);
    setError(null);
    setStatus('필요하면 토스 로그인 및 약관 동의 화면으로 이동해요.');

    try {
      const authorization = await requestAppsInTossAuthorization();
      const session = await exchangeTossLogin(authorization);
      moveNext(session);
    } catch (caughtError) {
      const isRuntimeUnavailable = caughtError?.code === APPS_IN_TOSS_LOGIN_UNAVAILABLE;
      setStatus(
        isRuntimeUnavailable
          ? '앱인토스 실행 환경을 찾지 못했어요.'
          : '토스 로그인을 완료하지 못했어요.'
      );
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : '잠시 후 다시 시도해 주세요.'
      );
      setBusy(false);
    }
  }, [moveNext]);

  const startDevelopmentLogin = useCallback(async () => {
    setBusy(true);
    setError(null);
    setStatus('로컬 개발 계정으로 로그인하고 있어요.');

    try {
      const session = await loginWithDevelopmentAccount();
      moveNext(session);
    } catch (caughtError) {
      setStatus('로컬 개발 계정 로그인에 실패했어요.');
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : '백엔드 서버와 개발 계정을 확인해 주세요.'
      );
      setBusy(false);
    }
  }, [moveNext]);

  useEffect(() => {
    if (devBypassEnabled) {
      void startDevelopmentLogin();
      return;
    }

    void startAppsInTossLogin();
  }, [devBypassEnabled, startAppsInTossLogin, startDevelopmentLogin]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.badge}>토스 미니앱</Text>
        <Text style={styles.appName}>물무물무</Text>
        <Text style={styles.description}>
          영수증으로 식재료를 등록하고 지금 만들 수 있는 레시피를 확인해요.
        </Text>
        <View style={styles.statusBox}>
          {busy ? <ActivityIndicator color="#3182F6" /> : null}
          <Text style={styles.statusText}>{status}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
      {!busy ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={startAppsInTossLogin}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>토스 로그인 다시 시도</Text>
          </TouchableOpacity>
          {devBypassEnabled ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.replace('Main')}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>개발용으로 앱 둘러보기</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 28,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 112,
    height: 112,
    resizeMode: 'contain',
    marginBottom: 18,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F3FF',
    color: '#3182F6',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 14,
  },
  appName: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    color: '#191F28',
    letterSpacing: -0.4,
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7684',
    textAlign: 'center',
  },
  statusBox: {
    width: '100%',
    minHeight: 96,
    marginTop: 32,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4E5968',
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#8B95A1',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#3182F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#4E5968',
    fontSize: 16,
    fontWeight: '800',
  },
});
