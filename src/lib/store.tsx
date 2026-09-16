import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { accountHues } from '../ui/theme';
import { normalizeHandle } from './format';
import { discard, keep, type Pick } from './media';
import { cancelReminder, dismissFor, scheduledIds, scheduleReminder } from './notify';

export type PostStatus = 'queued' | 'posted' | 'skipped';

export type Account = { id: string; handle: string; hue: number };

export type Post = {
  id: string;
  accountId: string;
  video: string | null;
  thumb: string | null;
  caption: string;
  at: number;
  status: PostStatus;
  reminderId: string | null;
  index: number;
  total: number;
  doneAt: number | null;
};

export type Draft = Pick & { caption: string };

type Data = { accounts: Account[]; posts: Post[] };

type ScheduleInput = { accountId: string; drafts: Draft[]; start: number; gapMinutes: number };

type Store = Data & {
  ready: boolean;
  addAccount: (handle: string) => Account | null;
  recolorAccount: (id: string) => void;
  removeAccount: (id: string) => Promise<void>;
  schedule: (input: ScheduleInput) => Promise<void>;
  markPosted: (id: string) => Promise<void>;
  skip: (id: string) => Promise<void>;
  snooze: (id: string, minutes: number) => Promise<void>;
  removePost: (id: string) => Promise<void>;
};

const KEY = 'coldpost.data.v1';
const KEEP_DONE_MS = 3 * 86400000;
const EMPTY: Data = { accounts: [], posts: [] };

const StoreContext = createContext<Store | null>(null);

function makeId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

async function load(): Promise<Data> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Data>;
    return { accounts: parsed.accounts ?? [], posts: parsed.posts ?? [] };
  } catch {
    return EMPTY;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);
  const ref = useRef<Data>(EMPTY);

  const commit = useCallback((update: (prev: Data) => Data) => {
    const next = update(ref.current);
    ref.current = next;
    setData(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await load();
      const now = Date.now();
      const kept: Post[] = [];
      for (const post of saved.posts) {
        if (post.status !== 'queued' && (post.doneAt ?? 0) < now - KEEP_DONE_MS) {
          discard(post.thumb);
          discard(post.video);
        } else {
          kept.push(post);
        }
      }
      const live = await scheduledIds();
      const posts = await Promise.all(
        kept.map(async (post) => {
          if (post.status !== 'queued' || post.at <= now + 1000) return post;
          if (post.reminderId && live.has(post.reminderId)) return post;
          const handle = saved.accounts.find((a) => a.id === post.accountId)?.handle ?? '';
          const reminderId = await scheduleReminder({
            postId: post.id,
            at: post.at,
            handle,
            index: post.index,
            total: post.total,
          });
          return { ...post, reminderId };
        }),
      );
      if (!alive) return;
      commit(() => ({ accounts: saved.accounts, posts }));
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [commit]);

  const addAccount = useCallback(
    (raw: string) => {
      const handle = normalizeHandle(raw);
      if (!handle) return null;
      const { accounts } = ref.current;
      const existing = accounts.find((a) => a.handle.toLowerCase() === handle.toLowerCase());
      if (existing) return existing;
      const used = new Set(accounts.map((a) => a.hue));
      const free = accountHues.findIndex((_, i) => !used.has(i));
      const account: Account = {
        id: makeId(),
        handle,
        hue: free === -1 ? accounts.length % accountHues.length : free,
      };
      commit((prev) => ({ ...prev, accounts: [...prev.accounts, account] }));
      return account;
    },
    [commit],
  );

  const recolorAccount = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => (a.id === id ? { ...a, hue: (a.hue + 1) % accountHues.length } : a)),
      }));
    },
    [commit],
  );

  const removeAccount = useCallback(
    async (id: string) => {
      const doomed = ref.current.posts.filter((p) => p.accountId === id);
      commit((prev) => ({
        accounts: prev.accounts.filter((a) => a.id !== id),
        posts: prev.posts.filter((p) => p.accountId !== id),
      }));
      await Promise.all(
        doomed.map(async (post) => {
          await cancelReminder(post.reminderId);
          await dismissFor(post.id);
          discard(post.video);
          discard(post.thumb);
        }),
      );
    },
    [commit],
  );

  const schedule = useCallback(
    async ({ accountId, drafts, start, gapMinutes }: ScheduleInput) => {
      const account = ref.current.accounts.find((a) => a.id === accountId);
      if (!account) return;
      const created: Post[] = [];
      try {
        for (let i = 0; i < drafts.length; i++) {
          const draft = drafts[i];
          const id = makeId();
          const at = start + i * gapMinutes * 60000;
          const video = await keep(draft.video, 'videos', id);
          const thumb = await keep(draft.thumb, 'thumbs', id);
          const reminderId = await scheduleReminder({
            postId: id,
            at,
            handle: account.handle,
            index: i,
            total: drafts.length,
          });
          created.push({
            id,
            accountId,
            video,
            thumb,
            caption: draft.caption.trim(),
            at,
            status: 'queued',
            reminderId,
            index: i,
            total: drafts.length,
            doneAt: null,
          });
        }
      } finally {
        if (created.length) commit((prev) => ({ ...prev, posts: [...prev.posts, ...created] }));
      }
    },
    [commit],
  );

  const finish = useCallback(
    async (id: string, status: 'posted' | 'skipped') => {
      const post = ref.current.posts.find((p) => p.id === id);
      if (!post) return;
      commit((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          p.id === id ? { ...p, status, doneAt: Date.now(), reminderId: null, video: null } : p,
        ),
      }));
      await cancelReminder(post.reminderId);
      await dismissFor(id);
      discard(post.video);
    },
    [commit],
  );

  const markPosted = useCallback((id: string) => finish(id, 'posted'), [finish]);
  const skip = useCallback((id: string) => finish(id, 'skipped'), [finish]);

  const snooze = useCallback(
    async (id: string, minutes: number) => {
      const post = ref.current.posts.find((p) => p.id === id);
      if (!post) return;
      const handle = ref.current.accounts.find((a) => a.id === post.accountId)?.handle ?? '';
      await cancelReminder(post.reminderId);
      await dismissFor(id);
      const at = Date.now() + minutes * 60000;
      const reminderId = await scheduleReminder({ postId: id, at, handle, index: post.index, total: post.total });
      commit((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p.id === id ? { ...p, at, reminderId } : p)),
      }));
    },
    [commit],
  );

  const removePost = useCallback(
    async (id: string) => {
      const post = ref.current.posts.find((p) => p.id === id);
      if (!post) return;
      commit((prev) => ({ ...prev, posts: prev.posts.filter((p) => p.id !== id) }));
      await cancelReminder(post.reminderId);
      await dismissFor(id);
      discard(post.video);
      discard(post.thumb);
    },
    [commit],
  );

  const value = useMemo<Store>(
    () => ({
      ...data,
      ready,
      addAccount,
      recolorAccount,
      removeAccount,
      schedule,
      markPosted,
      skip,
      snooze,
      removePost,
    }),
    [data, ready, addAccount, recolorAccount, removeAccount, schedule, markPosted, skip, snooze, removePost],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreProvider missing');
  return store;
}
