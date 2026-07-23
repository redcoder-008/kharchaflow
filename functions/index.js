import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();
const firestore = getFirestore();

// Browser clients only queue requests. This trusted function is the only place
// FCM is called, keeping server credentials out of the app bundle.
export const deliverQueuedPushNotification = onDocumentCreated("pushNotificationRequests/{requestId}", async (event) => {
  const request = event.data?.data();
  if (!request?.recipientIds?.length) return;
  const recipients = await Promise.all(request.recipientIds.map((uid) => firestore.doc(`users/${uid}`).get()));
  const messages = recipients.flatMap((snapshot) => {
    const token = snapshot.data()?.fcmToken;
    return token ? [{
      token,
      notification: { title: request.title, body: request.body },
      data: { notificationId: event.params.requestId, channel: request.channel || "push" },
      webpush: { fcmOptions: { link: "/" } }
    }] : [];
  });
  if (!messages.length) {
    await event.data.ref.update({ status: "no-enabled-devices", deliveredAt: new Date().toISOString() });
    return;
  }
  const result = await getMessaging().sendEach(messages);
  await event.data.ref.update({
    status: result.failureCount ? "partially-delivered" : "delivered",
    deliveredCount: result.successCount,
    failedCount: result.failureCount,
    deliveredAt: new Date().toISOString()
  });
});
