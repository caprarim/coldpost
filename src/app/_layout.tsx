import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupChannel } from '../lib/notify';
import { StoreProvider } from '../lib/store';
import { color } from '../ui/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const handled = new Set<string>();

function openFrom(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const key = response.notification.request.identifier;
  if (handled.has(key)) return;
  handled.add(key);
  const postId = response.notification.request.content.data?.postId;
  if (typeof postId === 'string') {
    router.push({ pathname: '/post/[id]', params: { id: postId } });
  }
  Notifications.clearLastNotificationResponse();
}

export default function RootLayout() {
  useEffect(() => {
    setupChannel().catch(() => {});
    openFrom(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(openFrom);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider style={{ backgroundColor: color.bg }}>
      <StoreProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: color.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="post/[id]" />
          <Stack.Screen name="accounts" />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
