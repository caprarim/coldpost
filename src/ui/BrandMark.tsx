import { StyleSheet, View } from 'react-native';
import { color, oklch } from './theme';

const second = oklch(0.42, 0, 0);
const third = oklch(0.32, 0, 0);

export function BrandMark({ size = 28 }: { size?: number }) {
  const bar = Math.round(size * 0.24);
  const gap = Math.round(size * 0.1);
  return (
    <View style={[styles.stack, { width: size, gap }]}>
      <View style={{ width: size, height: bar, borderRadius: bar / 2, backgroundColor: color.primary }} />
      <View style={{ width: size * 0.76, height: bar, borderRadius: bar / 2, backgroundColor: second }} />
      <View style={{ width: size * 0.52, height: bar, borderRadius: bar / 2, backgroundColor: third }} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { alignItems: 'flex-start' },
});
