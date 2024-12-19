import jwt from 'jsonwebtoken';
import { firebaseApp } from '../config/firebase.js'; // Adjust the path as necessary

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Assuming the token is sent in the Authorization header

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'); // Ensure newlines are handled correctly

    jwt.verify(token, privateKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
        req.user = decoded; // Attach the decoded user info to the request
        next();
    });
};

// Protect middleware
const protect = (req, res, next) => {
    if (req.user) {
        next(); // User is authenticated, proceed to the next middleware
    } else {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Faculty middleware
const faculty = (req, res, next) => {
    if (req.user && req.user.role === 'faculty') {
        next(); // User is faculty, proceed to the next middleware
    } else {
        res.status(403).json({ message: 'Access denied, faculty only' });
    }
};

export { verifyToken, protect, faculty };
