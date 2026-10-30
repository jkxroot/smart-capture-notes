import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { APP_CONFIG } from '../utils/constants';

interface ImageAttachmentsProps {
  uris: string[];
  onAddPress: () => void;
  onRemoveAt: (index: number) => void;
  disabled?: boolean;
}

export const ImageAttachments = ({
  uris,
  onAddPress,
  onRemoveAt,
  disabled = false,
}: ImageAttachmentsProps) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const canAdd = uris.length < APP_CONFIG.MAX_IMAGES_PER_RECORD;

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.labelMedium, { color: colors.textSecondary, marginBottom: 8 }]}>
        Photos ({uris.length}/{APP_CONFIG.MAX_IMAGES_PER_RECORD})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {uris.map((uri, index) => (
          <View
            key={`${uri}-${index}`}
            style={[
              styles.thumbWrap,
              {
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surfaceMuted,
              },
            ]}
          >
            <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
            <TouchableOpacity
              onPress={() => onRemoveAt(index)}
              disabled={disabled}
              style={[styles.removeBtn, { backgroundColor: colors.danger }]}
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${index + 1}`}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}

        {canAdd ? (
          <TouchableOpacity
            onPress={onAddPress}
            disabled={disabled}
            style={[
              styles.addTile,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
                borderRadius: borderRadius.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            <Ionicons name="camera-outline" size={22} color={colors.textTertiary} />
            <Text style={[typography.labelSmall, { color: colors.textSecondary, marginTop: 4 }]}>
              Add
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  thumbWrap: {
    width: 96,
    height: 96,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: 96,
    height: 96,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
