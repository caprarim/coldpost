import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './IconButton';
import { space } from './theme';
import { Txt } from './Txt';

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

type Props = { title?: string; right?: ReactNode };

export function Header({ title, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + space.sm }]}>
      <IconButton name="arrow-back" label="Back" onPress={goBack} />
      <Txt variant="title" style={styles.title} numberOfLines={1}>
        {title ?? ''}
      </Txt>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
  },
  title: { flex: 1 },
  right: { minWidth: 44, alignItems: 'flex-end' },
});
