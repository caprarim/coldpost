import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clock, dayLabel, nextSlot, withDate, withTime } from '../lib/format';
import { discard, pickVideos } from '../lib/media';
import { askForNotifications } from '../lib/notify';
import { useStore, type Draft } from '../lib/store';
import { useNow } from '../lib/useNow';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Field } from '../ui/Field';
import { goBack, Header } from '../ui/Header';
import { IconButton } from '../ui/IconButton';
import { accountColor, accountSoft, color, radius, space } from '../ui/theme';
import { Thumb } from '../ui/Thumb';
import { Txt } from '../ui/Txt';

const GAPS = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 120, label: '2 h' },
];

export default function Plan() {
  const { accounts, schedule } = useStore();
  const params = useLocalSearchParams<{ account?: string }>();
  const insets = useSafeAreaInsets();
  const now = useNow(15000);

  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [start, setStart] = useState(() => nextSlot(Date.now()));
  const [gap, setGap] = useState(30);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saved = useRef(false);
  const draftsRef = useRef<Draft[]>([]);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(
    () => () => {
      if (saved.current) return;
      for (const d of draftsRef.current) {
        discard(d.video);
        discard(d.thumb);
      }
    },
    [],
  );

  const fromParams = params.account && accounts.some((a) => a.id === params.account) ? params.account : undefined;
  const accountId = chosen ?? fromParams ?? (accounts.length === 1 ? accounts[0].id : undefined);
  const late = start < now + 60000;
  const count = drafts.length;
  const lastAt = start + Math.max(0, count - 1) * gap * 60000;

  const addVideos = async () => {
    setError(null);
    setPicking(true);
    try {
      const picks = await pickVideos();
      setDrafts((prev) => [...prev, ...picks.map((p) => ({ ...p, caption: '' }))]);
    } catch {
      setError("Couldn't load those videos");
    } finally {
      setPicking(false);
    }
  };

  const removeDraft = (key: string) => {
    const gone = drafts.find((d) => d.key === key);
    if (gone) {
      discard(gone.video);
      discard(gone.thumb);
    }
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  };

  const setCaption = (key: string, caption: string) => {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, caption } : d)));
  };

  const pickDate = () => {
    DateTimePickerAndroid.open({
      value: new Date(start),
      mode: 'date',
      minimumDate: new Date(),
      onChange: (event, date) => {
        if (event.type === 'set' && date) setStart((s) => withDate(s, date));
      },
    });
  };

  const pickTime = () => {
    DateTimePickerAndroid.open({
      value: new Date(start),
      mode: 'time',
      onChange: (event, date) => {
        if (event.type === 'set' && date) setStart((s) => withTime(s, date));
      },
    });
  };

  const save = async () => {
    if (!accountId || count === 0 || late || saving) return;
    setError(null);
    setSaving(true);
    await askForNotifications().catch(() => false);
    try {
      await schedule({ accountId, drafts, start, gapMinutes: gap });
      saved.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      goBack();
    } catch {
      setError("Couldn't save. Try again.");
      setSaving(false);
    }
  };

  const blocker = !accountId ? 'Pick an account' : count === 0 ? 'Add videos' : late ? 'Start time has passed' : null;

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.fill}>
      <Header title="Plan posts" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: space.xxl }]}
      >
        <View style={styles.section}>
          <Txt variant="caption" tone={color.muted}>
            Account
          </Txt>
          <View style={styles.wrap}>
            {accounts.map((a) => (
              <Chip
                key={a.id}
                label={a.handle}
                dot={accountColor(a.hue)}
                soft={accountSoft(a.hue)}
                selected={accountId === a.id}
                onPress={() => setChosen(a.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Txt variant="caption" tone={color.muted}>
            Videos
          </Txt>
          {drafts.map((draft, i) => (
            <View key={draft.key} style={styles.draft}>
              <Thumb uri={draft.thumb} width={64} />
              <View style={styles.draftBody}>
                <View style={styles.draftTop}>
                  <Txt variant="label" tone={color.accent} tabular>
                    {clock(start + i * gap * 60000)}
                  </Txt>
                  <IconButton name="close" label="Remove video" tone={color.muted} size={20} onPress={() => removeDraft(draft.key)} />
                </View>
                <Field
                  value={draft.caption}
                  onChangeText={(t) => setCaption(draft.key, t)}
                  placeholder="Caption"
                  multiline
                  maxLength={2200}
                  style={styles.caption}
                />
              </View>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add videos"
            onPress={addVideos}
            disabled={picking}
            style={({ pressed }) => [styles.addVideos, pressed ? styles.addPressed : null]}
          >
            <Ionicons name={picking ? 'hourglass-outline' : 'add'} size={22} color={color.ink} />
            <Txt variant="label">{picking ? 'Loading' : count ? 'Add more' : 'Add videos'}</Txt>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Txt variant="caption" tone={color.muted}>
            Start
          </Txt>
          <View style={styles.pair}>
            <Button kind="secondary" compact grow icon="calendar-outline" label={dayLabel(start, now)} onPress={pickDate} />
            <Button kind="secondary" compact grow icon="time-outline" label={clock(start)} onPress={pickTime} />
          </View>
        </View>

        <View style={styles.section}>
          <Txt variant="caption" tone={color.muted}>
            Gap
          </Txt>
          <View style={styles.segment}>
            {GAPS.map((g) => {
              const on = g.minutes === gap;
              return (
                <Pressable
                  key={g.minutes}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setGap(g.minutes)}
                  style={[styles.segmentItem, on ? styles.segmentOn : null]}
                >
                  <Txt variant="label" tone={on ? color.ink : color.muted}>
                    {g.label}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
          {count > 1 ? (
            <Txt variant="body" tone={color.muted}>
              Last one at {clock(lastAt)}
            </Txt>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.dock, { paddingBottom: insets.bottom + space.md }]}>
        {error || (blocker && count > 0) ? (
          <Txt variant="body" tone={color.primaryInk} style={styles.dockNote}>
            {error ?? blocker}
          </Txt>
        ) : null}
        <Button
          label={count > 1 ? `Schedule ${count} posts` : count === 1 ? 'Schedule post' : 'Schedule'}
          icon="checkmark"
          onPress={save}
          disabled={!!blocker}
          loading={saving}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.bg },
  scroll: { paddingHorizontal: space.lg, gap: space.xl },
  section: { gap: space.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  draft: { flexDirection: 'row', gap: space.md, paddingVertical: space.xs },
  draftBody: { flex: 1, gap: space.xs },
  draftTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: -space.sm },
  caption: { minHeight: 64 },
  addVideos: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    borderStyle: 'dashed',
  },
  addPressed: { backgroundColor: color.surface },
  pair: { flexDirection: 'row', gap: space.sm },
  segment: {
    flexDirection: 'row',
    padding: space.xs,
    gap: space.xs,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: { backgroundColor: color.raised },
  dock: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
    backgroundColor: color.bg,
  },
  dockNote: { textAlign: 'center' },
});
