import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clock, countdown, lateness } from '../../lib/format';
import { fileExists } from '../../lib/media';
import { copyCaption, openInTikTok } from '../../lib/share';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/useNow';
import { Button } from '../../ui/Button';
import { goBack, Header } from '../../ui/Header';
import { IconButton } from '../../ui/IconButton';
import { accountColor, color, radius, space } from '../../ui/theme';
import { Thumb } from '../../ui/Thumb';
import { Txt } from '../../ui/Txt';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready, posts, accounts, markPosted, skip, snooze, removePost } = useStore();
  const now = useNow(15000);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = posts.find((p) => p.id === id);
  const account = post ? accounts.find((a) => a.id === post.accountId) : undefined;
  const hasVideo = useMemo(() => fileExists(post?.video ?? null), [post?.video]);

  useEffect(() => {
    setOpened(false);
    setCopied(false);
    setArmed(false);
    setBusy(false);
    setError(null);
  }, [id]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!ready) return <View style={styles.fill} />;

  if (!post) {
    return (
      <View style={styles.fill}>
        <Header />
        <View style={styles.gone}>
          <Ionicons name="checkmark-done-outline" size={40} color={color.faint} />
          <Txt variant="title">This post is gone</Txt>
        </View>
      </View>
    );
  }

  const queued = post.status === 'queued';
  const tint = accountColor(account?.hue ?? 0);
  const thumbWidth = Math.min(Math.round(width * 0.5), Math.round((height * 0.38 * 9) / 16), 240);
  const when = post.at > now ? countdown(post.at, now) : lateness(post.at, now);

  const nextDue = () =>
    posts
      .filter((p) => p.id !== post.id && p.status === 'queued' && p.at <= Date.now())
      .sort((a, b) => a.at - b.at)[0];

  const open = async () => {
    if (!post.video) return;
    setError(null);
    try {
      await openInTikTok(post.video, post.caption);
      setOpened(true);
      if (post.caption) setCopied(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      setError("Couldn't open TikTok");
    }
  };

  const posted = async () => {
    setBusy(true);
    const next = nextDue();
    await markPosted(post.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (next) router.replace({ pathname: '/post/[id]', params: { id: next.id } });
    else goBack();
  };

  const skipIt = async () => {
    setBusy(true);
    const next = nextDue();
    await skip(post.id);
    if (next) router.replace({ pathname: '/post/[id]', params: { id: next.id } });
    else goBack();
  };

  const later = async () => {
    setBusy(true);
    await snooze(post.id, 10);
    goBack();
  };

  const remove = async () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    await removePost(post.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    goBack();
  };

  const copy = async () => {
    await copyCaption(post.caption);
    setCopied(true);
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <View style={styles.fill}>
      <Header
        right={
          armed ? (
            <Button kind="danger" compact icon="trash-outline" label="Delete" onPress={remove} />
          ) : (
            <IconButton name="trash-outline" label="Delete post" tone={color.muted} onPress={remove} />
          )
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.who}>
          <Txt variant="body" tone={color.muted}>
            {queued ? 'Post on' : post.status === 'posted' ? 'Posted on' : 'Skipped on'}
          </Txt>
          <Txt variant="display" tone={tint} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {account?.handle ?? ''}
          </Txt>
          <View style={styles.meta}>
            <Txt variant="label" tone={color.accent} tabular>
              {clock(queued ? post.at : (post.doneAt ?? post.at))}
            </Txt>
            {queued ? (
              <Txt variant="label" tone={post.at > now ? color.muted : color.primaryInk}>
                {when}
              </Txt>
            ) : null}
            {post.total > 1 ? (
              <Txt variant="label" tone={color.muted}>
                {post.index + 1} of {post.total}
              </Txt>
            ) : null}
          </View>
        </View>

        <View style={styles.media}>
          <Thumb uri={post.thumb} width={thumbWidth} rounded={radius.lg} dim={!queued} />
          {!queued ? (
            <View style={styles.stamp}>
              <Ionicons
                name={post.status === 'posted' ? 'checkmark-circle' : 'remove-circle-outline'}
                size={56}
                color={post.status === 'posted' ? color.accent : color.muted}
              />
            </View>
          ) : null}
        </View>

        {post.caption ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy caption"
            onPress={copy}
            style={({ pressed }) => [styles.captionBox, pressed ? styles.captionPressed : null]}
          >
            <Txt variant="body" numberOfLines={4} style={styles.flex}>
              {post.caption}
            </Txt>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={copied ? color.accent : color.muted} />
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={[styles.dock, { paddingBottom: insets.bottom + space.md }]}>
        {queued && !hasVideo ? (
          <Txt variant="body" tone={color.primaryInk} style={styles.note}>
            Video file is missing
          </Txt>
        ) : null}
        {error ? (
          <Txt variant="body" tone={color.primaryInk} style={styles.note}>
            {error}
          </Txt>
        ) : null}

        {queued ? (
          <>
            {opened ? (
              <Button label="Mark posted" icon="checkmark" onPress={posted} loading={busy} />
            ) : (
              <Button label="Open TikTok" icon="logo-tiktok" onPress={open} disabled={!hasVideo} />
            )}
            <View style={styles.pair}>
              {opened ? (
                <Button kind="secondary" compact grow icon="refresh" label="Open again" onPress={open} disabled={busy || !hasVideo} />
              ) : (
                <Button kind="secondary" compact grow icon="alarm-outline" label="In 10 min" onPress={later} disabled={busy} />
              )}
              <Button kind="secondary" compact grow icon="play-skip-forward-outline" label="Skip" onPress={skipIt} disabled={busy} />
            </View>
          </>
        ) : (
          <Button kind="secondary" label="Back to queue" icon="list" onPress={goBack} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.xl },
  who: { gap: space.xs },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.lg, rowGap: space.xs },
  media: { alignItems: 'center', justifyContent: 'center' },
  stamp: { position: 'absolute' },
  captionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  captionPressed: { backgroundColor: color.raised },
  dock: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
  pair: { flexDirection: 'row', gap: space.sm },
  note: { textAlign: 'center' },
  gone: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingBottom: 80 },
});
