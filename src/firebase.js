import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDdJr7LGpQv5YUNdkdFLxQVKcNQVcPtolk",
  authDomain: "globals-pwa.firebaseapp.com",
  projectId: "globals-pwa",
  storageBucket: "globals-pwa.firebasestorage.app",
  messagingSenderId: "31104945132",
  appId: "1:31104945132:web:afba85726fc8e853f4cec9"
};

const app = initializeApp(firebaseConfig);
const messaging = typeof window !== "undefined" && "serviceWorker" in navigator ? getMessaging(app) : null;

export const requestFirebaseToken = async () => {
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: "BCbbicvHw9JwyOPpCxV6kAdJxRDnCs-ndImw7R0H0TEC6Fx7YC-GK5moDmmgixK4DjkzHDHPgbHK5jtw-PZT81s"
    });
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const setupOnMessageListener = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export { app, messaging };
