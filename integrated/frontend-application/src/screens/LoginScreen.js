import React, { useState } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../api/auth';
import { setToken } from '../api/token';

const colors = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  primary: '#3182F6',
  primaryPressed: '#1B64DA',
  text: '#191F28',
  subText: '#6B7684',
  placeholder: '#B0B8C1',
  border: '#E5E8EB',
};

export default function LoginScreen({ navigation }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!id || !password) {
      showAppDialog('알림', '아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const data = await login({ id, password });
      if (data.success) {
        setToken(data.result.jwt);
        const firstLogin = data.result.firstLogin ?? data.result.fisrtLogin;
        if (firstLogin === true || firstLogin === 'true') {
          navigation.replace('Allergy');
        } else {
          navigation.replace('Main');
        }
      } else {
        showAppDialog('로그인 실패', data.result || '로그인 할 수 없습니다.');
      }
    } catch (e) {
      showAppDialog('오류', '서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.brandLabel}>물무물무</Text>
            <Text style={styles.title}>식재료를 등록하고{'\n'}오늘 만들 요리를 찾아보세요</Text>
            <Text style={styles.subtitle}>
              토스 미니앱 안에서 영수증 분석, 소비기한 관리, 레시피 추천까지 이어지는 흐름으로 구성했어요.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>아이디</Text>
              <TextInput
                style={styles.input}
                placeholder="아이디를 입력해주세요"
                placeholderTextColor={colors.placeholder}
                value={id}
                onChangeText={setId}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                accessibilityLabel="아이디"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="비밀번호를 입력해주세요"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  accessibilityLabel="비밀번호"
                />
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.placeholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
                (!id || !password) && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading || !id || !password}
              accessibilityRole="button"
            >
              {loading
                ? <ActivityIndicator color="#ffffff" />
                : <Text style={styles.loginButtonText}>로그인</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
            >
              <Text style={styles.registerButtonText}>처음이라면 회원가입</Text>
            </TouchableOpacity>

            <View style={styles.policyBox}>
              <Text style={styles.policyText}>
                앱인토스 정책에 맞춰 외부 소셜 로그인은 제공하지 않습니다. 토스 로그인 연동은 백엔드 인가 코드 교환 API가 준비된 뒤 연결합니다.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
  },
  hero: {
    paddingTop: 36,
    paddingBottom: 36,
  },
  brandLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F3FF',
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.subText,
  },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  passwordContainer: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 6,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.55,
    backgroundColor: colors.primaryPressed,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  registerButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3FF',
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  policyBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F2F4F6',
  },
  policyText: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 18,
  },
});
