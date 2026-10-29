import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useToast } from '../../src/context/ToastContext';
import { validateEmail, validatePassword } from '../../src/utils/validation';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSignup = async () => {
    // Clear previous errors
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setFormError(null);

    // Validate inputs
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
      setConfirmPasswordError('Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const res = await signUp(email, password);
      if (res.error) {
        setFormError(res.error);
        showToast(res.error, 'error');
      } else {
        showToast('Account created successfully!', 'success');
      }
    } catch {
      setFormError('An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.logoBadge,
                { backgroundColor: colors.primaryMuted, borderRadius: borderRadius.pill },
              ]}
            >
              <Ionicons name="sparkles" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.title, typography.h1, { color: colors.textPrimary }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, typography.bodyMedium, { color: colors.textSecondary }]}>
              Organize notes, ideas and photos with ease
            </Text>
          </View>

          {/* Form Error Banner */}
          {formError ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.errorBackground,
                  borderColor: colors.error,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                },
              ]}
              accessibilityRole="alert"
            >
              <Ionicons name="alert-circle" size={20} color={colors.error} style={styles.errorIcon} />
              <Text style={[styles.errorBannerText, typography.bodyMedium, { color: colors.error }]}>
                {formError}
              </Text>
            </View>
          ) : null}

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, typography.labelMedium, { color: colors.textPrimary }]}>
              Email Address
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: emailError ? colors.error : colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, typography.bodyLarge, { color: colors.textPrimary }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!loading}
                accessibilityLabel="Email Address"
              />
            </View>
            {emailError ? (
              <Text style={[styles.inlineError, typography.bodySmall, { color: colors.error }]}>
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* Password Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, typography.labelMedium, { color: colors.textPrimary }]}>
              Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: passwordError ? colors.error : colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, typography.bodyLarge, { color: colors.textPrimary }]}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                accessibilityLabel="Password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={[styles.inlineError, typography.bodySmall, { color: colors.error }]}>
                {passwordError}
              </Text>
            ) : null}
          </View>

          {/* Confirm Password Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, typography.labelMedium, { color: colors.textPrimary }]}>
              Confirm Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: confirmPasswordError ? colors.error : colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, typography.bodyLarge, { color: colors.textPrimary }]}
                placeholder="Repeat password"
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                accessibilityLabel="Confirm Password"
              />
            </View>
            {confirmPasswordError ? (
              <Text style={[styles.inlineError, typography.bodySmall, { color: colors.error }]}>
                {confirmPasswordError}
              </Text>
            ) : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityLabel="Create account button"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <Text style={[styles.submitBtnText, typography.labelLarge, { color: colors.primaryForeground }]}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle to Sign In */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, typography.bodyMedium, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Navigate to sign in"
            >
              <Text style={[styles.footerLink, typography.labelLarge, { color: colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  eyeBtn: {
    padding: 6,
  },
  inlineError: {
    marginTop: 6,
    marginLeft: 4,
  },
  submitBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  submitBtnText: {
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {},
  footerLink: {},
});
