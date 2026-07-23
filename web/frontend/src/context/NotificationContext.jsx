import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../../../backend/db/firebase";
import { useAuth } from "./AuthContext";
import { useFeedback } from "./FeedbackContext";

const NotificationContext = createContext();
const LOCAL_KEY = "kharchaflow_notifications";

export const useNotifications = () => useContext(NotificationContext);

const normalize = (id, data) => ({ id, read: false, title: "KharchaFlow", body: "You have a new notification.", ...data });

export function NotificationProvider({ children }) {
  const { user, isDemoMode } = useAuth();
  const { notify } = useFeedback();
  const [notifications, setNotifications] = useState([]);
  const [pushStatus, setPushStatus] = useState("default");
  const initialized = useRef(false);

  useEffect(() => {
    initialized.current = false;
    if (!user) {
      setNotifications([]);
      return undefined;
    }
    if (isDemoMode || !db) {
      const stored = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      setNotifications(stored);
      initialized.current = true;
      return undefined;
    }
    const notificationQuery = query(collection(db, "users", user.uid, "notifications"), orderBy("createdAt", "desc"));
    return onSnapshot(notificationQuery, (snapshot) => {
      const next = snapshot.docs.map((item) => normalize(item.id, item.data()));
      if (initialized.current) {
        snapshot.docChanges().filter((change) => change.type === "added").forEach((change) => {
          const item = normalize(change.doc.id, change.doc.data());
          notify(`${item.title}: ${item.body}`, "info");
        });
      }
      initialized.current = true;
      setNotifications(next);
    });
  }, [user, isDemoMode, notify]);

  useEffect(() => {
    if (typeof Notification !== "undefined") setPushStatus(Notification.permission);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const markAsRead = async (id) => {
    const item = notifications.find((notification) => notification.id === id);
    if (!item || item.read) return;
    if (isDemoMode || !db) {
      const next = notifications.map((notification) => notification.id === id ? { ...notification, read: true } : notification);
      setNotifications(next);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      return;
    }
    await updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true, readAt: new Date().toISOString() });
  };

  const markAllAsRead = async () => Promise.all(notifications.filter((item) => !item.read).map((item) => markAsRead(item.id)));

  const enablePush = async () => {
    if (!user || isDemoMode || !db || !("Notification" in window) || !("serviceWorker" in navigator)) {
      throw new Error("Push notifications are not available in this browser or demo mode.");
    }
    const permission = await Notification.requestPermission();
    setPushStatus(permission);
    if (permission !== "granted") throw new Error("Notification permission was not granted.");
    const { getMessaging, getToken, isSupported, onMessage } = await import("firebase/messaging");
    if (!await isSupported()) throw new Error("Firebase Messaging is not supported by this browser.");
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(getMessaging(), { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) throw new Error("No push token was issued. Configure a Firebase Web Push certificate (VAPID key).");
    await updateDoc(doc(db, "users", user.uid), { fcmToken: token, pushEnabled: true, pushUpdatedAt: new Date().toISOString() });
    onMessage(getMessaging(), (payload) => notify(`${payload.notification?.title || "KharchaFlow"}: ${payload.notification?.body || "New notification"}`, "info"));
    return token;
  };

  const value = { notifications, unreadCount, pushStatus, markAsRead, markAllAsRead, enablePush };
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const createInAppNotification = async (uid, notification) => addDoc(collection(db, "users", uid, "notifications"), {
  title: notification.title,
  body: notification.body,
  read: false,
  channel: notification.channel || "in-app",
  createdAt: new Date().toISOString(),
  sentBy: notification.sentBy || "admin"
});
