import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { color, radius, space } from './theme';
import { Txt } from './Txt';

type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  kind?: 'primary' | 'secondary' | 'danger';
  compact?: boolean;
  grow?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ label, icon, onPress, kind = 'primary', compact, grow, disabled, loading }: Props) {
  const inactive = !!disabled || !!loading;
  const fg = kind === 'primary' ? color.onPrimary : kind === 'danger' ? color.primaryInk : color.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.full,
        grow ? styles.grow : null,
        styles[kind],
        pressed ? pressedFill[kind] : null,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={compact ? 18 : 20} color={fg} /> : null}
          <Txt variant="label" tone={fg} numberOfLines={1}>
            {label}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  full: { height: 56, alignSelf: 'stretch' },
  compact: { height: 48, paddingHorizontal: space.lg },
  grow: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  primary: { backgroundColor: color.primary },
  secondary: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line },
  danger: { backgroundColor: color.primarySoft },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.4 },
});

const pressedFill = StyleSheet.create({
  primary: { backgroundColor: color.primaryPressed },
  secondary: { backgroundColor: color.raised },
  danger: { backgroundColor: color.raised },
});
