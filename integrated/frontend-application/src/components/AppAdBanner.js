import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  APPS_IN_TOSS_BANNER_AD_GROUP_ID,
  ENABLE_APPS_IN_TOSS_BANNER_AD,
} from '../config/appsInToss';
import { colors } from '../styles/tossTokens';

const adGroupId = APPS_IN_TOSS_BANNER_AD_GROUP_ID;
const isBannerEnabled = ENABLE_APPS_IN_TOSS_BANNER_AD && Boolean(adGroupId);
let tossAdsInitializePromise = null;

const initializeTossAds = async () => {
  const { TossAds } = await import('@apps-in-toss/web-framework');

  if (!TossAds?.initialize?.isSupported?.()) {
    return null;
  }

  if (!tossAdsInitializePromise) {
    tossAdsInitializePromise = new Promise((resolve) => {
      TossAds.initialize({
        callbacks: {
          onInitialized: () => resolve(TossAds),
          onInitializationFailed: () => resolve(null),
        },
      });
    });
  }

  return tossAdsInitializePromise;
};

export default function AppAdBanner() {
  const bannerRef = useRef(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!isBannerEnabled || Platform.OS !== 'web') {
      return undefined;
    }

    let cancelled = false;
    let attachedBanner = null;

    initializeTossAds()
      .then((TossAds) => {
        if (cancelled || !TossAds || !bannerRef.current) {
          setStatus('unsupported');
          return;
        }

        if (!TossAds.attachBanner?.isSupported?.()) {
          setStatus('unsupported');
          return;
        }

        attachedBanner = TossAds.attachBanner(adGroupId, bannerRef.current, {
          theme: 'auto',
          tone: 'blackAndWhite',
          variant: 'expanded',
          callbacks: {
            onAdRendered: () => setStatus('rendered'),
            onNoFill: () => setStatus('no-fill'),
            onAdFailedToRender: () => setStatus('failed'),
          },
        });
      })
      .catch(() => setStatus('failed'));

    return () => {
      cancelled = true;
      attachedBanner?.destroy?.();
    };
  }, []);

  if (!isBannerEnabled) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="광고 영역"
    >
      <View style={styles.header}>
        <Text style={styles.badge}>AD</Text>
        <Text style={styles.title}>토스 광고</Text>
      </View>
      {Platform.OS === 'web'
        ? React.createElement('div', {
          ref: bannerRef,
          'aria-label': '토스 배너 광고',
          style: styles.webBannerSlot,
        })
        : null}
      {status === 'idle' || status === 'rendered' ? null : (
        <Text style={styles.description}>
          토스 앱에서 광고가 표시돼요
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#F5F8FF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    shadowColor: '#0B1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.primary,
    color: colors.background,
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  description: {
    marginTop: 4,
    color: colors.subText,
    fontSize: 11,
  },
  webBannerSlot: {
    width: '100%',
    height: 96,
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
