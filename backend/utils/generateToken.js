import jwt from 'jsonwebtoken';
import { firebaseApp } from '../config/firebase.js'; // Adjust the path as necessary

const generateToken = (userId) => {
    const payload = { id: userId };
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'); // Ensure newlines are handled correctly

    const token = jwt.sign(payload, privateKey, {
        algorithm: 'RS256', // Use RS256 for Firebase
        expiresIn: '1h', // Token expiration time
        issuer: firebaseApp.options.projectId, // Use your Firebase project ID
    });

    return token;
};

export default generateToken;
