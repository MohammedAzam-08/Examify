import express from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import mongoose from 'mongoose';
import { protect, instructor } from '../middleware/authMiddleware.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import { storePDF, retrievePDF, deletePDF, listExamPDFs, reassembleChunks } from '../utils/gridfs.js';
import { uploadToCloudinary } from '../utils/cloudinary-utils.js';

function createSubmissionsRouter(mongoUri) {
  const router = express.Router();
  
  // @route   GET /api/submissions/ping
  // @desc    Simple health check endpoint
  // @access  Public
  router.get('/ping', (req, res) => {
    return res.status(200).json({ status: 'ok', timestamp: Date.now() });
  });

  // @route   POST /api/submissions
  // @desc    Submit exam
  // @access  Private
  router.post('/', protect, asyncHandler(async (req, res) => {
    const timer = setTimeout(() => {
      console.error('Submission timeout - operation took too long');
    }, 30000); // Log if operation takes more than 30 seconds
    
    try {
      console.log('=== SUBMISSION ENDPOINT CALLED ===');
      console.log('User:', req.user ? { id: req.user._id, name: req.user.name, email: req.user.email } : 'No user');
      
      const { examId, studentName, pdfData, textOnly, fallbackReason, pagesAttempted } = req.body;

      // Basic validation with proper error handling
      if (!examId) {
        clearTimeout(timer);
        return res.status(400).json({ message: 'Missing exam ID' });
      }
      
      if (!studentName) {
        clearTimeout(timer);
        return res.status(400).json({ message: 'Missing student name' });
      }
      
      // Check if the student has already submitted this exam
      const existingSubmission = await Submission.findOne({ 
        exam: examId,
        student: req.user._id
      });
      
      if (existingSubmission) {
        console.log('Student has already submitted this exam');
        clearTimeout(timer);
        return res.status(400).json({ message: 'You have already submitted this exam' });
      }

      // Handle text-only submission (fallback method)
      if (textOnly === true) {
        console.log('Processing text-only submission for exam', examId);
        
        try {
          // Create a text file with the fallback information
          const safeStudentName = studentName.replace(/[^a-z0-9]/gi, '_');
          const filename = `${safeStudentName}_exam_${examId}_TEXT_ONLY_${Date.now()}.txt`;
          
          // Create a simple text buffer with submission metadata
          const textContent = `
TEXT-ONLY EXAM SUBMISSION
-----------------------
Student: ${studentName}
Exam ID: ${examId}
Submitted: ${new Date().toISOString()}
Pages Attempted: ${pagesAttempted || 'Unknown'}
Reason: ${fallbackReason || 'PDF submission failed'}
-----------------------
Note to instructor: The student attempted to submit this exam, but PDF submission failed.
Please contact the student to arrange an alternative submission method or resubmission.
`;
          const textBuffer = Buffer.from(textContent);
          
          // Store the text file in GridFS
          const fileInfo = await storePDF(textBuffer, filename, {
            examId: examId,
            studentId: req.user._id,
            studentName: studentName,
            submissionDate: new Date(),
            isTextOnly: true
          });
          
          // Create submission record in database
          const submission = await Submission.create({
            exam: examId,
            student: req.user._id,
            fileName: filename,
            fileId: fileInfo._id,
            submittedAt: new Date(),
            textOnly: true,
            fallbackReason: fallbackReason || 'PDF submission failed'
          });
          
          console.log('Text-only submission created successfully:', submission._id);
          clearTimeout(timer);
          return res.status(201).json({
            success: true,
            message: 'Text-only submission recorded successfully. Please contact your instructor.',
            submissionId: submission._id,
            textOnly: true
          });
        } catch (textError) {
          console.error('Text-only submission error:', textError);
          clearTimeout(timer);
          return res.status(500).json({ 
            message: 'Failed to create text-only submission: ' + textError.message
          });
        }
      }
      
      // Handle normal PDF submission
      if (!pdfData) {
        clearTimeout(timer);
        return res.status(400).json({ message: 'Missing PDF data' });
      }
      
      // Check if request is too large
      if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 50000000) {
        console.error('Request too large:', parseInt(req.headers['content-length']));
        clearTimeout(timer);
        return res.status(413).json({ message: 'PDF file too large, please reduce size or use chunked upload' });
      }
      
      console.log('Received data with PDF length:', pdfData.length);

      // Ensure pdfData is in the correct format
      if (!pdfData.startsWith('data:application/pdf;base64,')) {
        clearTimeout(timer);
        return res.status(400).json({ message: 'Invalid PDF data format' });
      }

      try {
        // Convert base64 PDF to buffer - handle any exceptions in this process
        let pdfBuffer;
        try {
          const pdfData64 = pdfData.replace(/^data:application\/pdf;base64,/, '');
          pdfBuffer = Buffer.from(pdfData64, 'base64');
          
          if (pdfBuffer.length === 0) {
            throw new Error('Empty PDF buffer after conversion');
          }
          
          console.log(`PDF buffer size: ${Math.round(pdfBuffer.length / 1024)}KB`);
        } catch (conversionError) {
          console.error('PDF conversion error:', conversionError);
          clearTimeout(timer);
          return res.status(400).json({ message: 'Failed to process PDF data: ' + conversionError.message });
        }

        // Create a unique filename - use client-provided filename if available
        let filename;
        if (req.body.fileName) {
          // Use the client-provided filename but ensure it's safe
          filename = req.body.fileName.replace(/[^a-z0-9_\-.]/gi, '_');
          console.log('Using client-provided filename:', filename);
        } else {
          // Create a filename server-side as fallback
          const safeStudentName = studentName.replace(/[^a-z0-9]/gi, '_');
          const studentIdPart = req.body.studentId ? `_${req.body.studentId}` : '';
          filename = `${safeStudentName}${studentIdPart}_exam_${examId}_${Date.now()}.pdf`;
          console.log('Generated filename:', filename);
        }

        // Check if MongoDB/GridFS is ready
        if (mongoose.connection.readyState !== 1) {
          clearTimeout(timer);
          return res.status(503).json({ 
            message: 'Database connection not ready, please try again'
          });
        }

        // Store PDF in GridFS using our utility
        let fileInfo;
        try {
          fileInfo = await storePDF(pdfBuffer, filename, {
            examId: examId,
            studentId: req.user._id,
            studentName: studentName,
            clientStudentId: req.body.studentId || null, // Include client-provided student ID if available
            submissionDate: new Date(),
            whiteboardData: true // Mark this as a whiteboard submission
          });
          console.log('PDF stored successfully in GridFS, fileId:', fileInfo._id);
        } catch (gridfsError) {
          console.error('GridFS storage error:', gridfsError);
          clearTimeout(timer);
          return res.status(500).json({ 
            message: 'Failed to store exam PDF: ' + gridfsError.message
          });
        }

        // Create submission record in database
        let submission;
        try {
          submission = await Submission.create({
            exam: examId,
            student: req.user._id,
            fileName: filename,
            fileId: fileInfo._id,
            submittedAt: new Date()
          });
        } catch (dbError) {
          console.error('Database error while creating submission:', dbError);
          clearTimeout(timer);
          return res.status(500).json({ 
            message: 'Failed to record submission: ' + dbError.message
          });
        }

        console.log('Submission created successfully:', submission._id);
        clearTimeout(timer);
        return res.status(201).json({
          success: true,
          message: 'Exam submitted successfully!',
          submissionId: submission._id
        });
      } catch (processingError) {
        console.error('PDF processing error:', processingError);
        clearTimeout(timer);
        return res.status(500).json({ 
          message: 'Failed to process submission: ' + processingError.message
        });
      }
    } catch (outerError) {
      console.error('Outer submission error:', outerError);
      clearTimeout(timer);
      return res.status(500).json({ 
        message: 'Server error during submission: ' + outerError.message
      });
    }
  }));

  // @route   POST /api/submissions/simplified
  // @desc    Simple text-only submission that skips GridFS entirely
  // @access  Private (but auth check bypassed for emergency situations)
  router.post('/simplified', asyncHandler(async (req, res) => {
    try {
      console.log('=== SIMPLIFIED SUBMISSION ENDPOINT CALLED ===');
      console.log('User:', req.user ? { id: req.user._id, name: req.user.name } : 'No user');
      
      const { examId } = req.body;
      
      if (!examId) {
        return res.status(400).json({ message: 'Missing exam ID' });
      }
      
      // First, log the data immediately so we have it even if DB operations fail
      const emergencyData = {
        ...req.body,
        submittedAt: new Date(),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
      };
      
      console.log('SIMPLIFIED SUBMISSION DATA:', JSON.stringify(emergencyData, null, 2));
      
      // Determine user ID - might not have req.user if auth was bypassed in emergency
      let userId = 'emergency-user';
      try {
        userId = req.user ? req.user._id : (req.body.studentId || 'emergency-user');
      } catch (userError) {
        console.warn('Could not determine user ID for simplified submission:', userError);
      }
      
      // Create a submission record directly in database
      // Skip all file handling for maximum reliability
      const submission = await Submission.create({
        exam: examId,
        student: userId,
        submittedAt: new Date(),
        textOnly: true,
        fallbackReason: 'Simplified text-only submission',
        emergencyData: emergencyData
      });
      
      console.log('Simplified submission created:', submission._id);
      
      // Return success response immediately
      return res.status(201).json({
        success: true,
        message: 'Simplified submission recorded',
        submissionId: submission._id
      });
      
    } catch (error) {
      console.error('Error in simplified submission:', error);
      res.status(500).json({ 
        message: 'Error processing simplified submission',
        error: error.message 
      });
    }
  }));

  // @route   GET /api/submissions/instructor/all
  // @desc    Get all submissions for an instructor across all their exams
  // @access  Private/Instructor
  router.get('/instructor/all', protect, instructor, asyncHandler(async (req, res) => {
    try {
      // First, get all exams created by this instructor
      const Exam = mongoose.model('Exam');
      const instructorExams = await Exam.find({ instructor: req.user._id }).select('_id title');
      const examIds = instructorExams.map(exam => exam._id);

      if (examIds.length === 0) {
        return res.json([]); // No exams, no submissions
      }

      // Find all submissions for instructor's exams
      const submissions = await Submission.find({ exam: { $in: examIds } })
        .populate('student', 'name email')
        .populate('exam', 'title subject')
        .sort('-submittedAt');
      
      // Transform submissions for instructor view
      const transformedSubmissions = submissions.map(submission => ({
        id: submission._id,
        studentName: submission.student.name,
        studentId: submission.student._id,
        submittedAt: submission.submittedAt,
        status: submission.grade !== undefined ? 'graded' : 'pending',
        grade: submission.grade,
        feedback: submission.feedback,
        fileId: submission.fileId,
        cloudinaryUrl: submission.cloudinaryUrl,
        storageType: submission.storageType,
        textOnly: submission.textOnly,
        fallbackReason: submission.fallbackReason,
        examTitle: submission.exam.title,
        examId: submission.exam._id
      }));
      
      return res.json(transformedSubmissions);
    } catch (error) {
      console.error('Error fetching all instructor submissions:', error);
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  }));

  // @route   GET /api/submissions/exam/:examId
  // @desc    Get student's submission for a specific exam
  // @access  Private/Student
  router.get('/exam/:examId', protect, asyncHandler(async (req, res) => {
    let submission;

    if (req.user.role === 'instructor') {
      // Instructors can see all submissions for an exam
      const submissions = await Submission.find({ exam: req.params.examId })
        .populate('student', 'name email')
        .sort('-submittedAt');
      
      // Transform submissions for instructor view
      const transformedSubmissions = submissions.map(submission => ({
        id: submission._id,
        studentName: submission.student.name,
        studentId: submission.student._id,
        submittedAt: submission.submittedAt,
        status: submission.grade !== undefined ? 'graded' : 'pending',
        grade: submission.grade,
        feedback: submission.feedback,
        fileId: submission.fileId,
        cloudinaryUrl: submission.cloudinaryUrl,
        storageType: submission.storageType,
        textOnly: submission.textOnly,
        fallbackReason: submission.fallbackReason
      }));
      
      return res.json(transformedSubmissions);
    } else {
      // Students can only see their own submission
      submission = await Submission.findOne({ 
        exam: req.params.examId,
        student: req.user._id 
      })
        .populate('exam', 'title subject duration maxScore')
        .populate('student', 'name email');
    }

    if (submission) {
      // Transform submission to match frontend expectations
      const transformedSubmission = {
        _id: submission._id,
        examId: submission.exam._id,
        submittedAt: submission.submittedAt,
        score: submission.score || null,
        maxScore: submission.exam.maxScore || submission.maxScore || 100,
        timeSpent: submission.timeSpent || 0,
        status: submission.status || 'submitted',
        feedback: submission.feedback || null
      };
      
      res.json(transformedSubmission);
    } else {
      res.status(404).json({ message: 'No submission found for this exam' });
    }
  }));

  // @route   GET /api/submissions/my-submissions
  // @desc    Get recent submissions for logged-in student
  // @access  Private/Student
  router.get('/my-submissions', protect, asyncHandler(async (req, res) => {
    console.log('=== MY SUBMISSIONS DEBUG ===');
    console.log('Student ID:', req.user._id);
    
    try {
      // Get submissions without populate first
      console.log('Finding submissions without populate...');
      const submissions = await Submission.find({ student: req.user._id })
        .sort('-submittedAt')
        .limit(10)
        .lean(); // Use lean for faster queries
      
      console.log('Basic submissions found:', submissions.length);
      
      if (submissions.length === 0) {
        console.log('No submissions found for student');
        return res.json([]);
      }
      
      // Get exam IDs and fetch exam details separately
      const examIds = submissions.map(s => s.exam);
      console.log('Exam IDs to fetch:', examIds);
      
      // Import Exam model at the top if not already imported
      const Exam = (await import('../models/Exam.js')).default;
      
      const exams = await Exam.find({ _id: { $in: examIds } })
        .select('title subject duration')
        .lean();
      
      console.log('Exams found:', exams.length);
      
      // Create exam lookup map
      const examMap = {};
      exams.forEach(exam => {
        examMap[exam._id.toString()] = exam;
      });

      // Transform submissions
      const transformedSubmissions = submissions.map(submission => {
        const exam = examMap[submission.exam.toString()] || {};
        return {
          _id: submission._id,
          examId: {
            _id: submission.exam,
            title: exam.title || 'Unknown Exam',
            subject: exam.subject || 'Unknown',
            duration: exam.duration || 0
          },
          submittedAt: submission.submittedAt,
          score: submission.score || null,
          maxScore: submission.maxScore || 100,
          timeSpent: submission.timeSpent || 0,
          status: submission.status || 'submitted'
        };
      });

      console.log('Transformed submissions:', transformedSubmissions.length);
      console.log('=== END MY SUBMISSIONS DEBUG ===');
      
      res.json(transformedSubmissions);
    } catch (error) {
      console.error('Error in my-submissions:', error);
      res.status(500).json({ message: 'Error fetching submissions', error: error.message });
    }
  }));

  // @route   GET /api/submissions/:id
  // @desc    Get submission by ID
  // @access  Private
  router.get('/:id', protect, asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id)
      .populate('exam')
      .populate('student', 'name email');

    if (submission) {
      // Check if user has access to this submission
      if (
        req.user.role === 'student' && 
        submission.student._id.toString() !== req.user._id.toString()
      ) {
        res.status(403);
        throw new Error('Not authorized to view this submission');
      }

      res.json(submission);
    } else {
      res.status(404);
      throw new Error('Submission not found');
    }
  }));

  // @route   GET /api/submissions/file/:id
  // @desc    Get submission file (supports both GridFS and Cloudinary)
  // @access  Private (instructor only)
  router.get('/file/:id', protect, instructor, asyncHandler(async (req, res) => {
    try {
      const submission = await Submission.findById(req.params.id);
      
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      // For Cloudinary URLs, redirect to the secure URL
      if (submission.storageType === 'cloudinary' && submission.cloudinaryUrl) {
        return res.redirect(submission.cloudinaryUrl);
      }
      // For GridFS files
      else if (submission.fileId) {
        const fileStream = await retrievePDF(submission.fileId);
        if (!fileStream) {
          return res.status(404).json({ message: 'File not found in GridFS' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${submission.fileName || 'submission.pdf'}"`
        );

        return fileStream.pipe(res);
      }
      // For text-only or emergency submissions
      else if (submission.textOnly || submission.emergencyData) {
        const content = submission.textOnly 
          ? Buffer.from(submission.fallbackReason || 'Text-only submission')
          : Buffer.from(JSON.stringify(submission.emergencyData, null, 2));

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${submission.fileName || 'submission.txt'}"`
        );

        return res.send(content);
      }
      else {
        return res.status(400).json({ message: 'No valid file data found for this submission' });
      }
    } catch (error) {
      console.error('Error retrieving submission file:', error);
      return res.status(500).json({ message: 'Error retrieving file' });
    }
  }));

  // @route   PUT /api/submissions/:id/grade
  // @desc    Grade a submission
  // @access  Private/Instructor
  router.put('/:id/grade', protect, instructor, asyncHandler(async (req, res) => {
    const { grade, feedback } = req.body;

    const submission = await Submission.findById(req.params.id);

    if (submission) {
      submission.grade = grade;
      submission.feedback = feedback;
      submission.gradedAt = Date.now();

      const updatedSubmission = await submission.save();
      res.json(updatedSubmission);
    } else {
      res.status(404);
      throw new Error('Submission not found');
    }
  }));

  // @route   GET /api/submissions/my-submissions
  // @desc    Get recent submissions for logged-in student
  // @access  Private/Student
  // @route   GET /api/submissions/student
  // @desc    Get recent submissions for logged-in student (legacy endpoint)
  // @access  Private
  router.get('/student', protect, asyncHandler(async (req, res) => {
    const submissions = await Submission.find({ student: req.user._id })
      .populate('exam', 'title')
      .sort('-submittedAt')
      .limit(10);

    res.json(submissions);
  }));

  // @route   GET /api/submissions/student/:studentId
  // @desc    Get all submissions for a specific student
  // @access  Private/Instructor
  router.get('/student/:studentId', protect, instructor, asyncHandler(async (req, res) => {
    const submissions = await Submission.find({ student: req.params.studentId })
      .populate('exam', 'title subject duration')
      .sort('-submittedAt');
    
    // Transform submissions to match frontend expectations
    const transformedSubmissions = submissions.map(submission => ({
      _id: submission._id,
      examId: {
        _id: submission.exam._id,
        title: submission.exam.title,
        subject: submission.exam.subject,
        duration: submission.exam.duration
      },
      submittedAt: submission.submittedAt,
      score: submission.score || null,
      maxScore: 100, // Default max score, you can adjust this based on your exam model
      timeSpent: submission.timeSpent || 0,
      status: submission.status || 'submitted'
    }));
    
    res.json(transformedSubmissions);
  }));

  // @route   POST /api/submissions/chunk
  // @desc    Submit a single chunk of a PDF exam
  // @access  Private
  router.post('/chunk', protect, asyncHandler(async (req, res) => {
    const timer = setTimeout(() => {
      console.error('Chunk submission timeout - operation took too long');
    }, 10000); // Log if operation takes more than 10 seconds
    
    try {
      const { submissionId, pdfData, chunkIndex, totalChunks } = req.body;
      
      if (!submissionId) {
        clearTimeout(timer);
        return res.status(400).json({ message: 'Missing submission ID' });
      }
      
      if (!pdfData) {
        clearTimeout(timer);
        return res.status(400).json({ message: 'Missing chunk data' });
      }
      
      if (chunkIndex === undefined || totalChunks === undefined) {
        clearTimeout(timer);
        return res.status(400).json({ message: 'Missing chunk information' });
      }
      
      // Find the submission - it should already exist from /chunk-init
      const submission = await Submission.findById(submissionId);
        
      if (!submission) {
        clearTimeout(timer);
        return res.status(404).json({ 
          message: 'Submission not found. Please initialize chunked upload first with /chunk-init endpoint.'
        });
      }
      
      // Ensure this is the submission owner
      if (submission.student.toString() !== req.user._id.toString()) {
        clearTimeout(timer);
        return res.status(403).json({ message: 'Not authorized to update this submission' });
      }
      
      // Update the chunk status
      const chunkStatus = [...submission.chunkStatus];
      chunkStatus[chunkIndex] = true;
      const receivedChunks = chunkStatus.filter(status => status).length;
      
      const updatedSubmission = await Submission.findByIdAndUpdate(
        submissionId,
        { 
          $set: { 
            [`chunkStatus.${chunkIndex}`]: true,
            'chunks.received': receivedChunks,
            'isChunkedUpload': true // Ensure this is marked as a chunked upload
          }
        },
        { new: true }
      );
      
      console.log(`Received chunk ${chunkIndex + 1}/${totalChunks} for submission ${submissionId}`);
      
      // Store the chunk in GridFS
      try {
        // Handle different base64 prefixes that might come from the client
        let chunkData = pdfData;
        if (chunkData.startsWith('data:application/pdf;base64,')) {
          chunkData = chunkData.replace(/^data:application\/pdf;base64,/, '');
        } else if (chunkData.startsWith('data:application/octet-stream;base64,')) {
          chunkData = chunkData.replace(/^data:application\/octet-stream;base64,/, '');
        }
        
        const chunkBuffer = Buffer.from(chunkData, 'base64');
        
        if (chunkBuffer.length === 0) {
          throw new Error('Empty chunk buffer after conversion');
        }
        
        // Store the chunk with a unique filename including student info
        const safeStudentName = req.body.studentName ? 
          req.body.studentName.replace(/[^a-z0-9]/gi, '_').substring(0, 30) : // Limit length
          'unknown';
        
        const chunkFilename = `${safeStudentName}_chunk_${submissionId}_${chunkIndex}_of_${totalChunks}.bin`;
        
        console.log(`Storing chunk ${chunkIndex + 1}/${totalChunks}, size: ${Math.round(chunkBuffer.length / 1024)}KB`);
        
        await storePDF(chunkBuffer, chunkFilename, {
          submissionId,
          chunkIndex,
          totalChunks,
          userId: req.user._id,
          studentName: req.body.studentName || 'unknown',
          studentId: req.body.studentId || req.user._id,
          examId: req.body.examId,
          isWhiteboardChunk: true,
          attempt: req.body.attempt || 0
        });
        
        // If this is the last chunk, or all chunks are now received, mark for reassembly
        const allChunksReceived = updatedSubmission.chunks.received === updatedSubmission.chunks.total;
        if (allChunksReceived) {
          // Set a flag to indicate reassembly is needed
          // But don't try to do reassembly here - leave that to the finalize endpoint
          await Submission.findByIdAndUpdate(submissionId, { readyForReassembly: true });
          console.log(`All ${totalChunks} chunks received for submission ${submissionId}, ready for reassembly`);
        }
        
        clearTimeout(timer);
        return res.status(200).json({ 
          success: true, 
          message: `Chunk ${chunkIndex + 1} of ${totalChunks} received`,
          received: updatedSubmission.chunks.received,
          total: updatedSubmission.chunks.total,
          complete: allChunksReceived
        });
        
      } catch (chunkError) {
        console.error('Error storing chunk:', chunkError);
        clearTimeout(timer);
        return res.status(500).json({ message: 'Failed to store chunk: ' + chunkError.message });
      }
    } catch (error) {
      console.error('Chunk upload error:', error);
      clearTimeout(timer);
      return res.status(500).json({ message: 'Server error processing chunk: ' + error.message });
    }
  }));
  
  // @route   POST /api/submissions/chunk-init
  // @desc    Initialize a chunked submission and create submission record
  // @access  Private
  router.post('/chunk-init', protect, asyncHandler(async (req, res) => {
    const timer = setTimeout(() => {
      console.error('Chunk initialization timeout');
    }, 5000);
    
    try {
      const { examId, studentName, studentId, totalChunks, fileName } = req.body;
      
      // Basic validation
      if (!examId) {
        clearTimeout(timer);
        return res.status(400).json({ message: 'Missing exam ID' });
      }
      
      if (!totalChunks || totalChunks <= 0) {
        clearTimeout(timer);
        return res.status(400).json({ message: 'Invalid chunk count' });
      }
      
      // Check if the student has already submitted this exam
      const existingSubmission = await Submission.findOne({ 
        exam: examId,
        student: req.user._id,
        reassemblyComplete: true // Only count completed submissions
      });
      
      if (existingSubmission) {
        console.log('Student has already submitted this exam');
        clearTimeout(timer);
        return res.status(400).json({ message: 'You have already submitted this exam' });
      }
      
      // Create a new submission record for chunked upload
      const submission = await Submission.create({
        exam: examId,
        student: req.user._id,
        isChunkedUpload: true,
        chunks: {
          received: 0,
          total: totalChunks
        },
        chunkStatus: Array(totalChunks).fill(false), // Track which chunks have been received
        submittedAt: new Date(),
        fileName: fileName || `${studentName || 'unknown'}_exam_${examId}_chunks.pdf` // Store the final filename to use
      });
      
      console.log(`Initialized chunked submission: ${submission._id} with ${totalChunks} expected chunks`);
      
      clearTimeout(timer);
      return res.status(201).json({
        success: true,
        submissionId: submission._id,
        message: `Chunked upload initialized with ${totalChunks} expected chunks`
      });
      
    } catch (error) {
      console.error('Error initializing chunked submission:', error);
      clearTimeout(timer);
      return res.status(500).json({ message: 'Server error initializing chunked upload: ' + error.message });
    }
  }));
  
  // @route   GET /api/submissions/exam/:examId/files
  // @desc    Get all PDF submissions for an exam (for instructors)
  // @access  Private/Instructor
  router.get('/exam/:examId/files', protect, instructor, asyncHandler(async (req, res) => {
    try {
      // Get all submissions for the exam
      const submissions = await Submission.find({ exam: req.params.examId })
        .populate('student', 'name email')
        .sort('-submittedAt');

      // Get PDF files metadata from GridFS
      const examPDFs = await listExamPDFs(req.params.examId);

      // Combine submission data with PDF metadata
      const submissionsWithFiles = submissions.map(submission => {
        const pdfFile = examPDFs.find(pdf => 
          pdf._id.toString() === submission.fileId.toString()
        );
        
        return {
          _id: submission._id,
          student: submission.student,
          fileName: submission.fileName,
          fileId: submission.fileId,
          submittedAt: submission.submittedAt,
          grade: submission.grade,
          feedback: submission.feedback,
          fileSize: pdfFile ? pdfFile.length : null,
          uploadDate: pdfFile ? pdfFile.uploadDate : null
        };
      });

      res.json(submissionsWithFiles);
    } catch (error) {
      console.error('Error fetching exam submissions:', error);
      res.status(500);
      throw new Error('Failed to fetch exam submissions');
    }
  }));

  // @route   POST /api/submissions/retry
  // @desc    Alternative endpoint for retry attempts with streamlined processing
  // @access  Private
  router.post('/retry', protect, asyncHandler(async (req, res) => {
    try {
      console.log('=== RETRY SUBMISSION ENDPOINT CALLED ===');
      console.log('User:', req.user ? { id: req.user._id, name: req.user.name } : 'No user');
      
      const { examId, studentName, pdfData, fileName } = req.body;
      
      // Basic validation
      if (!examId || !pdfData) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Convert base64 PDF to buffer
      const pdfBuffer = Buffer.from(pdfData, 'base64');
      
      // Use provided filename or create one
      const finalFileName = fileName || `${studentName.replace(/[^a-z0-9]/gi, '_')}_exam_${examId}_retry_${Date.now()}.pdf`;
      
      // Store PDF with minimal metadata for speed
      const fileInfo = await storePDF(pdfBuffer, finalFileName, {
        examId,
        studentId: req.user._id,
        isRetry: true
      });
      
      // Create a simpler submission record
      const submission = await Submission.create({
        exam: examId,
        student: req.user._id,
        fileName: finalFileName,
        fileId: fileInfo._id,
        submittedAt: new Date()
      });
      
      console.log('Retry submission successful:', submission._id);
      
      return res.status(201).json({
        success: true,
        message: 'Exam retry submitted successfully!',
        submissionId: submission._id
      });
    } catch (error) {
      console.error('Retry submission error:', error);
      return res.status(500).json({ message: 'Server error during retry submission' });
    }
  }));
  
  // @route   POST /api/submissions/emergency
  // @desc    Handle emergency text-only submissions when PDF upload fails
  // @access  Private (but auth check bypassed for emergency situations)
  router.post('/emergency', asyncHandler(async (req, res) => {
    try {
      console.log('=== EMERGENCY SUBMISSION ENDPOINT CALLED ===');
      console.log('User:', req.user ? { id: req.user._id, name: req.user.name, email: req.user.email } : 'No user');
      
      const { 
        examId, studentName, studentId, pageInfo, errorStatus, 
        autoFallback, emergency, forcedComplete, fileName = 'emergency_submission.txt' 
      } = req.body;
      
      if (!examId) {
        return res.status(400).json({ message: 'Missing exam ID' });
      }

      // Create a simple data record for the submission
      // Handle the case when req.user might not exist (auth check was bypassed)
      const submissionData = {
        examId,
        studentName: studentName || (req.user ? req.user.name : 'unknown'),
        studentId: studentId || (req.user ? req.user._id : 'emergency-user'),
        submittedAt: new Date(),
        pageInfo,
        errorStatus,
        autoFallback,
        emergency,
        forcedComplete,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
      };
      
      // Log the data immediately so we have it even if DB operations fail
      console.log('EMERGENCY SUBMISSION DATA:', JSON.stringify(submissionData, null, 2));
      
      // Determine user ID - might not have req.user if auth was bypassed in emergency
      let userId = submissionData.studentId;
      try {
        userId = req.user ? req.user._id : (submissionData.studentId || 'emergency-user');
      } catch (userError) {
        console.warn('Could not determine user ID for emergency submission:', userError);
      }
      
      // Create the database record first - this is the most important part
      // and we want to ensure it's created quickly without any file operations
      const submission = await Submission.create({
        exam: examId,
        student: userId,
        fileName: fileName,
        submittedAt: new Date(),
        textOnly: true,
        fallbackReason: errorStatus || 
                        (forcedComplete ? 'Forced complete emergency submission' : 
                         autoFallback ? 'Auto fallback emergency submission' : 
                         'Emergency text submission'),
        emergencyData: submissionData // Store the data directly in the document
      });
      
      console.log('Emergency submission record created:', submission._id);
      
      // Return success quickly before doing any heavy operations
      res.status(201).json({
        success: true,
        message: 'Emergency submission recorded',
        submissionId: submission._id
      });
      
      // After response is sent, try to store the file in GridFS asynchronously
      // We do this in the background so it doesn't delay the response
      try {
        const textContent = JSON.stringify(submissionData, null, 2);
        const textBuffer = Buffer.from(textContent, 'utf8');
        
        // Store text file in GridFS as a record, but don't wait for it to complete
        storePDF(textBuffer, fileName, {
          examId: examId,
          studentId: submissionData.studentId, // Use the value we already determined
          studentName: submissionData.studentName, // Use the value we already determined
          submissionDate: new Date(),
          isEmergencySubmission: true
        }).then(fileInfo => {
          // Update the submission with the file ID if the GridFS storage succeeded
          if (fileInfo && fileInfo._id) {
            Submission.findByIdAndUpdate(submission._id, { fileId: fileInfo._id })
              .catch(err => console.error('Error updating submission with fileId:', err));
          }
        }).catch(err => {
          console.error('Background GridFS storage failed for emergency submission:', err);
          // The submission record still exists in the database, so this is not critical
        });
      } catch (backgroundError) {
        console.error('Error in background processing of emergency submission file:', backgroundError);
        // This error doesn't affect the API response since we've already responded
      }
      
      // We've already sent the response, so no need to return anything here
      // Note: Don't add any more return statements after this point
      
      // Notify the instructor in the background (future enhancement)
      // Implementation would go here
      
    } catch (error) {
      console.error('Emergency submission error:', error);
      return res.status(500).json({ message: 'Server error during emergency submission' });
    }
  }));

  // @route   POST /api/submissions/chunk-finalize
  // @desc    Finalize a chunked submission and trigger reassembly
  // @access  Private
  router.post('/chunk-finalize', protect, asyncHandler(async (req, res) => {
    const timer = setTimeout(() => {
      console.error('Chunk finalization timeout');
    }, 10000);
    
    try {
      const { submissionId, examId, totalChunks } = req.body;
      
      if (!submissionId) {
        clearTimeout(timer);
        return res.status(400).json({ message: 'Missing submission ID' });
      }
      
      // Find the submission
      const submission = await Submission.findById(submissionId);
      
      if (!submission) {
        clearTimeout(timer);
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      // Ensure this is the submission owner
      if (submission.student.toString() !== req.user._id.toString()) {
        clearTimeout(timer);
        return res.status(403).json({ message: 'Not authorized to finalize this submission' });
      }
      
      // Verify chunks have been received
      const receivedChunks = submission.chunkStatus.filter(status => status).length;
      const allChunksReceived = receivedChunks === submission.chunks.total;
      
      if (!allChunksReceived) {
        console.log(`Finalizing incomplete submission: ${receivedChunks}/${submission.chunks.total} chunks received`);
        
        // Update the record to reflect missing chunks
        submission.chunks.received = receivedChunks;
        submission.readyForReassembly = true; // Still try to reassemble with available chunks
        await submission.save();
      }
      
      console.log(`Finalizing submission ${submissionId} with ${receivedChunks}/${submission.chunks.total} chunks`);
      
      // Now perform actual reassembly
      try {
        console.log(`Starting reassembly process for submission ${submissionId}`);
        
        // Set reassembly flag to true to prevent duplicate processing
        submission.readyForReassembly = true;
        await submission.save();
        
        // Find all chunk files in GridFS with their real file IDs
        const chunkFileIds = [];
        let missingChunks = false;
        
        console.log(`Looking up ${submission.chunks.total} possible chunks in GridFS...`);
        
        // Search with more flexible criteria to catch any chunks that might have wrong metadata
        // First try with the precise query
        for (let i = 0; i < submission.chunks.total; i++) {
          // Only include chunks that were actually received according to our status
          if (submission.chunkStatus[i]) {
            // Get the stored chunk file ID from the metadata - retry with multiple strategies
            try {
              // Strategy 1: Look up the chunk file based on submission ID and chunk index
              let chunkFiles = await mongoose.connection.db.collection('examSubmissions.files').find({
                'metadata.submissionId': submissionId.toString(),
                'metadata.chunkIndex': i
              }).toArray();
              
              // Strategy 2: If not found, try with numeric chunk index (in case of type issues)
              if (!chunkFiles || chunkFiles.length === 0) {
                chunkFiles = await mongoose.connection.db.collection('examSubmissions.files').find({
                  'metadata.submissionId': submissionId.toString(),
                  'metadata.chunkIndex': Number(i)
                }).toArray();
              }
              
              // Strategy 3: If still not found, look up by chunk filename pattern
              if (!chunkFiles || chunkFiles.length === 0) {
                const chunkPattern = new RegExp(`_chunk_${submissionId}_${i}_of_`);
                chunkFiles = await mongoose.connection.db.collection('examSubmissions.files').find({
                  'filename': chunkPattern
                }).toArray();
              }
              
              if (chunkFiles && chunkFiles.length > 0) {
                chunkFileIds.push(chunkFiles[0]._id);
                console.log(`Found chunk ${i} with ID ${chunkFiles[0]._id}`);
              } else {
                console.warn(`Could not find chunk file for submission ${submissionId}, chunk ${i} after multiple search strategies`);
                missingChunks = true;
              }
            } catch (lookupError) {
              console.error(`Error looking up chunk ${i} for submission ${submissionId}:`, lookupError);
              missingChunks = true;
            }
          } else {
            console.warn(`Chunk ${i} marked as not received in submission status`);
            missingChunks = true;
          }
        }
        
        console.log(`Found ${chunkFileIds.length} valid chunk files for reassembly out of ${submission.chunks.total} total chunks`);
        
        if (chunkFileIds.length === 0) {
          throw new Error('No valid chunk files found for reassembly');
        }
        
        // Create a final filename for the reassembled PDF
        const finalFileName = submission.fileName || `${req.user.name.replace(/[^a-z0-9]/gi, '_')}_exam_${examId}_reassembled.pdf`;
        
        // Check if we need to create a fallback text-only submission
        if (missingChunks && chunkFileIds.length < submission.chunks.total * 0.8) {
          // If we're missing more than 20% of chunks, create a text-only record as a fallback
          console.log(`Missing significant chunk data (${chunkFileIds.length}/${submission.chunks.total}). Creating text-only record as fallback`);
          
          // Create a text file with the metadata about the partial submission
          const safeStudentName = req.user.name.replace(/[^a-z0-9]/gi, '_');
          const fallbackFilename = `${safeStudentName}_exam_${examId}_PARTIAL_${Date.now()}.txt`;
          
          const textContent = `
PARTIAL SUBMISSION - REASSEMBLY ISSUE
-----------------------
Student: ${req.user.name}
Exam ID: ${examId}
Submission ID: ${submissionId}
Submitted: ${new Date().toISOString()}
Chunks Received: ${chunkFileIds.length} of ${submission.chunks.total}
Status: Some chunks were missing or corrupted
-----------------------
Note to instructor: The student submitted this exam in chunks, but some chunks were missing during reassembly.
The server received ${chunkFileIds.length} of ${submission.chunks.total} total chunks.
Please contact the student to arrange verification or resubmission if needed.
`;
          const textBuffer = Buffer.from(textContent);
          
          try {
            // Store the text record in GridFS
            const fallbackInfo = await storePDF(textBuffer, fallbackFilename, {
              examId: examId,
              studentId: req.user._id,
              studentName: req.user.name,
              submissionId: submission._id,
              isPartialRecovery: true
            });
            
            // Update the submission record with the fallback ID
            submission.fileName = fallbackFilename;
            submission.fileId = fallbackInfo._id;
            submission.reassemblyComplete = true;
            submission.textOnly = true;
            submission.fallbackReason = `Partial chunks (${chunkFileIds.length}/${submission.chunks.total}) recovered`;
            
            await submission.save();
            
            // Return success with a warning about missing chunks
            clearTimeout(timer);
            return res.status(200).json({
              success: true,
              warning: 'Some chunks were missing. Created text-only record.',
              submissionId: submission._id,
              fileName: fallbackFilename,
              complete: true,
              chunksReceived: chunkFileIds.length,
              chunksTotal: submission.chunks.total,
              textOnly: true
            });
          } catch (fallbackError) {
            console.error('Failed to create fallback text record:', fallbackError);
            // Continue with normal reassembly of partial chunks
          }
        }
        
        // Try to reassemble whatever chunks we have
        try {
          console.log(`Attempting to reassemble ${chunkFileIds.length} chunks into PDF`);
          
          // Use the reassembleChunks function to combine the chunks
          const { fileId, size, chunksReassembled } = await reassembleChunks(
            chunkFileIds, 
            finalFileName, 
            { 
              examId: examId,
              studentId: req.user._id,
              studentName: req.user.name,
              submissionId: submission._id,
              chunksFound: chunkFileIds.length,
              chunksExpected: submission.chunks.total,
              isPartial: missingChunks
            }
          );
          
          console.log(`Successfully reassembled PDF of size ${size} bytes with file ID ${fileId} from ${chunksReassembled} chunks`);
          
          // Mark the submission as complete with the real file ID
          submission.reassemblyComplete = true;
          submission.fileName = finalFileName;
          submission.fileId = fileId;
          
          // Add additional metadata about any issues
          if (missingChunks) {
            submission.fallbackReason = `Reassembled with partial data (${chunksReassembled}/${submission.chunks.total} chunks)`;
          }
          
          await submission.save();
        } catch (reassemblyError) {
          // If reassembly fails, try to create an emergency text record
          console.error('Reassembly failed:', reassemblyError);
          
          // Create emergency text file
          const emergencyFilename = `${req.user.name.replace(/[^a-z0-9]/gi, '_')}_exam_${examId}_EMERGENCY_${Date.now()}.txt`;
          const emergencyContent = `
EMERGENCY RECORD - REASSEMBLY FAILED
-----------------------
Student: ${req.user.name}
Exam ID: ${examId}
Submission ID: ${submissionId}
Submitted: ${new Date().toISOString()}
Chunks Found: ${chunkFileIds.length} of ${submission.chunks.total}
Error: ${reassemblyError.message}
-----------------------
Note to instructor: The system found ${chunkFileIds.length} chunks but could not reassemble them into a PDF.
Please contact the student to arrange verification or resubmission.
`;
          
          try {
            // Store emergency text record
            const emergencyInfo = await storePDF(Buffer.from(emergencyContent), emergencyFilename, {
              examId: examId,
              studentId: req.user._id,
              studentName: req.user.name,
              submissionId: submission._id,
              isEmergencyRecord: true
            });
            
            // Update submission with emergency info
            submission.fileName = emergencyFilename;
            submission.fileId = emergencyInfo._id;
            submission.reassemblyComplete = true;
            submission.textOnly = true;
            submission.fallbackReason = `Reassembly failed: ${reassemblyError.message}`;
            
            await submission.save();
            
            // Return success with emergency info
            clearTimeout(timer);
            return res.status(200).json({
              success: true,
              warning: 'Reassembly failed. Created emergency record.',
              submissionId: submission._id,
              fileName: emergencyFilename,
              complete: true,
              textOnly: true,
              error: reassemblyError.message
            });
          } catch (emergencyError) {
            throw reassemblyError; // If even emergency record fails, throw original error
          }
        }
        
        clearTimeout(timer);
        return res.status(200).json({
          success: true,
          message: `Chunked upload finalized with ${receivedChunks}/${submission.chunks.total} chunks received`,
          submissionId: submission._id,
          fileName: finalFileName,
          complete: true
        });
      } catch (reassemblyError) {
        console.error('Error during chunk reassembly:', reassemblyError);
        clearTimeout(timer);
        return res.status(500).json({ message: 'Failed to reassemble chunks: ' + reassemblyError.message });
      }
      
    } catch (error) {
      console.error('Error finalizing chunked submission:', error);
      clearTimeout(timer);
      return res.status(500).json({ message: 'Server error finalizing chunked upload: ' + error.message });
    }
  }));

  // @route   POST /api/submissions/ultra-simple
  // @desc    Ultra simple submission endpoint with minimal dependencies
  // @access  Private
  router.post('/ultra-simple', asyncHandler(async (req, res) => {
    try {
      console.log('=== ULTRA SIMPLE SUBMISSION ENDPOINT CALLED ===');
      // Note: We don't even check auth here to maximize chances of success
      
      const { examId, studentName, studentId } = req.body;
      
      // Create a minimal record with whatever info we have
      const submissionData = {
        examId: examId || 'unknown',
        studentName: studentName || 'unknown',
        studentId: studentId || 'unknown',
        timestamp: new Date(),
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        isUltraSimple: true
      };
      
      // Log the data immediately so we have it even if DB operations fail
      console.log('EMERGENCY SUBMISSION DATA:', JSON.stringify(submissionData, null, 2));
      
      // Try to create a record in the database
      let submission = null;
      try {
        submission = await Submission.create({
          exam: examId,
          student: req.user ? req.user._id : studentId || 'emergency-user',
          submittedAt: new Date(),
          textOnly: true,
          fallbackReason: 'Ultra-simple emergency submission',
          emergencyData: submissionData
        });
        
        console.log('Ultra-simple submission created in database:', submission._id);
      } catch (dbError) {
        console.error('Failed to create database record for ultra-simple submission:', dbError);
        // Continue even if database operations fail
      }
      
      // Return success regardless of database operations
      return res.status(200).json({
        success: true,
        message: 'Emergency data received and logged',
        recorded: !!submission,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Log the error but still try to return a success response
      console.error('Ultra-simple submission error:', error);
      
      // Even if there's an error, try to return a success response
      // This is our last resort to acknowledge receipt of data
      try {
        return res.status(200).json({
          success: true,
          message: 'Received data despite errors',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } catch (responseError) {
        // If we can't even send a response, there's nothing more we can do
        console.error('Failed to send response for ultra-simple submission:', responseError);
      }
    }
  }));

  // @route   GET /api/submissions/check/:examId
  // @desc    Check if student has already submitted this exam
  // @access  Private
  router.get('/check/:examId', protect, asyncHandler(async (req, res) => {
    try {
      const { examId } = req.params;
      
      // Check if the student has already submitted this exam
      const existingSubmission = await Submission.findOne({ 
        exam: examId,
        student: req.user._id
      });
      
      if (existingSubmission) {
        return res.json({ 
          hasSubmission: true, 
          submissionId: existingSubmission._id,
          submittedAt: existingSubmission.submittedAt
        });
      } else {
        return res.json({ hasSubmission: false });
      }
    } catch (error) {
      console.error('Error checking submission:', error);
      return res.status(500).json({ message: 'Error checking submission status' });
    }
  }));

  return router;
}

export default createSubmissionsRouter;
