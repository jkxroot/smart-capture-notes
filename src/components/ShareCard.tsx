import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { RecordItem } from '../types/record';
import { lightColors } from '../theme/colors';
import { formatDate } from '../utils/formatDate';

interface ShareCardProps {
  record: RecordItem;
  imageUrl?: string | null;
  onImageLoaded?: () => void;
  onImageError?: () => void;
}

export const SHARE_CARD_WIDTH = 360; // 1080 / 3 logical px

export const ShareCard = forwardRef<React.ElementRef<typeof View>, ShareCardProps>(
  ({ record, imageUrl, onImageLoaded, onImageError }, ref) => {
    // Truncate notes to ~600 chars with ellipsis if cut
    const rawNotes = (record.notes || '').trim();
    const displayNotes =
      rawNotes.length > 600 ? rawNotes.slice(0, 597).trim() + '...' : rawNotes;

    return (
      <View
        ref={ref}
        collapsable={false}
        style={styles.card}
      >
        {/* Photo block on top (4:3 cover, rounded top corners) */}
        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              onLoad={onImageLoaded}
              onError={onImageError}
            />
          </View>
        ) : null}

        {/* Content Body */}
        <View style={styles.body}>
          {/* Category & Date badge row */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{record.category}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(record.created_at)}</Text>
          </View>

          {/* Title (bold, up to 3 lines) */}
          <Text style={styles.title} numberOfLines={3}>
            {record.title}
          </Text>

          {/* Notes body */}
          {displayNotes ? (
            <Text style={styles.notes}>
              {displayNotes}
            </Text>
          ) : null}

          {/* Footer Divider & Brand Wordmark */}
          <View style={styles.divider} />
          <View style={styles.footerRow}>
            <Text style={styles.brandText}>Smart Capture</Text>
          </View>
        </View>
      </View>
    );
  }
);

ShareCard.displayName = 'ShareCard';

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    backgroundColor: lightColors.surface,
    borderColor: lightColors.border,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  imageContainer: {
    width: SHARE_CARD_WIDTH,
    height: Math.round(SHARE_CARD_WIDTH * 0.75), // 4:3 ratio (270px)
    backgroundColor: lightColors.surfaceMuted,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: 20,
    backgroundColor: lightColors.surface,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: lightColors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  categoryText: {
    color: lightColors.accent,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dateText: {
    color: lightColors.textTertiary,
    fontSize: 12,
    fontWeight: '400',
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: lightColors.textPrimary,
    marginBottom: 10,
  },
  notes: {
    fontSize: 14,
    lineHeight: 21,
    color: lightColors.textSecondary,
    marginBottom: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: lightColors.borderSubtle,
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  brandText: {
    fontSize: 11,
    fontWeight: '600',
    color: lightColors.textTertiary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
