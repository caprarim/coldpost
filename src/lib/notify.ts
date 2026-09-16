import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CHANNEL = 'posts';

export async function setupChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Post reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 220, 120, 220],
    lightColor: '#D8275D',
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function notificationsAllowed() {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

export async function askForNotifications() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

type Reminder = { postId: string; at: number; handle: string; index: number; total: number };

export async function scheduleReminder(reminder: Reminder) {
  if (reminder.at <= Date.now() + 1000) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `Post on ${reminder.handle}`,
        body: reminder.total > 1 ? `Video ${reminder.index + 1} of ${reminder.total} is ready` : 'Your video is ready',
        data: { postId: reminder.postId },
        sound: 'default',
        color: '#D8275D',
        priority: 'max',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.at,
        channelId: CHANNEL,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelReminder(id: string | null) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

export async function scheduledIds() {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return new Set(all.map((n) => n.identifier));
  } catch {
    return new Set<string>();
  }
}

export async function dismissFor(postId: string) {
  try {
    const shown = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(
      shown
        .filter((n) => n.request.content.data?.postId === postId)
        .map((n) => Notifications.dismissNotificationAsync(n.request.identifier)),
    );
  } catch {}
}
