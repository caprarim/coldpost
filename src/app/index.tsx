import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clock, countdown, dayKey, dayLabel, lateness } from '../lib/format';
import { notificationsAllowed } from '../lib/notify';
import { useStore, type Account, type Post } from '../lib/store';
import { useNow } from '../lib/useNow';
import { BrandMark } from '../ui/BrandMark';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Field } from '../ui/Field';
import { IconButton } from '../ui/IconButton';
import { accountColor, accountSoft, color, radius, space } from '../ui/theme';
import { Thumb } from '../ui/Thumb';
import { Txt } from '../ui/Txt';

function openPost(id: string) {
  router.push({ pathname: '/post/[id]', params: { id } });
}

export default function Home() {
  const { ready, accounts, posts } = useStore();
  const now = useNow();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [alertsOn, setAlertsOn] = useState(true);

  useFocusEffect(
    useCallback(() => {
      notificationsAllowed()
        .then(setAlertsOn)
        .catch(() => {});
    }, []),
  );

  const byId = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const active = filter && byId.has(filter) ? filter : null;

  const { due, days, done } = useMemo(() => {
    const visible = active ? posts.filter((p) => p.accountId === active) : posts;
    const queued = visible.filter((p) => p.status === 'queued').sort((a, b) => a.at - b.at);
    const upcoming = queued.filter((p) => p.at > now);
    const groups: { key: number; label: string; items: Post[] }[] = [];
    for (const post of upcoming) {
      const key = dayKey(post.at);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.items.push(post);
      else groups.push({ key, label: dayLabel(post.at, now), items: [post] });
    }
    return {
      due: queued.filter((p) => p.at <= now),
      days: groups,
      done: visible.filter((p) => p.status !== 'queued').sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)),
    };
  }, [posts, active, now]);

  if (!ready) return <View style={styles.fill} />;
  if (accounts.length === 0) return <Welcome />;

  const nothingQueued = due.length === 0 && days.length === 0;
  const firstUpcoming = days[0]?.items[0]?.id;

  return (
    <View style={styles.fill}>
      <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
        <View style={styles.brand}>
          <BrandMark size={22} />
          <Txt variant="title">ColdPost</Txt>
        </View>
        <IconButton name="people-outline" label="Accounts" onPress={() => router.push('/accounts')} />
      </View>

      {accounts.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipBar}>
          <Chip label="All" selected={active === null} onPress={() => setFilter(null)} />
          {accounts.map((a) => (
            <Chip
              key={a.id}
              label={a.handle}
              dot={accountColor(a.hue)}
              soft={accountSoft(a.hue)}
              selected={active === a.id}
              onPress={() => setFilter(a.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}>
        {!alertsOn && !nothingQueued ? (
          <Pressable style={styles.alert} onPress={() => Linking.openSettings()} accessibilityRole="button">
            <Ionicons name="notifications-off-outline" size={20} color={color.primaryInk} />
            <Txt variant="label" tone={color.ink} style={styles.flex}>
              Reminders are off
            </Txt>
            <Txt variant="label" tone={color.primaryInk}>
              Turn on
            </Txt>
          </Pressable>
        ) : null}

        {due.length > 0 ? (
          <View style={styles.section}>
            <Txt variant="caption" tone={color.primaryInk}>
              Post now
            </Txt>
            {due.map((post) => (
              <DueRow key={post.id} post={post} account={byId.get(post.accountId)} now={now} />
            ))}
          </View>
        ) : null}

        {days.map((group) => (
          <View key={group.key} style={styles.section}>
            <Txt variant="caption" tone={color.muted}>
              {group.label}
            </Txt>
            <View>
              {group.items.map((post) => (
                <UpcomingRow
                  key={post.id}
                  id={post.id}
                  at={post.at}
                  thumb={post.thumb}
                  caption={post.caption}
                  handle={byId.get(post.accountId)?.handle ?? ''}
                  hue={byId.get(post.accountId)?.hue ?? 0}
                  hint={post.id === firstUpcoming ? countdown(post.at, now) : null}
                />
              ))}
            </View>
          </View>
        ))}

        {nothingQueued ? (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={40} color={color.faint} />
            <Txt variant="title">Nothing planned</Txt>
          </View>
        ) : null}

        {done.length > 0 ? (
          <View style={styles.section}>
            <Pressable
              style={styles.doneToggle}
              onPress={() => setShowDone((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showDone }}
            >
              <Txt variant="caption" tone={color.muted}>
                Done {done.length}
              </Txt>
              <Ionicons name={showDone ? 'chevron-up' : 'chevron-down'} size={16} color={color.muted} />
            </Pressable>
            {showDone
              ? done.map((post) => (
                  <DoneRow
                    key={post.id}
                    id={post.id}
                    status={post.status}
                    thumb={post.thumb}
                    handle={byId.get(post.accountId)?.handle ?? ''}
                    time={clock(post.doneAt ?? post.at)}
                  />
                ))
              : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.dock, { paddingBottom: insets.bottom + space.md }]}>
        <Button
          label="Plan posts"
          icon="add"
          onPress={() => router.push(active ? { pathname: '/new', params: { account: active } } : '/new')}
        />
      </View>
    </View>
  );
}

function DueRow({ post, account, now }: { post: Post; account: Account | undefined; now: number }) {
  const tint = accountColor(account?.hue ?? 0);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openPost(post.id)}
      style={({ pressed }) => [styles.due, pressed ? styles.duePressed : null]}
    >
      <Thumb uri={post.thumb} width={54} />
      <View style={styles.flex}>
        <Txt variant="label" tone={tint} numberOfLines={1}>
          {account?.handle ?? ''}
        </Txt>
        <Txt variant="body" tone={color.muted} numberOfLines={1}>
          {lateness(post.at, now)}
          {post.total > 1 ? `   ${post.index + 1} of ${post.total}` : ''}
        </Txt>
      </View>
      <View style={styles.postPill}>
        <Txt variant="label" tone={color.onPrimary}>
          Post
        </Txt>
      </View>
    </Pressable>
  );
}

type UpcomingProps = {
  id: string;
  at: number;
  thumb: string | null;
  caption: string;
  handle: string;
  hue: number;
  hint: string | null;
};

const UpcomingRow = memo(function UpcomingRow({ id, at, thumb, caption, handle, hue, hint }: UpcomingProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openPost(id)}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.time}>
        <Txt variant="label" tabular>
          {clock(at)}
        </Txt>
        {hint ? (
          <Txt variant="caption" tone={color.accent} numberOfLines={1}>
            {hint}
          </Txt>
        ) : null}
      </View>
      <Thumb uri={thumb} width={36} rounded={8} />
      <View style={styles.flex}>
        <Txt variant="label" tone={accountColor(hue)} numberOfLines={1}>
          {handle}
        </Txt>
        {caption ? (
          <Txt variant="body" tone={color.muted} numberOfLines={1}>
            {caption}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
});

type DoneProps = { id: string; status: Post['status']; thumb: string | null; handle: string; time: string };

const DoneRow = memo(function DoneRow({ id, status, thumb, handle, time }: DoneProps) {
  const posted = status === 'posted';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openPost(id)}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <Ionicons
        name={posted ? 'checkmark-circle' : 'remove-circle-outline'}
        size={22}
        color={posted ? color.accent : color.faint}
      />
      <Thumb uri={thumb} width={28} rounded={6} dim />
      <Txt variant="body" tone={color.muted} numberOfLines={1} style={styles.flex}>
        {handle}
      </Txt>
      <Txt variant="body" tone={color.faint} tabular>
        {posted ? time : 'Skipped'}
      </Txt>
    </Pressable>
  );
});

function Welcome() {
  const { addAccount } = useStore();
  const insets = useSafeAreaInsets();
  const [handle, setHandle] = useState('');

  const add = () => {
    if (addAccount(handle)) {
      Haptics.selectionAsync().catch(() => {});
      setHandle('');
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.fill}>
      <View style={[styles.welcome, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl }]}>
        <BrandMark size={56} />
        <View style={styles.welcomeText}>
          <Txt variant="heading">Add a TikTok account</Txt>
          <Txt variant="body" tone={color.muted}>
            Just the handle. No login.
          </Txt>
        </View>
        <Field
          value={handle}
          onChangeText={setHandle}
          placeholder="@handle"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <Button label="Add account" icon="add" onPress={add} disabled={!handle.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.bg },
  flex: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: space.lg,
    paddingRight: space.sm,
    paddingBottom: space.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  chipBar: { flexGrow: 0 },
  chips: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.xl },
  section: { gap: space.sm },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.primarySoft,
  },
  due: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  duePressed: { backgroundColor: color.raised },
  postPill: {
    height: 40,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 76,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    marginHorizontal: -space.sm,
    borderRadius: radius.md,
  },
  rowPressed: { backgroundColor: color.surface },
  time: { width: 84 },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: 72 },
  doneToggle: { flexDirection: 'row', alignItems: 'center', gap: space.xs, height: 32 },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: color.scrim,
  },
  welcome: { flex: 1, paddingHorizontal: space.xl, justifyContent: 'center', gap: space.lg },
  welcomeText: { gap: space.xs, marginTop: space.md, marginBottom: space.sm },
});
