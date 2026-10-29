import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordItem } from '../types/record';
import { useTheme } from '../context/ThemeContext';
import { storageService } from '../services/storageService';
import { formatDate } from '../utils/formatDate';

interface RecordCardProps {
  record: RecordItem;
  onPress: () => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({ record, onPress }) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(Boolean(record.image_path));
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!record.image_path) {
      setImageUrl(null);
      setImageLoading(false);
      return;
    }

    setImageLoading(true);
    setImageError(false);

    storageService
      .getSignedUrl(record.image_path)
      .then(({ url, error }) => {
        if (isMounted) {
          if (error || !url) {
            setImageError(true);
            setImageUrl(null);
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

    return () => {
      isMounted = false;
    };
  }, [record.image_path]);

  const categoryColor =
    colors.categoryColors[record.category] || colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        shadows.sm,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Record: ${record.title}, Category: ${record.category}, Date: ${formatDate(record.created_at)}`}
    >
      <View style={styles.contentRow}>
        {/* Thumbnail on left */}
        <View
          style={[
            styles.thumbnailContainer,
            {
              backgroundColor: colors.surfaceMuted,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          {record.image_path ? (
            imageLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : imageError || !imageUrl ? (
              <Ionicons name="image-outline" size={24} color={colors.textTertiary} />
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={[styles.thumbnail, { borderRadius: borderRadius.md }]}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            )
          ) : (
            <Ionicons name="document-text-outline" size={24} color={colors.textTertiary} />
          )}
        </View>

        {/* Info on right */}
        <View style={styles.infoCol}>
          {/* Header with Title and Category Badge */}
          <View style={styles.topRow}>
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
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: categoryColor,
                  borderRadius: borderRadius.pill,
                },
              ]}
            >
              <Text style={[styles.badgeText, typography.labelSmall, { color: '#FFFFFF' }]}>
                {record.category}
              </Text>
            </View>
          </View>

          {/* Notes preview if available */}
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

          {/* Bottom metadata */}
          <View style={styles.bottomRow}>
            <View style={styles.dateRow}>
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.textTertiary}
                style={styles.timeIcon}
              />
              <Text
                style={[
                  styles.dateText,
                  typography.caption,
                  { color: colors.textTertiary },
                ]}
              >
                {formatDate(record.created_at)}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 10,
  },
  notesPreview: {
    marginBottom: 6,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
  },
  dateText: {},
});
