// Import Firebase SDK compat version inside the Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase Configuration. 
// Replace these placeholders with your actual Firebase Web App credentials.
const firebaseConfig = {
  apiKey: "AIzaSyBc08BOi0oTgVynXGIO0VaNuybcod7vdH8",
  authDomain: "life-flow-49507.firebaseapp.com",
  projectId: "life-flow-49507",
  storageBucket: "life-flow-49507.firebasestorage.app",
  messagingSenderId: "156631983995",
  appId: "1:156631983995:web:9fe93733820bf710ad7fde"
};

// Initialize Firebase in Service Worker
if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background Push Handler
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);
    const title = payload.notification?.title || '🔔 LifeFlow';
    const options = {
      body: payload.notification?.body || '',
      icon: '/pwa-192x192.png',
      badge: '/logo.png',
      data: payload.data
    };
    self.registration.showNotification(title, options);
  });
} else {
  console.warn('[firebase-messaging-sw.js] Firebase API Key is not configured. Background notifications will not trigger.');
}

// Handle notification click and redirection
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Retrieve destination route (e.g. /?page=planner) from nested FCM payload structures
  const fcmMessage = event.notification.data?.FCM_MSG;
  const clickAction = fcmMessage?.data?.click_action 
    || fcmMessage?.notification?.click_action
    || event.notification.data?.click_action 
    || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open and navigate internally
      for (let client of windowClients) {
        const clientUrl = new URL(client.url);
        const selfUrl = new URL(self.location.origin);
        if (clientUrl.origin === selfUrl.origin && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: clickAction });
          return client.focus();
        }
      }
      // Or open a new browser window
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
