import express from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { uploadPDF } from '../config/cloudinary.js';
import { uploadToCloudinary } from '../utils/cloudinary-utils.js';
import Submission from '../models/Submission.js';

const router = express.Router();

// @route   POST /api/upload-pdf
// @desc    Upload a PDF file to Cloudinary with multer
// @access  Private
router.post('/', protect, uploadPDF.single('file'), asyncHandler(async (req, res) => {
  try {
    console.log('=== PDF UPLOAD TO CLOUDINARY ENDPOINT CALLED ===');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const { examId, submissionType } = req.body;
    
    if (!examId) {
      return res.status(400).json({ success: false, message: 'Missing exam ID' });
    }
    
    // Get upload result from multer-storage-cloudinary
    const result = {
      cloudinaryUrl: req.file.path, // Cloudinary URL
      cloudinaryPublicId: req.file.filename, // Cloudinary public ID
      format: 'pdf',
      resourceType: 'raw',
      bytes: req.file.size
    };
    
    // Create or update submission record in MongoDB
    let submission = await Submission.findOne({ 
      exam: examId,
      student: req.user._id
    });
    
    if (submission) {
      // Update existing submission with Cloudinary info
      submission.fileName = req.file.originalname;
      submission.cloudinaryUrl = result.cloudinaryUrl;
      submission.cloudinaryPublicId = result.cloudinaryPublicId;
      submission.storageType = 'cloudinary';
      submission.submittedAt = Date.now();
      
      if (submissionType) {
        submission.submissionType = submissionType;
      }
      
      await submission.save();
    } else {
      // Create new submission with Cloudinary info
      submission = await Submission.create({
        exam: examId,
        student: req.user._id,
        fileName: req.file.originalname,
        cloudinaryUrl: result.cloudinaryUrl,
        cloudinaryPublicId: result.cloudinaryPublicId,
        storageType: 'cloudinary',
        submissionType: submissionType || 'standard'
      });
    }
    
    res.status(201).json({
      success: true,
      submission: {
        id: submission._id,
        fileName: submission.fileName,
        cloudinaryUrl: submission.cloudinaryUrl,
        submittedAt: submission.submittedAt
      }
    });
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading file',
      error: error.message
    });
  }
}));

// @route   POST /api/upload-pdf/buffer
// @desc    Upload a PDF buffer to Cloudinary (for programmatic uploads)
// @access  Private
router.post('/buffer', protect, asyncHandler(async (req, res) => {
  try {
    console.log('=== PDF BUFFER UPLOAD TO CLOUDINARY ENDPOINT CALLED ===');
    console.log(`Request from user: ${req.user?._id} for exam: ${req.body?.examId}`);
    
    // Set a timeout for the entire request process
    const requestTimeout = setTimeout(() => {
      console.error('PDF buffer upload timeout exceeded (60s)');
      if (!res.headersSent) {
        res.status(408).json({ success: false, message: 'Request timeout while processing upload' });
      }
    }, 60000); // 60 second timeout
    
    const { examId, fileName, pdfBuffer, metadata } = req.body;
    
    if (!examId) {
      clearTimeout(requestTimeout);
      return res.status(400).json({ success: false, message: 'Missing exam ID' });
    }
    
    // Check if we have valid buffer data
    if (!pdfBuffer) {
      clearTimeout(requestTimeout);
      return res.status(400).json({ success: false, message: 'Missing PDF buffer' });
    }
    
    console.log('PDF buffer received. Type:', typeof pdfBuffer, 'Is array:', Array.isArray(pdfBuffer));
    
    // Try to create a buffer from the data
    let buffer;
    try {
      // Handle different types of buffer data that might be sent
      if (Array.isArray(pdfBuffer)) {
        console.log('Converting array to Buffer, length:', pdfBuffer.length);
        // Ensure all elements are valid numbers
        const validatedArray = pdfBuffer.map(val => {
          const num = Number(val);
          if (isNaN(num) || num < 0 || num > 255) {
            throw new Error(`Invalid byte value: ${val}`);
          }
          return num;
        });
        buffer = Buffer.from(validatedArray);
      } else if (Buffer.isBuffer(pdfBuffer)) {
        console.log('Input is already a Buffer');
        buffer = pdfBuffer;
      } else if (typeof pdfBuffer === 'string') {
        console.log('Converting string to Buffer, length:', pdfBuffer.length);
        // Check if it's a base64 string
        if (pdfBuffer.startsWith('data:') || pdfBuffer.match(/^[A-Za-z0-9+/=]+$/)) {
          // Handle base64 data
          const base64Data = pdfBuffer.replace(/^data:.*?;base64,/, '');
          buffer = Buffer.from(base64Data, 'base64');
        } else {
          // Regular string
          buffer = Buffer.from(pdfBuffer);
        }
      } else {
        console.log('Unknown buffer format, attempting generic conversion');
        buffer = Buffer.from(pdfBuffer);
      }
      
      // Validate buffer is not empty
      if (buffer.length === 0) {
        clearTimeout(requestTimeout);
        return res.status(400).json({ success: false, message: 'Empty PDF buffer' });
      }
      
      console.log(`PDF buffer size: ${buffer.length} bytes`);
      
      // Check if buffer appears to be a valid PDF (starts with %PDF-)
      const bufferStart = buffer.slice(0, 5).toString();
      if (!bufferStart.startsWith('%PDF')) {
        console.warn('Warning: Buffer does not appear to be a valid PDF file. Buffer starts with:', bufferStart);
      }
      
    } catch (bufferError) {
      clearTimeout(requestTimeout);
      console.error('Buffer creation error:', bufferError);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid PDF buffer format: ' + bufferError.message,
        errorType: 'buffer_conversion_error'
      });
    }
    
    // Upload buffer to Cloudinary with enhanced metadata
    const uploadMetadata = {
      userId: req.user._id.toString(),
      userName: req.user.name || 'Unknown User',
      examId: examId,
      timestamp: new Date().toISOString(),
      contentLength: buffer.length,
      ...metadata
    };
    
    console.log('Uploading buffer to Cloudinary...');
    
    let result;
    try {
      result = await uploadToCloudinary(
        buffer,
        fileName || `submission_${examId}_${Date.now()}.pdf`,
        uploadMetadata
      );
      
      console.log('Cloudinary upload completed successfully:', result.cloudinaryUrl);
    } catch (cloudinaryError) {
      clearTimeout(requestTimeout);
      console.error('Error in Cloudinary upload:', cloudinaryError);
      console.error('Stack trace:', cloudinaryError.stack);
      return res.status(500).json({
        success: false,
        message: 'Error uploading to Cloudinary: ' + cloudinaryError.message,
        errorType: 'cloudinary_upload_error'
      });
    }
    
    // Clear the timeout as we've successfully reached this point
    clearTimeout(requestTimeout);
    
    // Create or update submission record
    let submission = await Submission.findOne({ 
      exam: examId,
      student: req.user._id
    });
    
    if (submission) {
      // Update existing submission with Cloudinary info
      submission.fileName = fileName || `submission_${examId}_${Date.now()}.pdf`;
      submission.cloudinaryUrl = result.cloudinaryUrl;
      submission.cloudinaryPublicId = result.cloudinaryPublicId;
      submission.storageType = 'cloudinary';
      submission.submittedAt = Date.now();
      
      if (metadata && metadata.submissionType) {
        submission.submissionType = metadata.submissionType;
      }
      
      await submission.save();
    } else {
      // Create new submission with Cloudinary info
      submission = await Submission.create({
        exam: examId,
        student: req.user._id,
        fileName: fileName || `submission_${examId}_${Date.now()}.pdf`,
        cloudinaryUrl: result.cloudinaryUrl,
        cloudinaryPublicId: result.cloudinaryPublicId,
        storageType: 'cloudinary',
        submissionType: metadata?.submissionType || 'standard'
      });
    }
    
    res.status(201).json({
      success: true,
      submission: {
        id: submission._id,
        fileName: submission.fileName,
        cloudinaryUrl: result.cloudinaryUrl,
        cloudinaryPublicId: result.cloudinaryPublicId,
        submittedAt: submission.submittedAt
      }
    });
  } catch (error) {
    console.error('Error uploading buffer to Cloudinary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading buffer',
      error: error.message
    });
  }
}));

// @route   GET /api/upload-pdf/:id
// @desc    Get upload status and info
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    
    // Check if user is authorized to view this submission
    if (submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this submission' });
    }
    
    res.json({
      success: true,
      submission: {
        id: submission._id,
        fileName: submission.fileName,
        cloudinaryUrl: submission.cloudinaryUrl,
        submittedAt: submission.submittedAt,
        storageType: submission.storageType
      }
    });
  } catch (error) {
    console.error('Error getting upload status:', error);
    res.status(500).json({ success: false, message: 'Error getting upload status' });
  }
}));

export default router;
