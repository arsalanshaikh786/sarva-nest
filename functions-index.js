// functions/index.js
// Deploy this as a Firebase Cloud Function (2nd gen). This is the piece that
// actually SENDS the push notification — it needs Admin SDK privileges, which
// is why it can't live in the driver's browser code.
//
// Setup (one-time, from your project root):
//   npm install -g firebase-tools
//   firebase login
//   firebase init functions        (choose JavaScript, existing project multi-service-app-77dd8)
//   cd functions
//   npm install firebase-admin firebase-functions
//   -> replace the generated index.js with this file
//   firebase deploy --only functions
//
// NOTE: Cloud Functions requires the Blaze (pay-as-you-go) plan on Firebase,
// even though usage at your scale will very likely stay within the free quota.

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

// Notify all currently-available drivers when a new ride request comes in.
exports.notifyDriversOnNewRide = onDocumentCreated("rickshaw_rides/{rideId}", async (event) => {
  const ride = event.data.data();
  if (!ride || ride.status !== "requested") return;

  const driversSnap = await db.collection("rickshaw_drivers")
    .where("status", "==", "available")
    .get();

  const tokens = driversSnap.docs
    .map((d) => d.data().fcmToken)
    .filter(Boolean);

  if (!tokens.length) {
    console.log("No available drivers with an FCM token — skipping push.");
    return;
  }

  const message = {
    notification: {
      title: "🛺 Naya Ride Request!",
      body: `${ride.pickup?.address || "Pickup"} → ${ride.drop?.address || "Drop"} · ₹${ride.currentFare || ride.estimatedFare || 0}`,
    },
    data: {
      rideId: event.params.rideId,
      type: "new_ride",
    },
    tokens,
  };

  const response = await getMessaging().sendEachForMulticast(message);
  console.log(`Push sent: ${response.successCount} ok, ${response.failureCount} failed`);

  // Clean up dead/expired tokens so future sends don't keep failing on them.
  response.responses.forEach((r, i) => {
    if (!r.success && (r.error?.code === "messaging/registration-token-not-registered")) {
      const deadToken = tokens[i];
      driversSnap.docs
        .filter((d) => d.data().fcmToken === deadToken)
        .forEach((d) => d.ref.update({ fcmToken: null }));
    }
  });
});

// Notify the driver when a customer sends a counter-offer during negotiation.
exports.notifyDriverOnCounter = onDocumentCreated("rickshaw_rides/{rideId}", async () => {
  // Placeholder for symmetry — ride status updates (not creates) trigger this
  // in real usage; use onDocumentUpdated from "firebase-functions/v2/firestore"
  // if you also want driver-side push on customer counter-offers.
});
