import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [fadeAnim, slideAnim]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      if (!message || message.trim().length === 0) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToast({ message, type, duration });

      fadeAnim.setValue(0);
      slideAnim.setValue(-20);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [fadeAnim, slideAnim, hideToast]
  );

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'error':
        return colors.danger;
      case 'success':
        return colors.accent;
      default:
        return colors.border;
    }
  };

  const getIconName = (type: ToastType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'error':
        return 'alert-circle-outline';
      case 'success':
        return 'checkmark-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getIconColor = (type: ToastType): string => {
    switch (type) {
      case 'error':
        return colors.danger;
      case 'success':
        return colors.accent;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast ? (
        <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
          <Animated.View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[
              styles.container,
              shadows.dialog,
              {
                backgroundColor: colors.surface,
                borderColor: getBorderColor(toast.type || 'info'),
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Ionicons
              name={getIconName(toast.type || 'info')}
              size={18}
              color={getIconColor(toast.type || 'info')}
              style={styles.icon}
            />
            <Text
              style={[
                typography.bodyMedium,
                styles.message,
                { color: colors.textPrimary },
              ]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
            <TouchableOpacity
              onPress={hideToast}
              accessibilityLabel="Dismiss notification"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 24 : 12,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 520,
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    flex: 1,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 2,
  },
});
