import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecords } from '../../../src/context/RecordsContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { useToast } from '../../../src/context/ToastContext';
import { storageService } from '../../../src/services/storageService';
import { shareService } from '../../../src/services/shareService';
import { ConfirmDialog } from '../../../src/components/ConfirmDialog';
import { formatFullDateTime } from '../../../src/utils/formatDate';
import { RecordItem } from '../../../src/types/record';
import { CATEGORY_ICONS } from '../../../src/utils/constants';

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecordById, deleteRecord } = useRecords();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { showToast } = useToast();

  const [record, setRecord] = useState<RecordItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    setLoading(true);
    getRecordById(id)
      .then((item) => {
        if (isMounted) {
          setRecord(item);
          setLoading(false);
          if (item?.image_path) {
            setImageLoading(true);
            storageService
              .getSignedUrl(item.image_path)
              .then(({ url, error }) => {
                if (isMounted) {
                  if (error || !url) {
                    setImageError(true);
                  } else {
                    setImageUrl(url);
                  }
                  setImageLoading(false);
                }
              })
              .catch(() => {
                if (isMounted) {
                  setImageError(true);
                  setImageLoading(false);
                }
              });
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, getRecordById]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    const result = await deleteRecord(id);
    setDeleting(false);
    setShowDeleteDialog(false);

    if (result.success) {
      showToast('Record deleted successfully.', 'success');
      router.back();
    } else {
      showToast(result.error || 'Failed to delete record.', 'error');
    }
  };

  const handleShare = async () => {
    if (!record) return;
    setSharing(true);
    const result = await shareService.shareRecord(record);
    setSharing(false);
    if (!result.success && result.error) {
      showToast(result.error, 'error');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.notFoundText, typography.h3, { color: colors.textPrimary, marginTop: 12 }]}>
          Record Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.md, marginTop: 16 }]}
        >
          <Text style={[typography.labelLarge, { color: colors.primaryForeground }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryColor =
    colors.categoryColors[record.category] || colors.primary;
  const categoryIcon = CATEGORY_ICONS[record.category] || 'folder-outline';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Attached Photo */}
        {record.image_path ? (
          <View
            style={[
              styles.imageContainer,
              shadows.sm,
              {
                backgroundColor: colors.surfaceMuted,
                borderRadius: borderRadius.lg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {imageLoading ? (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[
                    styles.imagePlaceholderText,
                    typography.caption,
                    { color: colors.textTertiary, marginTop: 8 },
                  ]}
                >
                  Loading photo securely...
                </Text>
              </View>
            ) : imageError || !imageUrl ? (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
                <Text
                  style={[
                    styles.imagePlaceholderText,
                    typography.caption,
                    { color: colors.textTertiary, marginTop: 8 },
                  ]}
                >
                  Photo unavailable
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={[styles.fullImage, { borderRadius: borderRadius.lg }]}
                resizeMode="cover"
                onError={() => setImageError(true)}
                accessibilityLabel="Full record image"
              />
            )}
          </View>
        ) : null}

        {/* Metadata Card */}
        <View
          style={[
            styles.card,
            shadows.sm,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.lg,
              borderColor: colors.cardBorder,
              padding: spacing.lg,
              marginTop: record.image_path ? spacing.md : 0,
            },
          ]}
        >
          {/* Category Badge & Date Header */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: categoryColor,
                  borderRadius: borderRadius.pill,
                },
              ]}
            >
              <Ionicons
                name={categoryIcon as keyof typeof Ionicons.glyphMap}
                size={14}
                color="#FFFFFF"
                style={styles.badgeIcon}
              />
              <Text style={[styles.badgeText, typography.labelSmall, { color: '#FFFFFF' }]}>
                {record.category}
              </Text>
            </View>

            <Text style={[styles.dateText, typography.caption, { color: colors.textTertiary }]}>
              {formatFullDateTime(record.created_at)}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, typography.h2, { color: colors.textPrimary }]}>
            {record.title}
          </Text>

          {/* Notes Content */}
          <View style={[styles.notesSection, { borderTopColor: colors.borderSubtle }]}>
            <Text
              style={[
                styles.notesText,
                typography.bodyLarge,
                { color: record.notes ? colors.textPrimary : colors.textTertiary },
              ]}
            >
              {record.notes || 'No detailed notes provided for this record.'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => router.push(`/(app)/edit/${record.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Edit record"
          >
            <Ionicons name="create-outline" size={18} color={colors.textPrimary} style={styles.btnIcon} />
            <Text style={[styles.btnText, typography.labelMedium, { color: colors.textPrimary }]}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={handleShare}
            disabled={sharing}
            accessibilityRole="button"
            accessibilityLabel="Share record"
          >
            {sharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={colors.textPrimary}
                  style={styles.btnIcon}
                />
                <Text style={[styles.btnText, typography.labelMedium, { color: colors.textPrimary }]}>
                  Share
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.errorBackground,
                borderColor: colors.error,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => setShowDeleteDialog(true)}
            accessibilityRole="button"
            accessibilityLabel="Delete record"
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} style={styles.btnIcon} />
            <Text style={[styles.btnText, typography.labelMedium, { color: colors.error }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Record"
        message="Are you sure you want to permanently delete this record and its attached photo? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {},
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  imageContainer: {
    width: '100%',
    height: 260,
    overflow: 'hidden',
    borderWidth: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {},
  card: {
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    fontWeight: '600',
  },
  dateText: {},
  title: {
    marginBottom: 16,
  },
  notesSection: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  notesText: {
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 12,
  },
  btnIcon: {
    marginRight: 6,
  },
  btnText: {
    fontWeight: '600',
  },
});
