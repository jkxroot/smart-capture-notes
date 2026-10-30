import { useState, useEffect, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useRecords } from '../../../src/context/RecordsContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { useToast } from '../../../src/context/ToastContext';
import { storageService } from '../../../src/services/storageService';
import { useImagePicker } from '../../../src/hooks/useImagePicker';
import { Screen } from '../../../src/components/Screen';
import { Input } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { Chip } from '../../../src/components/Chip';
import { ActionSheet, ActionOption } from '../../../src/components/ActionSheet';
import { ConfirmDialog } from '../../../src/components/ConfirmDialog';
import { ImageAttachments } from '../../../src/components/ImageAttachments';
import { Category, CATEGORIES } from '../../../src/types/record';
import { validateRecordTitle, validateRecordNotes } from '../../../src/utils/validation';
import { APP_CONFIG } from '../../../src/utils/constants';
import { getRecordImagePaths } from '../../../src/utils/images';

export default function EditRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecordById, updateRecord } = useRecords();
  const { colors, typography, spacing } = useTheme();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [initialTitle, setInitialTitle] = useState('');
  const [initialNotes, setInitialNotes] = useState('');
  const [initialCategory, setInitialCategory] = useState<Category>('Personal');

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<Category>('Personal');

  const [retainedRemotePaths, setRetainedRemotePaths] = useState<string[]>([]);
  const [remotePreviewUris, setRemotePreviewUris] = useState<string[]>([]);
  const initialRemoteCountRef = useRef(0);

  const [titleError, setTitleError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [showImageSheet, setShowImageSheet] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const {
    selectedImageUris,
    isProcessing,
    takePhoto,
    pickFromGallery,
    removeAt,
    clearImages,
  } = useImagePicker();

  useEffect(() => {
    let isMounted = true;
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    getRecordById(id)
      .then((record) => {
        if (!isMounted) return;
        if (!record) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setTitle(record.title);
        setInitialTitle(record.title);
        setNotes(record.notes || '');
        setInitialNotes(record.notes || '');
        setCategory(record.category);
        setInitialCategory(record.category);

        const paths = getRecordImagePaths(record);
        initialRemoteCountRef.current = paths.length;
        setRetainedRemotePaths(paths);
        if (paths.length > 0) {
          Promise.all(paths.map((path) => storageService.getSignedUrl(path))).then((results) => {
            if (!isMounted) return;
            setRemotePreviewUris(results.map((r) => r.url).filter(Boolean) as string[]);
          });
        } else {
          setRemotePreviewUris([]);
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, getRecordById]);

  const hasUnsavedChanges =
    title !== initialTitle ||
    notes !== initialNotes ||
    category !== initialCategory ||
    selectedImageUris.length > 0 ||
    retainedRemotePaths.length !== initialRemoteCountRef.current;

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

  const handleSave = async () => {
    if (!id || submitting || isProcessing) return;

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
      const removeAll =
        retainedRemotePaths.length === 0 &&
        selectedImageUris.length === 0 &&
        initialRemoteCountRef.current > 0;

      const result = await updateRecord(
        id,
        {
          title: title.trim(),
          notes: notes.trim() ? notes.trim() : null,
          category,
        },
        selectedImageUris,
        removeAll,
        retainedRemotePaths
      );

      if (result.success) {
        showToast(
          result.record?.sync_status === 'pending' ? 'Note saved offline.' : 'Note updated.',
          'success'
        );
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

  if (notFound) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <View style={[styles.centerContainer, { padding: spacing.xxl }]}>
          <Ionicons name="document-text-outline" size={40} color={colors.textTertiary} />
          <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 12 }]}>
            Record Not Found
          </Text>
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
            ]}
          >
            This note may have been deleted or does not exist.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.surfaceMuted,
                borderRadius: 12,
                marginTop: 16,
              },
            ]}
          >
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const isFormValid = title.trim().length >= 1 && title.trim().length <= APP_CONFIG.MAX_TITLE_LENGTH;
  const displayUris = [...remotePreviewUris, ...selectedImageUris];

  const handleRemoveAttachment = (index: number) => {
    if (index < retainedRemotePaths.length) {
      setRetainedRemotePaths((prev) => prev.filter((_, i) => i !== index));
      setRemotePreviewUris((prev) => prev.filter((_, i) => i !== index));
    } else {
      removeAt(index - retainedRemotePaths.length);
    }
  };

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

  if (displayUris.length > 0) {
    imageOptions.push({
      label: 'Remove All Photos',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => {
        clearImages();
        setRetainedRemotePaths([]);
        setRemotePreviewUris([]);
      },
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
        <ImageAttachments
          uris={displayUris}
          onAddPress={() => setShowImageSheet(true)}
          onRemoveAt={handleRemoveAttachment}
          disabled={submitting || isProcessing}
        />

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
          containerStyle={{ marginTop: spacing.sm }}
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
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
