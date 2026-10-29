import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRecords } from '../../../src/context/RecordsContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { useToast } from '../../../src/context/ToastContext';
import { useNetwork } from '../../../src/context/NetworkContext';
import { storageService } from '../../../src/services/storageService';
import { useImagePicker } from '../../../src/hooks/useImagePicker';
import { Screen } from '../../../src/components/Screen';
import { Input } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { Chip } from '../../../src/components/Chip';
import { ActionSheet, ActionOption } from '../../../src/components/ActionSheet';
import { ConfirmDialog } from '../../../src/components/ConfirmDialog';
import { Category, CATEGORIES } from '../../../src/types/record';
import { validateRecordTitle, validateRecordNotes } from '../../../src/utils/validation';
import { APP_CONFIG } from '../../../src/utils/constants';

export default function EditRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecordById, updateRecord } = useRecords();
  const { colors, typography, spacing } = useTheme();
  const { showToast } = useToast();
  const { isOffline } = useNetwork();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [initialTitle, setInitialTitle] = useState('');
  const [initialNotes, setInitialNotes] = useState('');
  const [initialCategory, setInitialCategory] = useState<Category>('Personal');

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<Category>('Personal');

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const [titleError, setTitleError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [showImageSheet, setShowImageSheet] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

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
          setInitialTitle(record.title);
          setNotes(record.notes || '');
          setInitialNotes(record.notes || '');
          setCategory(record.category);
          setInitialCategory(record.category);

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

  const hasUnsavedChanges =
    title !== initialTitle ||
    notes !== initialNotes ||
    category !== initialCategory ||
    Boolean(selectedImageUri) ||
    removeExistingImage;

  useEffect(() => {
    const onBackPress = () => {
      if (hasUnsavedChanges) {
        setShowDiscardDialog(true);
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [hasUnsavedChanges]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowDiscardDialog(true);
    } else {
      router.back();
    }
  };

  const handleRemovePhoto = () => {
    clearImage();
    setRemoveExistingImage(true);
    setExistingImageUrl(null);
  };

  const handleSave = async () => {
    if (!id || submitting || isProcessing) return;

    if (isOffline) {
      showToast('You are offline. Cannot update note without internet.', 'error');
      return;
    }

    setTitleError(null);
    setNotesError(null);

    const titleValidation = validateRecordTitle(title);
    const notesValidation = validateRecordNotes(notes);

    let hasError = false;
    if (!titleValidation.isValid) {
      setTitleError(titleValidation.error ?? null);
      hasError = true;
    }
    if (!notesValidation.isValid) {
      setNotesError(notesValidation.error ?? null);
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);
    try {
      const result = await updateRecord(
        id,
        {
          title: title.trim(),
          notes: notes.trim() ? notes.trim() : null,
          category,
        },
        selectedImageUri,
        removeExistingImage
      );

      if (result.success) {
        showToast('Note updated.', 'success');
        router.back();
      } else {
        showToast(result.error || 'Failed to update note.', 'error');
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      </Screen>
    );
  }

  const isFormValid = title.trim().length >= 1 && title.trim().length <= APP_CONFIG.MAX_TITLE_LENGTH;
  const currentPhotoUri = selectedImageUri || (!removeExistingImage ? existingImageUrl : null);

  const imageOptions: ActionOption[] = [
    {
      label: 'Take Photo',
      icon: 'camera-outline',
      onPress: () => {
        takePhoto();
      },
    },
    {
      label: 'Choose from Library',
      icon: 'images-outline',
      onPress: () => {
        pickFromGallery();
      },
    },
  ];

  if (currentPhotoUri) {
    imageOptions.push({
      label: 'Remove Photo',
      icon: 'trash-outline',
      destructive: true,
      onPress: handleRemovePhoto,
    });
  }

  return (
    <Screen avoidKeyboard edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle, paddingHorizontal: spacing.lg }]}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Cancel editing note"
        >
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text style={[typography.h3, { color: colors.textPrimary }]}>
          Edit Note
        </Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Large Image Header (4:3 ratio) */}
        {currentPhotoUri ? (
          <View style={[styles.imageHeaderWrapper, { borderRadius: 16 }]}>
            <Image
              source={{ uri: currentPhotoUri }}
              style={[styles.attachedImage, { borderRadius: 16 }]}
              contentFit="cover"
              cachePolicy="memory-disk"
              accessibilityLabel="Attached note photo preview"
            />
            <View style={styles.imageActionRow}>
              <TouchableOpacity
                onPress={() => setShowImageSheet(true)}
                activeOpacity={0.7}
                style={[
                  styles.imagePillBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[typography.labelSmall, { color: colors.textPrimary }]}>
                  Change
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRemovePhoto}
                activeOpacity={0.7}
                style={[
                  styles.imagePillBtn,
                  { backgroundColor: colors.dangerLight, borderColor: 'transparent' },
                ]}
              >
                <Text style={[typography.labelSmall, { color: colors.danger }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowImageSheet(true)}
            activeOpacity={0.7}
            style={[
              styles.emptyImagePlaceholder,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
                borderRadius: 16,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add photo attachment"
          >
            <Ionicons name="camera-outline" size={26} color={colors.textTertiary} />
            <Text
              style={[
                typography.labelMedium,
                { color: colors.textSecondary, marginTop: 6 },
              ]}
            >
              Add Photo
            </Text>
          </TouchableOpacity>
        )}

        {/* Title Input */}
        <Input
          label="Title"
          placeholder="Note title"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (titleError) setTitleError(null);
          }}
          error={titleError}
          maxLength={APP_CONFIG.MAX_TITLE_LENGTH}
          showCounterNearLimit
          editable={!submitting}
          containerStyle={{ marginTop: spacing.md }}
        />

        {/* Category Chips */}
        <View style={styles.categorySection}>
          <Text
            style={[
              typography.labelMedium,
              { color: colors.textSecondary, marginBottom: 8 },
            ]}
          >
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Auto-growing Notes Input */}
        <Input
          label="Notes"
          placeholder="Write your note..."
          value={notes}
          onChangeText={(text) => {
            setNotes(text);
            if (notesError) setNotesError(null);
          }}
          error={notesError}
          multiline
          maxLength={APP_CONFIG.MAX_NOTES_LENGTH}
          showCounterNearLimit
          editable={!submitting}
        />
      </ScrollView>

      {/* Sticky Save Button Above Keyboard */}
      <View
        style={[
          styles.stickyFooter,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderSubtle,
            padding: spacing.md,
          },
        ]}
      >
        <Button
          label={submitting ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          disabled={!isFormValid || submitting || isProcessing}
          loading={submitting || isProcessing}
        />
      </View>

      <ActionSheet
        visible={showImageSheet}
        title="Photo Attachment"
        options={imageOptions}
        onClose={() => setShowImageSheet(false)}
      />

      <ConfirmDialog
        visible={showDiscardDialog}
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        isDestructive
        onConfirm={() => {
          setShowDiscardDialog(false);
          router.back();
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyImagePlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  imageHeaderWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
  },
  attachedImage: {
    width: '100%',
    height: '100%',
  },
  imageActionRow: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  imagePillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryRow: {
    paddingVertical: 2,
  },
  stickyFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
