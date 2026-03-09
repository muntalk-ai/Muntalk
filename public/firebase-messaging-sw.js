// public/firebase-messaging-sw.js
// FCM 서비스 워커 — public/ 폴더에 위치해야 함
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            '__FIREBASE_API_KEY__',
  authDomain:        '__FIREBASE_AUTH_DOMAIN__',
  projectId:         '__FIREBASE_PROJECT_ID__',
  storageBucket:     '__FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
  appId:             '__FIREBASE_APP_ID__',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Lingua AI', {
    body: body || 'Time to study!',
    icon: icon || '/icon-192x192.png',
    data: payload.data,
    actions: [
      { action: 'open',    title: '📚 Start Studying' },
      { action: 'dismiss', title: 'Later' },
    ],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action !== 'dismiss') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/lingua')
    );
  }
});
