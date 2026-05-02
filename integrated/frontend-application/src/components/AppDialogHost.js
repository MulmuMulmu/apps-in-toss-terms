import React, { useEffect, useState } from 'react';
import {
  Alert as NativeAlert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../styles/tossTokens';

let installed = false;
let dispatchDialog = null;
const pendingDialogs = [];

function normalizeButtons(buttons) {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    return [{ text: '확인' }];
  }

  return buttons.map((button) => ({
    text: button?.text || '확인',
    style: button?.style,
    onPress: typeof button?.onPress === 'function' ? button.onPress : undefined,
  }));
}

function enqueueDialog(dialog) {
  if (dispatchDialog) {
    dispatchDialog(dialog);
    return;
  }
  pendingDialogs.push(dialog);
}

export function showAppDialog(title, message, buttons) {
  enqueueDialog({
    title: title || '알림',
    message: message || '',
    buttons: normalizeButtons(buttons),
  });
}

export function installAppDialogBridge() {
  if (installed) {
    return;
  }

  installed = true;
  NativeAlert['alert'] = (title, message, buttons) => {
    showAppDialog(String(title || '알림'), String(message || ''), buttons);
  };

  if (typeof globalThis !== 'undefined') {
    globalThis.alert = (message) => {
      showAppDialog('알림', String(message || ''));
    };
  }
}

export default function AppDialogHost() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    dispatchDialog = (dialog) => setQueue((prev) => [...prev, dialog]);
    if (pendingDialogs.length > 0) {
      setQueue((prev) => [...prev, ...pendingDialogs.splice(0)]);
    }
    return () => {
      dispatchDialog = null;
    };
  }, []);

  const current = queue[0];
  const closeCurrent = () => setQueue((prev) => prev.slice(1));

  const handleButtonPress = (button) => {
    closeCurrent();
    if (button.onPress) {
      button.onPress();
    }
  };

  return (
    <Modal
      visible={Boolean(current)}
      transparent
      animationType="fade"
      onRequestClose={closeCurrent}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityRole="alert">
          <Text style={styles.title}>{current?.title}</Text>
          {current?.message ? (
            <Text style={styles.message}>{current.message}</Text>
          ) : null}
          <View style={styles.actions}>
            {current?.buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  accessibilityRole="button"
                  style={[
                    styles.actionButton,
                    isCancel && styles.secondaryButton,
                    isDestructive && styles.dangerButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.actionText,
                      isCancel && styles.secondaryText,
                      isDestructive && styles.dangerText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 22,
    backgroundColor: colors.surfaceRaised,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  message: {
    marginTop: 10,
    color: colors.subText,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 22,
  },
  actionButton: {
    minWidth: 80,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
  },
  dangerButton: {
    backgroundColor: colors.dangerSurface,
  },
  actionText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryText: {
    color: colors.subText,
  },
  dangerText: {
    color: colors.danger,
  },
});
