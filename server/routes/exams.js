import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, instructor } from '../middleware/authMiddleware.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';

const router = express.Router();

// @route   GET /api/exams/debug
// @desc    Debug endpoint to check exams without auth (temporary)
// @access  Public
router.get('/debug', asyncHandler(async (req, res) => {
  const exams = await Exam.find({})
    .populate('instructor', 'name email')
    .populate('enrolledStudents', 'name email course semester');
  
  res.json({
    totalExams: exams.length,
    exams: exams.map(exam => ({
      _id: exam._id,
      title: exam.title,
      course: exam.course,
      semester: exam.semester,
      instructor: exam.instructor ? {
        name: exam.instructor.name,
        email: exam.instructor.email
      } : null,
      enrolledStudentsCount: exam.enrolledStudents ? exam.enrolledStudents.length : 0,
      enrolledStudents: exam.enrolledStudents ? exam.enrolledStudents.map(s => ({
        _id: s._id,
        name: s.name,
        email: s.email,
        course: s.course,
        semester: s.semester
      })) : []
    }))
  });
}));

// @route   POST /api/exams
// @desc    Create a new exam
// @access  Private/Instructor
router.post('/', protect, instructor, asyncHandler(async (req, res) => {
  const { title, subject, course, semester, instructions, duration, scheduledStart, questions, enrolledStudents } = req.body;

  console.log('Creating exam with data:', {
    title,
    course,
    semester,
    enrolledStudentsCount: enrolledStudents ? enrolledStudents.length : 0,
    enrolledStudents
  });

  // Validate enrolled students exist (only if there are any)
  if (enrolledStudents && enrolledStudents.length > 0) {
    const students = await User.find({ _id: { $in: enrolledStudents }, role: 'student' });
    console.log(`Found ${students.length} valid students out of ${enrolledStudents.length} provided`);
    console.log('Valid students:', students.map(s => ({ _id: s._id, name: s.name, email: s.email })));
    
    if (students.length !== enrolledStudents.length) {
      res.status(400);
      throw new Error('One or more selected students are invalid');
    }
  } else {
    console.log('No enrolled students provided - exam will have no students assigned');
  }

  const exam = await Exam.create({
    title,
    subject,
    course,
    semester,
    instructions,
    duration,
    scheduledStart,
    questions,
    instructor: req.user._id,
    enrolledStudents: enrolledStudents || []
  });

  console.log('Exam created successfully with ID:', exam._id);
  res.status(201).json(exam);
}));

// @route   GET /api/exams
// @desc    Get all exams (filtered by role)
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  let exams;
  
  if (req.user.role === 'instructor') {
    exams = await Exam.find({ instructor: req.user._id })
      .populate('enrolledStudents', 'name email')
      .sort('-scheduledStart');
  } else {
    exams = await Exam.find({ enrolledStudents: req.user._id })
      .populate('instructor', 'name email')
      .sort('-scheduledStart');
  }
  res.json(exams);
}));

// @route   GET /api/exams/student/stats
// @desc    Get student exam statistics for dashboard
// @access  Private/Student
router.get('/student/stats', protect, asyncHandler(async (req, res) => {
  try {
    console.log('=== STUDENT STATS DEBUG ===');
    console.log('Student ID:', req.user._id);
    console.log('Student name:', req.user.name);
    console.log('Student email:', req.user.email);
    console.log('Student role:', req.user.role);
    
    // Get all exams the student is enrolled in
    const studentExams = await Exam.find({ enrolledStudents: req.user._id });
    console.log('Student exams found:', studentExams.length);
    console.log('Student exam titles:', studentExams.map(e => e.title));
    
    // Get all submissions for this student
    const submissions = await Submission.find({ student: req.user._id })
      .populate('exam', 'title');
    console.log('Student submissions found:', submissions.length);
    
    // Calculate statistics
    const now = new Date();
    const upcomingExams = studentExams.filter(exam => 
      new Date(exam.scheduledStart) > now
    );
    console.log('Upcoming exams:', upcomingExams.length);
    
    // Calculate average score from graded submissions
    const gradedSubmissions = submissions.filter(s => 
      s.status === 'graded' && s.score !== null && s.score !== undefined
    );
    console.log('Graded submissions:', gradedSubmissions.length);
    
    const averageScore = gradedSubmissions.length > 0 
      ? Math.round(gradedSubmissions.reduce((sum, s) => 
          sum + ((s.score / (s.maxScore || 100)) * 100), 0
        ) / gradedSubmissions.length)
      : 0;

    const stats = {
      totalExams: studentExams.length,
      completedExams: submissions.length,
      averageScore: averageScore,
      upcomingExams: upcomingExams.length
    };

    console.log('Final stats:', stats);
    console.log('=== END STUDENT STATS DEBUG ===');

    res.json(stats);
  } catch (error) {
    console.error('Error getting student stats:', error);
    res.status(500).json({ message: 'Failed to get student statistics' });
  }
}));

// @route   GET /api/exams/:id
// @desc    Get exam by ID
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate('instructor', 'name email')
    .populate('enrolledStudents', 'name email');

  if (exam) {
    // Check if user has access to this exam
    if (req.user.role === 'instructor' && exam.instructor._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this exam');
    }
    
    if (req.user.role === 'student' && !exam.enrolledStudents.find(s => s._id.toString() === req.user._id.toString())) {
      res.status(403);
      throw new Error('Not enrolled in this exam');
    }
    
    // For students, check if they have already submitted this exam
    // Only block access if this is not a review request (indicated by query parameter)
    if (req.user.role === 'student' && req.query.review !== 'true') {
      const existingSubmission = await Submission.findOne({
        exam: req.params.id,
        student: req.user._id
      });
      
      if (existingSubmission) {
        res.status(409); // Conflict status code
        throw new Error('You have already submitted this exam and cannot retake it');
      }
    }
    
    res.json(exam);
  } else {
    res.status(404);
    throw new Error('Exam not found');
  }
}));

// @route   PUT /api/exams/:id
// @desc    Update exam
// @access  Private/Instructor
router.put('/:id', protect, instructor, asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (exam) {
    if (exam.instructor.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this exam');
    }

    exam.title = req.body.title || exam.title;
    exam.subject = req.body.subject || exam.subject;
    exam.instructions = req.body.instructions || exam.instructions;
    exam.duration = req.body.duration || exam.duration;
    exam.scheduledStart = req.body.scheduledStart || exam.scheduledStart;
    exam.questions = req.body.questions || exam.questions;
    exam.enrolledStudents = req.body.enrolledStudents || exam.enrolledStudents;

    const updatedExam = await exam.save();
    res.json(updatedExam);
  } else {
    res.status(404);
    throw new Error('Exam not found');
  }
}));

// @route   DELETE /api/exams/:id
// @desc    Delete exam
// @access  Private/Instructor
router.delete('/:id', protect, instructor, asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (exam) {
    if (exam.instructor.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this exam');
    }

    await exam.deleteOne();
    res.json({ message: 'Exam removed' });
  } else {
    res.status(404);
    throw new Error('Exam not found');
  }
}));

// @route   GET /api/exams/instructor/stats
// @desc    Get instructor exam statistics
// @access  Private/Instructor
router.get('/instructor/stats', protect, instructor, asyncHandler(async (req, res) => {
  // Get exam stats for this instructor
  const examStats = await Exam.aggregate([
    { $match: { instructor: req.user._id } },
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        upcomingExams: {
          $sum: {
            $cond: [{ $gt: ['$scheduledStart', new Date()] }, 1, 0]
          }
        },
        completedExams: {
          $sum: {
            $cond: [{ $lt: ['$scheduledStart', new Date()] }, 1, 0]
          }
        }
      }
    }
  ]);

  // Get total number of students in the system
  const totalStudentsCount = await User.countDocuments({ role: 'student' });

  const stats = examStats[0] || {
    totalExams: 0,
    upcomingExams: 0,
    completedExams: 0
  };

  stats.totalStudents = totalStudentsCount;

  res.json(stats);
}));

// @route   GET /api/exams/upcoming
// @desc    Get upcoming exams for instructor
// @access  Private/Instructor
router.get('/upcoming', protect, instructor, asyncHandler(async (req, res) => {
  const upcomingExams = await Exam.find({
    instructor: req.user._id,
    scheduledStart: { $gt: new Date() }
  })
  .sort('scheduledStart')
  .limit(10);

  res.json(upcomingExams);
}));

// @route   POST /api/exams/submit
// @desc    Emergency submission endpoint when other routes fail
// @access  Public (intentionally no auth to maximize chances of success)
router.post('/submit', asyncHandler(async (req, res) => {
  try {
    console.log('=== EMERGENCY EXAM SUBMISSION ENDPOINT CALLED ===');
    
    const { examId, studentName, studentId, imageData } = req.body;
    
    if (!examId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing exam ID' 
      });
    }
    
    // Log the submission data immediately for maximum recovery options
    console.log('EMERGENCY SUBMISSION DATA:', JSON.stringify({
      examId,
      studentName,
      studentId,
      timestamp: new Date().toISOString(),
      hasImageData: !!imageData,
      imageSize: imageData ? `${Math.round(imageData.length / 1024)}KB` : '0KB',
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    }, null, 2));
    
    // Try to create a submission record with whatever data we have
    try {
      const submission = await Submission.create({
        exam: examId,
        student: studentId || 'emergency-user',
        submittedAt: new Date(),
        textOnly: true,
        fallbackReason: 'Emergency submission via exams/submit endpoint',
        emergencyData: {
          ...req.body,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('Emergency submission record created:', submission._id);
      
      return res.status(201).json({
        success: true,
        message: 'Emergency submission recorded',
        submissionId: submission._id
      });
    } catch (dbError) {
      console.error('Failed to create submission record:', dbError);
      // Still return success to client to avoid retries
      return res.status(200).json({
        success: true,
        message: 'Emergency data logged but record creation failed',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error in emergency exam submission endpoint:', error);
    // Always return success to stop client from retrying
    return res.status(200).json({
      success: true,
      message: 'Emergency submission logged with errors',
      error: error.message
    });
  }
}));

export default router;
