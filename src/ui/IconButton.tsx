import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { color, radius } from './theme';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  tone?: string;
  size?: number;
};

export function IconButton({ name, label, onPress, tone = color.ink, size = 24 }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed ? styles.pressed : null]}
    >
      <Ionicons name={name} size={size} color={tone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: color.raised },
});
