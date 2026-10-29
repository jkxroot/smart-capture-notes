import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRecords } from '../../../src/context/RecordsContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { useToast } from '../../../src/context/ToastContext';
import { storageService } from '../../../src/services/storageService';
import { useImagePicker } from '../../../src/hooks/useImagePicker';
import { ImagePreview } from '../../../src/components/ImagePreview';
import { CategoryChip } from '../../../src/components/CategoryChip';
import { Category, CATEGORIES } from '../../../src/types/record';
import {
  validateRecordTitle,
  validateRecordNotes,
  validateRecordCategory,
} from '../../../src/utils/validation';
import { APP_CONFIG } from '../../../src/utils/constants';

export default function EditRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecordById, updateRecord } = useRecords();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<Category>('Personal');

  // Existing image from database
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  // Field errors
  const [titleError, setTitleError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);

  const {
    selectedImageUri,
    isProcessing,
    takePhoto,
    pickFromGallery,
    clearImage,
  } = useImagePicker();

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    setLoading(true);
    getRecordById(id)
      .then((record) => {
        if (isMounted && record) {
          setTitle(record.title);
          setNotes(record.notes || '');
          setCategory(record.category);
          setExistingImagePath(record.image_path);

          if (record.image_path) {
            storageService.getSignedUrl(record.image_path).then(({ url }) => {
              if (isMounted && url) {
                setExistingImageUrl(url);
              }
            });
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, getRecordById]);

  const handleRemovePhoto = () => {
    clearImage();
    setRemoveExistingImage(true);
    setExistingImageUrl(null);
  };

  const handleSave = async () => {
    if (!id) return;

    setTitleError(null);
    setNotesError(null);

    const titleValidation = validateRecordTitle(title);
    const notesValidation = validateRecordNotes(notes);
    const catValidation = validateRecordCategory(category);

    let hasError = false;
    if (!titleValidation.isValid) {
      setTitleError(titleValidation.error ?? null);
      hasError = true;
    }
    if (!notesValidation.isValid) {
      setNotesError(notesValidation.error ?? null);
      hasError = true;
    }
    if (!catValidation.isValid) {
      showToast(catValidation.error || 'Invalid category', 'error');
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);
    try {
      const result = await updateRecord(
        id,
        {
          title,
          notes: notes.trim() ? notes : null,
          category,
        },
        selectedImageUri,
        removeExistingImage
      );

      if (result.success) {
        showToast('Record updated successfully!', 'success');
        router.back();
      } else {
        showToast(result.error || 'Failed to update record.', 'error');
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Display URI: either newly chosen image or existing image URL if not marked for removal
  const displayImageUri = selectedImageUri || (!removeExistingImage ? existingImageUrl : null);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Input */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, typography.labelMedium, { color: colors.textPrimary }]}>
              Title <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <Text
              style={[
                styles.charCounter,
                typography.caption,
                {
                  color:
                    title.length > APP_CONFIG.MAX_TITLE_LENGTH
                      ? colors.error
                      : colors.textTertiary,
                },
              ]}
            >
              {title.length}/{APP_CONFIG.MAX_TITLE_LENGTH}
            </Text>
          </View>
          <TextInput
            style={[
              styles.input,
              typography.bodyLarge,
              {
                backgroundColor: colors.surface,
                borderColor: titleError ? colors.error : colors.border,
                borderRadius: borderRadius.md,
                color: colors.textPrimary,
                padding: spacing.md,
              },
            ]}
            placeholder="Title"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (titleError) setTitleError(null);
            }}
            maxLength={APP_CONFIG.MAX_TITLE_LENGTH}
            editable={!submitting}
            accessibilityLabel="Edit note title input"
          />
          {titleError ? (
            <Text style={[styles.inlineError, typography.bodySmall, { color: colors.error }]}>
              {titleError}
            </Text>
          ) : null}
        </View>

        {/* Category Picker Chips */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, typography.labelMedium, { color: colors.textPrimary }]}>
            Category <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat}
                category={cat}
                selected={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Photo Attachment Preview / Editor */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, typography.labelMedium, { color: colors.textPrimary }]}>
            Photo Attachment
          </Text>
          <ImagePreview
            imageUri={displayImageUri}
            onTakePhoto={takePhoto}
            onPickGallery={pickFromGallery}
            onRemove={handleRemovePhoto}
            isProcessing={isProcessing}
          />
        </View>

        {/* Notes Input */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, typography.labelMedium, { color: colors.textPrimary }]}>
              Notes
            </Text>
            <Text
              style={[
                styles.charCounter,
                typography.caption,
                {
                  color:
                    notes.length > APP_CONFIG.MAX_NOTES_LENGTH
                      ? colors.error
                      : colors.textTertiary,
                },
              ]}
            >
              {notes.length}/{APP_CONFIG.MAX_NOTES_LENGTH}
            </Text>
          </View>
          <TextInput
            style={[
              styles.textArea,
              typography.bodyMedium,
              {
                backgroundColor: colors.surface,
                borderColor: notesError ? colors.error : colors.border,
                borderRadius: borderRadius.md,
                color: colors.textPrimary,
                padding: spacing.md,
              },
            ]}
            placeholder="Add detailed notes..."
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={(text) => {
              setNotes(text);
              if (notesError) setNotesError(null);
            }}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={APP_CONFIG.MAX_NOTES_LENGTH}
            editable={!submitting}
            accessibilityLabel="Edit note content input"
          />
          {notesError ? (
            <Text style={[styles.inlineError, typography.bodySmall, { color: colors.error }]}>
              {notesError}
            </Text>
          ) : null}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.md,
              opacity: submitting || isProcessing ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={submitting || isProcessing}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Save Changes"
        >
          {submitting ? (
            <View style={styles.buttonLoadingRow}>
              <ActivityIndicator color={colors.primaryForeground} size="small" />
              <Text
                style={[
                  styles.submitButtonText,
                  typography.labelLarge,
                  { color: colors.primaryForeground, marginLeft: 8 },
                ]}
              >
                Updating Note...
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.submitButtonText,
                typography.labelLarge,
                { color: colors.primaryForeground },
              ]}
            >
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {},
  charCounter: {},
  input: {
    borderWidth: 1,
    minHeight: 48,
  },
  textArea: {
    borderWidth: 1,
    minHeight: 120,
  },
  inlineError: {
    marginTop: 4,
  },
  categoryRow: {
    paddingVertical: 4,
  },
  submitButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: '700',
  },
});
