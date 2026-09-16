import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../lib/store';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Header } from '../ui/Header';
import { IconButton } from '../ui/IconButton';
import { accountColor, color, radius, space } from '../ui/theme';
import { Txt } from '../ui/Txt';

export default function Accounts() {
  const { accounts, posts, addAccount, recolorAccount, removeAccount } = useStore();
  const insets = useSafeAreaInsets();
  const [handle, setHandle] = useState('');
  const [armed, setArmed] = useState<string | null>(null);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(null), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  const queued = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) {
      if (p.status === 'queued') counts.set(p.accountId, (counts.get(p.accountId) ?? 0) + 1);
    }
    return counts;
  }, [posts]);

  const add = () => {
    if (addAccount(handle)) {
      Haptics.selectionAsync().catch(() => {});
      setHandle('');
    }
  };

  const remove = async (id: string) => {
    if (armed !== id) {
      setArmed(id);
      return;
    }
    setArmed(null);
    await removeAccount(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.fill}>
      <Header title="Accounts" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.xl }]}
      >
        {accounts.map((a) => {
          const count = queued.get(a.id) ?? 0;
          return (
            <View key={a.id} style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Change color for ${a.handle}`}
                onPress={() => recolorAccount(a.id)}
                hitSlop={8}
                style={({ pressed }) => [styles.swatch, { backgroundColor: accountColor(a.hue) }, pressed ? styles.swatchPressed : null]}
              />
              <View style={styles.flex}>
                <Txt variant="label" numberOfLines={1}>
                  {a.handle}
                </Txt>
                <Txt variant="body" tone={color.muted}>
                  {count ? `${count} queued` : 'Nothing queued'}
                </Txt>
              </View>
              {armed === a.id ? (
                <Button kind="danger" compact icon="trash-outline" label="Delete" onPress={() => remove(a.id)} />
              ) : (
                <IconButton name="trash-outline" label={`Delete ${a.handle}`} tone={color.muted} onPress={() => remove(a.id)} />
              )}
            </View>
          );
        })}

        <View style={styles.add}>
          <Field
            value={handle}
            onChangeText={setHandle}
            placeholder="@handle"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={add}
            style={styles.flex}
          />
          <Button compact icon="add" label="Add" onPress={add} disabled={!handle.trim()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.lg, gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 72,
    paddingLeft: space.lg,
    paddingRight: space.sm,
    borderRadius: radius.md,
    backgroundColor: color.surface,
  },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  swatchPressed: { transform: [{ scale: 0.9 }] },
  add: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
});
