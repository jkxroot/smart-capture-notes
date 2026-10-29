import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useToast } from '../../src/context/ToastContext';
import { validateEmail, validatePassword } from '../../src/utils/validation';
import { Screen } from '../../src/components/Screen';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, typography, spacing } = useTheme();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleLogin = async () => {
    setEmailError(null);
    setPasswordError(null);

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    let hasError = false;
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error ?? null);
      hasError = true;
    }
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error ?? null);
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const res = await signIn(email, password);
      if (res.error) {
        showToast(res.error, 'error');
      }
    } catch {
      showToast('Unable to sign in. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen avoidKeyboard edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandSection}>
          <Text style={[styles.wordmark, typography.h1, { color: colors.textPrimary }]}>
            Smart Capture
          </Text>
          <Text style={[styles.tagline, typography.bodyMedium, { color: colors.textSecondary }]}>
            Calm, private notes with photo captures.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="name@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(null);
            }}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Input
            label="Password"
            placeholder="Account password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            error={passwordError}
            isPassword
            editable={!loading}
          />

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.footerRow}>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Switch to create account"
            >
              <Text style={[typography.labelLarge, { color: colors.accent }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brandSection: {
    marginBottom: 36,
  },
  wordmark: {
    marginBottom: 6,
  },
  tagline: {
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
