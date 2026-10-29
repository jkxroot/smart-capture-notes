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

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors, typography, spacing } = useTheme();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleSignup = async () => {
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);

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
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const res = await signUp(email, password);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Account created.', 'success');
      }
    } catch {
      showToast('Unable to create account. Please try again.', 'error');
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
            Create Account
          </Text>
          <Text style={[styles.tagline, typography.bodyMedium, { color: colors.textSecondary }]}>
            Start capturing notes and ideas in one calm place.
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
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            error={passwordError}
            isPassword
            editable={!loading}
          />

          <Input
            label="Confirm Password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmError) setConfirmError(null);
            }}
            error={confirmError}
            isPassword
            editable={!loading}
          />

          <Button
            label="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.footerRow}>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Switch to sign in"
            >
              <Text style={[typography.labelLarge, { color: colors.accent }]}>
                Sign In
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
    marginBottom: 32,
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
