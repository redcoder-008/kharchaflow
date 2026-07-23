# KharchaFlow push delivery

Deploy this Firebase Functions folder in the same Firebase project as the web app. The browser queues `pushNotificationRequests`; `deliverQueuedPushNotification` sends those requests through FCM using the users' registered device tokens.

Set `VITE_FIREBASE_VAPID_KEY` in the web app environment from Firebase Console → Project settings → Cloud Messaging → Web Push certificates, then deploy the frontend and functions.
