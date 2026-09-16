import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { color, radius } from './theme';

type Props = { uri: string | null; width: number; rounded?: number; dim?: boolean };

export function Thumb({ uri, width, rounded = radius.sm, dim }: Props) {
  const box = { width, height: Math.round((width * 16) / 9), borderRadius: rounded };
  return (
    <View style={[styles.base, box, dim ? styles.dim : null]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={uri} transition={120} />
      ) : (
        <Ionicons name="film-outline" size={Math.max(16, width / 3)} color={color.faint} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: color.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.45 },
});
