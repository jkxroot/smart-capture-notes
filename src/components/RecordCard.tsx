import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RecordItem } from '../types/record';
import { useTheme } from '../context/ThemeContext';
import { storageService } from '../services/storageService';
import { formatDate } from '../utils/formatDate';

interface RecordCardProps {
  record: RecordItem;
  onPress: () => void;
  onTogglePin?: () => void;
  isWide?: boolean;
}

export const RecordCard = ({
  record,
  onPress,
  onTogglePin,
  isWide = false,
}: RecordCardProps) => {
  const { colors, typography, spacing } = useTheme();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!record.image_path) {
      setImageUrl(null);
      return;
    }

    setImageError(false);
    storageService
      .getSignedUrl(record.image_path)
      .then(({ url, error }) => {
        if (isMounted) {
          if (error || !url) {
            setImageError(true);
          } else {
            setImageUrl(url);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setImageError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [record.image_path]);

  // Wide screen layout (2 columns): Image-first card with 4:3 cover image on top
  if (isWide) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.wideCard,
          {
            backgroundColor: colors.surface,
            borderColor: record.is_pinned ? colors.accent : colors.border,
            borderRadius: 14,
            marginBottom: spacing.md,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${record.is_pinned ? 'Pinned note: ' : 'Note: '}${record.title}, Category: ${record.category}`}
      >
        {/* 4:3 Cover Image on Top */}
        <View style={[styles.wideImageContainer, { backgroundColor: colors.surfaceMuted }]}>
          {record.image_path && !imageError ? (
            <Image
              source={imageUrl ? { uri: imageUrl } : undefined}
              style={styles.wideImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => setImageError(true)}
              accessibilityLabel="Note photo"
            />
          ) : (
            <View style={styles.centerPlaceholder}>
              <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
            </View>
          )}
        </View>

        {/* Content Body Below Image */}
        <View style={[styles.wideBody, { padding: spacing.md }]}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                typography.labelLarge,
                { color: colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {record.title}
            </Text>

            {onTogglePin ? (
              <TouchableOpacity
                onPress={onTogglePin}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={record.is_pinned ? 'Unpin note' : 'Pin note'}
              >
                <Ionicons
                  name={record.is_pinned ? 'pin' : 'pin-outline'}
                  size={16}
                  color={record.is_pinned ? colors.accent : colors.textTertiary}
                  style={styles.pinIcon}
                />
              </TouchableOpacity>
            ) : record.is_pinned ? (
              <Ionicons
                name="pin"
                size={14}
                color={colors.accent}
                style={styles.pinIcon}
              />
            ) : null}
          </View>

          {record.notes ? (
            <Text
              style={[
                styles.notesPreview,
                typography.bodySmall,
                { color: colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {record.notes}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={[typography.caption, { color: colors.accent, fontWeight: '600' }]}>
              {record.category}
            </Text>
            <Text style={[styles.dot, { color: colors.textTertiary }]}>·</Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {formatDate(record.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Phone / Standard Single-Column Layout: 84x84 fixed rounded thumbnail on left
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: record.is_pinned ? colors.accent : colors.border,
          borderRadius: 14,
          padding: spacing.md,
          marginBottom: spacing.sm + 2,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${record.is_pinned ? 'Pinned note: ' : 'Note: '}${record.title}, Category: ${record.category}`}
    >
      <View style={styles.row}>
        {/* Fixed 84x84 rounded thumbnail */}
        <View
          style={[
            styles.thumbnailWrap,
            {
              backgroundColor: colors.surfaceMuted,
            },
          ]}
        >
          {record.image_path && !imageError ? (
            <Image
              source={imageUrl ? { uri: imageUrl } : undefined}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => setImageError(true)}
              accessibilityLabel="Note thumbnail"
            />
          ) : (
            <Ionicons
              name="image-outline"
              size={24}
              color={colors.textSecondary}
            />
          )}
        </View>

        {/* Content on right */}
        <View style={styles.contentCol}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                typography.labelLarge,
                { color: colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {record.title}
            </Text>

            {onTogglePin ? (
              <TouchableOpacity
                onPress={onTogglePin}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={record.is_pinned ? 'Unpin note' : 'Pin note'}
              >
                <Ionicons
                  name={record.is_pinned ? 'pin' : 'pin-outline'}
                  size={16}
                  color={record.is_pinned ? colors.accent : colors.textTertiary}
                  style={styles.pinIcon}
                />
              </TouchableOpacity>
            ) : record.is_pinned ? (
              <Ionicons
                name="pin"
                size={14}
                color={colors.accent}
                style={styles.pinIcon}
              />
            ) : null}
          </View>

          {record.notes ? (
            <Text
              style={[
                styles.notesPreview,
                typography.bodySmall,
                { color: colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {record.notes}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={[typography.caption, { color: colors.accent, fontWeight: '600' }]}>
              {record.category}
            </Text>
            <Text style={[styles.dot, { color: colors.textTertiary }]}>·</Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {formatDate(record.created_at)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Phone layout styles
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailWrap: {
    width: 84,
    height: 84,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    marginRight: 6,
  },
  pinIcon: {
    marginLeft: 4,
  },
  notesPreview: {
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    marginHorizontal: 6,
    fontSize: 10,
  },

  // Wide layout styles
  wideCard: {
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    overflow: 'hidden',
  },
  wideImageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    overflow: 'hidden',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  wideImage: {
    width: '100%',
    height: '100%',
  },
  centerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideBody: {
    width: '100%',
  },
});
