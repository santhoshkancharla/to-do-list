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
    if (permission === "granted") {
      let token;
      if ('serviceWorker' in navigator) {
        // Wait for service worker to be ready, but time out if it takes too long (e.g., in dev mode without SW active)
        const readyPromise = navigator.serviceWorker.ready;
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for Service Worker ready")), 2000));
        
        try {
          const registration = await Promise.race([readyPromise, timeoutPromise]);
          token = await getToken(messaging, { 
            vapidKey, 
            serviceWorkerRegistration: registration 
          });
        } catch (err) {
          console.warn("[Firebase] Service Worker ready timed out or failed. Falling back to default getToken registration:", err.message);
          token = await getToken(messaging, { vapidKey });
        }
      } else {
        token = await getToken(messaging, { vapidKey });
      }
      if (token) {
        return token;
      } else {
        console.warn("[Firebase] No registration token returned.");
        return null;
      }
    } else {
      console.warn("[Firebase] Notification permission was denied.");
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
