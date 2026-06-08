const admin = require('firebase-admin');

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
} catch (e) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Ensure it is valid JSON.");
}

if (!admin.apps.length) {
  if (serviceAccount && serviceAccount.project_id) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.warn("Firebase Admin credentials not fully provided in .env. Some Firebase features may not work.");
    admin.initializeApp();
  }
}

module.exports = admin;
