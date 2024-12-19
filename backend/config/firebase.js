import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a service account object using environment variables
const serviceAccount = {
  type: "service_account",
  project_id: "exame-39e7a",
  private_key_id: "9f7612fffbb34e948972708c476ea81ed65e7a92",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCj0ZwwUM3eLm2C\n7QNDcHIeULRRV7yGnweTeRfPqxM+E+QzBKxQNCgsgevi1dd6Uu4SDYG21ybIkdjo\nf9pUYX5AP81ZZvdjOjdFlEZlChAPuMroXroG2aJqHaF4MfX8ShWtgj2NrxdGNvwE\nbMElytGeh+SsQzLQYbzFwENJWa6bB6mjR/OH8U1+zOo+th0iRf687J1nHXC+nanY\nAw88uZHdBu+8nvoOgCPkFCWpvL+yHbJz7JYzRAxzU0sZfYnpyQpex5g0BnL4Yt5y\n8Nn/wDXndZN5tGAXHXSFs7LYacSIokUSq4CaM/drV9spGqWL0oEooFgHEMIGz7Jz\ncEkd2qbBAgMBAAECggEACX1oi2H68w6EeIurXzpB2iC5uWaYPMI0qaXfq7+Qz01O\nsGfqZYEH/MAP/qV9pI/uS6xtob5n+EF+q8VQTAgTzLwFdNLirORf9E9pHoxNLuP5\nGSn3o9Lytiv+QRy/z7wo8lKzpyQH+KDRy53TOJG9v+3GYPZJmMm4qkn/e93OoBtj\nR6QMsizq81gfbptLcqGEadaWC/ChJNuexemWY7ZbtT2Pol/NJmbfN7s+rSZLJVLH\ncFuiJXjhqXiK5TJUi7PBJOLtC4MQHkMcR6jYTM5baNpM9Dududv+WNrfPAgmthtm\nBBnR/sC6LTGr+MLnLmoh9K4d3NtQ0hPG3eppXrUwEwKBgQDWQZQM7J928EN2BvL5\nEH2R9drJCPI9bd51y4PoL69ZYEGBrZAVQmKwmJtS6K2f58ST9wIbQKYfh8/KqubE\nYEWRpK296Es521FKEPLrFnr5rF7tbgLRpUGOSfL4T/yLwtlZs+0x2U05YlEuYr+G\nlIvx/fr+Wg04jGC3eROcangu/wKBgQDDvF/ktBe8+6Jzuvd/PZTWatMgfsJxA+RZ\nRKz8JRiOFXMSbNMdbN4xRfqZeqFCiwCQrBzIfFeE2dVFLZq70zHkGb8YidPcNMFM\n/Uao6HwCDs5gSVqkKLc8p+WKKHJuZWtRSpe7HATJkjlFNL+HZPbDkp5vjxAIju0D\nBd+04q7qPwKBgAhBPJAG6dnuRdsdR207KmteOpC2TIb7Xa/SKIHgnHPoFn4FjuCS\nzzSYnJtkJZRcnKFKygT8x6m9VM8tKHj2cJe87Yi8k3FmNsqQvps6IYDPGFUzgN5M\n7KqrxLW2dzd3SWKAYSojgiss043i9hgcTwwCyhHUrF+6YNuQyaWkIH9HAoGBAJ57\nwAkl6LKT7I1YLV1RN1oFVL1S5Y0sYZAGEyp1vtQMegfJJYcFx0KOLsJmkHuYoPSC\n5ytNwm9HEW/Z5Rd/gT33usrbjjcWYA0+ZiANXZss8dz0h/ezH+p0515eMYlBhQtl\nIkXWAepUAxsOAqZWEZd499/MLmc/kpiIAQItKQNxAoGBALdipTGprXAVn4MhdPe6\nZzMq+iEEBTTwOu5kU/z/pgflUXDlefLWWTIIxJP8GC/THO60640XErKJgfteay2y\nEWdEJTOSVNE+YunawEdquxFBHg1+DqWk4dfuG142EsuBNNWRkz9rWjAgL9skF43S\naiYbyTZECr9JbROYEawqqMlx\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-bwxho@exame-39e7a.iam.gserviceaccount.com",
  client_id: "107959445434218982352",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-bwxho%40exame-39e7a.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

let firebaseApp;
let bucket;

try {
  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET // Optional: if you're using Firebase Storage
    });
    
    bucket = admin.storage().bucket(); // Optional: if you're using Firebase Storage
    console.log('Firebase initialized successfully');
  } else {
    firebaseApp = admin.app(); // Use the existing app
    bucket = admin.storage().bucket(); // Optional: if you're using Firebase Storage
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

// Export the initialized app and bucket (if using Firebase Storage)
export { firebaseApp, bucket };