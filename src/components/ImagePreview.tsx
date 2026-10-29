import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ImagePreviewProps {
  imageUri?: string | null;
  onTakePhoto: () => void;
  onPickGallery: () => void;
  onRemove?: () => void;
  isProcessing?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUri,
  onTakePhoto,
  onPickGallery,
  onRemove,
  isProcessing = false,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View
          style={[
            styles.previewWrapper,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Image
            source={{ uri: imageUri }}
            style={[styles.previewImage, { borderRadius: borderRadius.lg }]}
            resizeMode="cover"
            accessibilityLabel="Attached note picture"
          />

          {isProcessing && (
            <View style={[styles.processingOverlay, { backgroundColor: colors.overlay }]}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={[styles.processingText, typography.labelMedium, { color: '#FFFFFF' }]}>
                Compressing image...
              </Text>
            </View>
          )}

          {/* Action buttons over image */}
          <View style={styles.imageOverlayActions}>
            <TouchableOpacity
              onPress={onTakePhoto}
              disabled={isProcessing}
              style={[
                styles.floatingBtn,
                { backgroundColor: colors.surfaceElevated, borderRadius: borderRadius.pill },
              ]}
              accessibilityLabel="Retake photo"
              accessibilityRole="button"
            >
              <Ionicons name="camera-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPickGallery}
              disabled={isProcessing}
              style={[
                styles.floatingBtn,
                { backgroundColor: colors.surfaceElevated, borderRadius: borderRadius.pill },
              ]}
              accessibilityLabel="Replace photo from library"
              accessibilityRole="button"
            >
              <Ionicons name="images-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            {onRemove && (
              <TouchableOpacity
                onPress={onRemove}
                disabled={isProcessing}
                style={[
                  styles.floatingBtn,
                  { backgroundColor: colors.errorBackground, borderRadius: borderRadius.pill },
                ]}
                accessibilityLabel="Remove photo"
                accessibilityRole="button"
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.emptyPlaceholder,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.borderSubtle,
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
            },
          ]}
        >
          {isProcessing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  typography.bodyMedium,
                  { color: colors.textSecondary, marginTop: spacing.sm },
                ]}
              >
                Processing image...
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.cameraIconBox,
                  { backgroundColor: colors.surface, borderRadius: borderRadius.pill },
                ]}
              >
                <Ionicons name="camera-outline" size={32} color={colors.primary} />
              </View>

              <Text style={[styles.placeholderTitle, typography.labelLarge, { color: colors.textPrimary }]}>
                Add an Image (Optional)
              </Text>
              <Text
                style={[
                  styles.placeholderSubtitle,
                  typography.bodySmall,
                  { color: colors.textSecondary, marginBottom: spacing.md },
                ]}
              >
                Capture with camera or choose from gallery
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={onTakePhoto}
                  style={[
                    styles.pickBtn,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: borderRadius.md,
                      marginRight: spacing.sm,
                    },
                  ]}
                  accessibilityLabel="Take photo with camera"
                  accessibilityRole="button"
                >
                  <Ionicons name="camera" size={16} color="#FFFFFF" style={styles.btnIcon} />
                  <Text style={[styles.pickBtnText, typography.labelMedium, { color: '#FFFFFF' }]}>
                    Take Photo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onPickGallery}
                  style={[
                    styles.pickBtn,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  accessibilityLabel="Choose photo from gallery"
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="images-outline"
                    size={16}
                    color={colors.textPrimary}
                    style={styles.btnIcon}
                  />
                  <Text
                    style={[
                      styles.pickBtnText,
                      typography.labelMedium,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  previewWrapper: {
    position: 'relative',
    height: 220,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 8,
  },
  imageOverlayActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  floatingBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  emptyPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    minHeight: 180,
  },
  cameraIconBox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  placeholderTitle: {
    marginBottom: 4,
  },
  placeholderSubtitle: {
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnIcon: {
    marginRight: 6,
  },
  pickBtnText: {
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
});
