const admin = require("firebase-admin");

admin.initializeApp({
    credential: admin.credential.applicationDefault(), // we will try to connect via fetch since we don't have creds
});
