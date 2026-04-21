import { auth } from '@/lib/firebaseClient';

export async function subscribeToPush() {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    // Show in-app reminder badge as fallback — do not retry
    console.log('Push notification permission denied. Fallback to in-app badges.');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    ),
  });

  const token = await auth.currentUser?.getIdToken();
  if (!token) return;

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subscription),
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
