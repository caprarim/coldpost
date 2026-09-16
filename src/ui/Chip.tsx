import { Pressable, StyleSheet, View } from 'react-native';
import { color, radius, space } from './theme';
import { Txt } from './Txt';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  dot?: string;
  soft?: string;
};

export function Chip({ label, selected, onPress, dot, soft }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? { backgroundColor: soft ?? color.raised, borderColor: dot ?? color.ink } : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      <Txt variant="label" tone={selected ? color.ink : color.muted} numberOfLines={1}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pressed: { transform: [{ scale: 0.97 }] },
});
