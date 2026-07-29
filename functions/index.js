import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";

initializeApp();
const firestore = getFirestore();
const ADMIN_EMAILS = new Set(["redcoder008@gmail.com", "kharchaflow@gmail.com"]);

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

// Browser clients cannot safely delete another user's Authentication account.
// This callable runs with Admin SDK privileges after validating the requester.
export const deleteManagedUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in as an administrator to delete users.");
  }

  const requester = await getAuth().getUser(request.auth.uid);
  const requesterProfile = await firestore.doc(`users/${request.auth.uid}`).get();
  const isAdmin = ADMIN_EMAILS.has(requester.email?.toLowerCase()) || requesterProfile.data()?.isAdmin === true;
  if (!isAdmin) {
    throw new HttpsError("permission-denied", "Only administrators can delete users.");
  }

  const uid = typeof request.data?.uid === "string" ? request.data.uid.trim() : "";
  if (!uid) {
    throw new HttpsError("invalid-argument", "A user ID is required.");
  }
  if (uid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "Administrators cannot delete their own account here.");
  }

  await getAuth().deleteUser(uid);
  await firestore.recursiveDelete(firestore.doc(`users/${uid}`));
  return { deletedUid: uid };
});
