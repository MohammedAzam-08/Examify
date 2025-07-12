import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Get Cloudinary credentials from environment with fallbacks
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dziiaatke';
const apiKey = process.env.CLOUDINARY_API_KEY || '264333598496788';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '2qy7Kog7jM4MkdWdOyq11tnKI70';

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Print configuration to verify it's loaded correctly
console.log('Cloudinary Configuration:');
console.log(`- Cloud Name: ${cloudName}`);
console.log(`- API Key: ${apiKey ? apiKey.substring(0, 4) + '...' : 'Missing'}`);
console.log(`- API Secret: ${apiSecret ? apiSecret.substring(0, 4) + '...' : 'Missing'}`);

// Verify configuration
try {
  const configTest = cloudinary.config();
  console.log(`- Config Test: Cloud name is ${configTest.cloud_name}`);
} catch (configError) {
  console.error('Failed to load Cloudinary configuration:', configError);
}

// Configure storage for PDF uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'examify_pdfs',
    resource_type: 'raw', // Use raw for PDFs
    format: 'pdf',
    allowed_formats: ['pdf'],
    public_id: (req, file) => {
      // Generate a unique ID including user ID, exam ID, and timestamp
      const userId = req.user ? req.user.id : 'anonymous';
      const examId = req.body.examId || 'unknown';
      const timestamp = Date.now();
      return `submission_${userId}_${examId}_${timestamp}`;
    }
  },
});

// Configure multer for handling file uploads
const uploadPDF = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

export { cloudinary, uploadPDF };
