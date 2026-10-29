import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRecords } from '../../../src/context/RecordsContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { useToast } from '../../../src/context/ToastContext';
import { storageService } from '../../../src/services/storageService';
import { shareService } from '../../../src/services/shareService';
import { Screen } from '../../../src/components/Screen';
import { IconButton } from '../../../src/components/IconButton';
import { ConfirmDialog } from '../../../src/components/ConfirmDialog';
import { ActionSheet } from '../../../src/components/ActionSheet';
import { ImageViewer } from '../../../src/components/ImageViewer';
import { ShareCard } from '../../../src/components/ShareCard';
import { formatFullDateTime } from '../../../src/utils/formatDate';
import { RecordItem } from '../../../src/types/record';

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecordById, deleteRecord, togglePin } = useRecords();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { showToast } = useToast();

  const [record, setRecord] = useState<RecordItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [preparingShare, setPreparingShare] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const shareCardRef = useRef<React.ElementRef<typeof View>>(null);

  const loadRecord = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const item = await getRecordById(id);
    setRecord(item);
    setLoading(false);

    if (item?.image_path) {
      const { url, error } = await storageService.getSignedUrl(item.image_path);
      if (error || !url) {
        setImageError(true);
      } else {
        setImageUrl(url);
      }
    }
  }, [id, getRecordById]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    const result = await deleteRecord(id);
    setDeleting(false);
    setShowDeleteDialog(false);

    if (result.success) {
      showToast('Note deleted.', 'info');
      router.back();
    } else {
      showToast(result.error || 'Failed to delete note.', 'error');
    }
  };

  const handleShareImageCard = async () => {
    if (!record || preparingShare) return;
    setPreparingShare(true);
    showToast('Preparing share card...', 'info');

    try {
      // If note has an image and it hasn't loaded yet, give a brief moment to load
      if (record.image_path && imageUrl && !imageLoaded && !imageError) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      const result = await shareService.shareImageCard(shareCardRef, record.title);
      if (!result.success && result.error) {
        showToast(result.error, 'error');
      }
    } finally {
      setPreparingShare(false);
    }
  };

  const handleShareText = async () => {
    if (!record || preparingShare) return;
    setPreparingShare(true);
    try {
      const result = await shareService.shareText(record);
      if (!result.success && result.error) {
        showToast(result.error, 'error');
      }
    } finally {
      setPreparingShare(false);
    }
  };

  const handleTogglePin = async () => {
    if (!record) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const result = await togglePin(record.id);
    if (result.success) {
      setRecord((prev) => (prev ? { ...prev, is_pinned: !prev.is_pinned } : null));
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

  if (!record) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <View style={[styles.centerContainer, { padding: spacing.xxl }]}>
          <Ionicons name="document-text-outline" size={40} color={colors.textTertiary} />
          <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 12 }]}>
            Record Not Found
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 6, textAlign: 'center' }]}>
            This note may have been deleted or does not exist.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.md, marginTop: 16 }]}
          >
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* Top Header Navigation */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle, paddingHorizontal: spacing.md }]}>
        <IconButton
          name="chevron-back"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        />

        <View style={styles.headerRightActions}>
          <IconButton
            name={record.is_pinned ? 'pin' : 'pin-outline'}
            color={record.is_pinned ? colors.accent : colors.textPrimary}
            accessibilityLabel={record.is_pinned ? 'Unpin note' : 'Pin note'}
            onPress={handleTogglePin}
          />
          <IconButton
            name="share-outline"
            accessibilityLabel="Share note"
            onPress={() => setShowShareSheet(true)}
            disabled={preparingShare}
          />
          <IconButton
            name="create-outline"
            accessibilityLabel="Edit note"
            onPress={() => router.push(`/(app)/edit/${record.id}`)}
          />
          <IconButton
            name="trash-outline"
            color={colors.danger}
            accessibilityLabel="Delete note"
            onPress={() => setShowDeleteDialog(true)}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Image (Full width, 4:3 ratio, rounded bottom corners) */}
        {record.image_path ? (
          <TouchableOpacity
            onPress={() => {
              if (imageUrl) setShowImageViewer(true);
            }}
            activeOpacity={0.9}
            style={[
              styles.heroImageContainer,
              {
                backgroundColor: colors.surfaceMuted,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tap to view full screen photo"
          >
            {imageError || !imageUrl ? (
              <View style={styles.imageFallback}>
                <Ionicons name="image-outline" size={36} color={colors.textSecondary} />
                <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 6 }]}>
                  Photo unavailable
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={styles.heroImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
                accessibilityLabel="Attached note photo"
              />
            )}
          </TouchableOpacity>
        ) : null}

        <View style={[styles.bodyContent, { paddingHorizontal: spacing.lg }]}>
          {/* Category & Date Metadata */}
          <View style={styles.metaRow}>
            <Text style={[typography.labelMedium, { color: colors.accent, fontWeight: '600' }]}>
              {record.category}
            </Text>
            <Text style={[styles.dot, { color: colors.textTertiary }]}>·</Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {formatFullDateTime(record.created_at)}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, typography.h2, { color: colors.textPrimary }]}>
            {record.title}
          </Text>

          {/* Notes Body */}
          <Text
            style={[
              styles.notesBody,
              typography.bodyLarge,
              { color: record.notes ? colors.textPrimary : colors.textTertiary },
            ]}
          >
            {record.notes || 'No notes written.'}
          </Text>
        </View>
      </ScrollView>

      {/* Fullscreen Photo Viewer */}
      <ImageViewer
        visible={showImageViewer}
        uri={imageUrl}
        onClose={() => setShowImageViewer(false)}
      />

      {/* Share Options ActionSheet */}
      <ActionSheet
        visible={showShareSheet}
        title="Share Note"
        options={[
          {
            label: 'Share as image card',
            icon: 'image-outline',
            onPress: handleShareImageCard,
          },
          {
            label: 'Share as text',
            icon: 'text-outline',
            onPress: handleShareText,
          },
        ]}
        onClose={() => setShowShareSheet(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Note"
        message="Are you sure you want to permanently delete this note and its photo?"
        confirmLabel="Delete"
        isDestructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {/* Off-screen rendered ShareCard for view-shot capturing */}
      <View
        pointerEvents="none"
        style={styles.offscreenShare}
      >
        <ShareCard
          ref={shareCardRef}
          record={record}
          imageUrl={record.image_path && !imageError ? imageUrl : null}
          onImageLoaded={() => setImageLoaded(true)}
          onImageError={() => setImageLoaded(false)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroImageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContent: {
    paddingTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    marginHorizontal: 6,
    fontSize: 10,
  },
  title: {
    marginBottom: 16,
  },
  notesBody: {
    lineHeight: 25,
  },
  offscreenShare: {
    position: 'absolute',
    left: -10000,
    top: 0,
    opacity: 0,
  },
});
