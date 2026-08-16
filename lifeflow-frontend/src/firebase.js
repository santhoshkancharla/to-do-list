import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

let app = null;
let messaging = null;

if (firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (err) {
    console.error("[Firebase] Failed to initialize client SDK:", err);
  }
}

// Request permission and retrieve FCM Registration token
export const requestNotificationPermissionAndGetToken = async () => {
  if (!messaging) {
    console.warn("[Firebase] Firebase messaging client not initialized. Check your environment variables.");
    return null;
  }

  if (!("Notification" in window)) {
    console.warn("[Firebase] This browser does not support desktop notifications.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[Firebase] Notification permission was denied.");
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn("[Firebase] Service workers are not supported by this browser.");
      const token = await getToken(messaging, { vapidKey });
      return token;
    }

    const isProd = import.meta.env.PROD;

    // 1. Clean up duplicate/conflicting service workers
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        const scriptURL = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
        if (isProd) {
          // In production, we only want /sw.js. Standalone /firebase-messaging-sw.js causes conflict.
          if (scriptURL.includes('firebase-messaging-sw.js')) {
            console.log('[Firebase Cleanup] Unregistering standalone firebase-messaging-sw.js in production to prevent conflicts.');
            await reg.unregister();
          }
        } else {
          // In development, we only want /firebase-messaging-sw.js.
          if (scriptURL.includes('sw.js')) {
            console.log('[Firebase Cleanup] Unregistering sw.js in development.');
            await reg.unregister();
          }
        }
      }
    } catch (cleanErr) {
      console.warn("[Firebase Cleanup] Error cleaning up service workers:", cleanErr);
    }

    // 2. Obtain the correct service worker registration object
    let registration = null;
    if (isProd) {
      // In production: find the active PWA service worker (sw.js)
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        registration = registrations.find(reg => {
          const scriptURL = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
          return scriptURL.includes('sw.js');
        });

        if (!registration) {
          // If not found in current registrations, wait for ready or fetch/register explicitly
          console.log("[Firebase] PWA service worker (sw.js) registration not found in list. Waiting for ready...");
          const readyPromise = navigator.serviceWorker.ready;
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for sw.js")), 5000));
          registration = await Promise.race([readyPromise, timeoutPromise]);
        }
      } catch (err) {
        console.warn("[Firebase] Failed to get ready PWA service worker. Registering /sw.js explicitly:", err.message);
        try {
          registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        } catch (regErr) {
          console.error("[Firebase] Fatal error registering /sw.js:", regErr);
        }
      }
    } else {
      // In development: explicitly register firebase-messaging-sw.js
      try {
        console.log("[Firebase] Development mode: registering /firebase-messaging-sw.js...");
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      } catch (err) {
        console.error("[Firebase] Error registering /firebase-messaging-sw.js in dev mode:", err);
      }
    }

    // 3. Get the token using the registration
    let token;
    if (registration) {
      // Ensure the service worker is active before requesting the token
      const serviceWorker = registration.active || registration.installing || registration.waiting;
      if (serviceWorker && serviceWorker.state !== 'activated') {
        console.log(`[Firebase] Service Worker is in "${serviceWorker.state}" state. Waiting for activation...`);
        await new Promise((resolve) => {
          const onStateChange = () => {
            if (serviceWorker.state === 'activated') {
              serviceWorker.removeEventListener('statechange', onStateChange);
              console.log('[Firebase] Service Worker activated successfully.');
              resolve();
            }
          };
          serviceWorker.addEventListener('statechange', onStateChange);
          // Safety timeout of 5 seconds to prevent hanging indefinitely
          setTimeout(resolve, 5000);
        });
      }

      const activeSW = registration.active || registration.installing || registration.waiting;
      console.log(`[Firebase] Getting FCM token using service worker: ${activeSW ? activeSW.scriptURL : 'sw.js'}`);
      token = await getToken(messaging, { 
        vapidKey, 
        serviceWorkerRegistration: registration 
      });
      console.log("[Firebase] FCM token retrieved successfully:", token ? token.substring(0, 10) + "..." : null);
    } else {
      console.warn("[Firebase] No service worker registration available. Falling back to default getToken.");
      token = await getToken(messaging, { vapidKey });
      console.log("[Firebase] FCM token retrieved successfully (fallback):", token ? token.substring(0, 10) + "..." : null);
    }

    if (token) {
      return token;
    } else {
      console.warn("[Firebase] No registration token returned.");
      return null;
    }
  } catch (err) {
    console.error("[Firebase] Error retrieving FCM registration token:", err);
    return null;
  }
};

// Set up foreground push notification handler
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
