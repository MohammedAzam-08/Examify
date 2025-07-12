import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import authRoutes from './routes/auth.js';
import examRoutes from './routes/exams.js';
import submissionsRouterFunction from './routes/submissions.js';
import usersRouter from './routes/users.js';
import settingsRouter from './routes/settings.js';
import createStudyMaterialsRouter from './routes/studyMaterials.js';
import uploadPdfRouter from './routes/upload-pdf.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { initGridFS } from './utils/gridfs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection with retry logic and enhanced GridFS initialization
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/education_platform', {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds timeout for operations
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize GridFS after MongoDB connection with retry logic
    let gridFsInitialized = initGridFS();
    
    if (!gridFsInitialized) {
      console.log('GridFS not initialized on first attempt, retrying in 2 seconds...');
      setTimeout(() => {
        gridFsInitialized = initGridFS();
        if (!gridFsInitialized) {
          console.warn('GridFS initialization failed on second attempt. Will retry when first GridFS operation is needed.');
        } else {
          console.log('GridFS initialized successfully on second attempt');
        }
      }, 2000);
    }
    
    // Set up error handler for MongoDB connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    // Handle disconnect and reconnect
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected, attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      initGridFS(); // Reinitialize GridFS after reconnection
    });
    
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Retrying in 5 seconds...');
    setTimeout(() => connectDB(), 5000);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionsRouterFunction(process.env.MONGODB_URI || 'mongodb://localhost:27017/education_platform'));
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/study-materials', createStudyMaterialsRouter(process.env.MONGODB_URI || 'mongodb://localhost:27017/education_platform'));
app.use('/api/upload-pdf', uploadPdfRouter);

// Error Handler
app.use(errorHandler);

// Test Cloudinary connection at startup
import { cloudinary } from './config/cloudinary.js';

const testCloudinaryConnection = async () => {
  try {
    console.log('Testing Cloudinary connection...');
    // Ping the Cloudinary API to verify credentials
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection test:', result);
    console.log('✅ Cloudinary connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection test failed:', error);
    console.error('Please check your Cloudinary credentials in .env file');
    return false;
  }
};

// Connect to MongoDB and start server
connectDB().then(async () => {
  // Test Cloudinary connection before starting server
  await testCloudinaryConnection();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
