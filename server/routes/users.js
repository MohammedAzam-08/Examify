import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/users/students
// @desc    Get all registered students (with optional filtering)
// @access  Private
router.get('/students', protect, asyncHandler(async (req, res) => {
  const { course, semester } = req.query;
  
  // Build filter object
  const filter = { role: 'student' };
  if (course) {
    filter.course = course;
  }
  if (semester) {
    filter.semester = parseInt(semester.toString());
  }

  console.log('Fetching students with filter:', filter);
  
  const students = await User.find(filter).select('_id name email course semester');
  
  console.log(`Found ${students.length} students matching filter`);
  
  // For API consistency, return the students with the original structure
  if (course && semester) {
    // When filtering for exam assignment, return simple structure
    res.json(students);
  } else {
    // For general student listing, calculate real stats from submissions
    const Submission = (await import('../models/Submission.js')).default;
    
    const studentsWithStats = await Promise.all(students.map(async (student) => {
      try {
        // Get all submissions for this student
        const submissions = await Submission.find({ student: student._id })
          .populate('exam', 'title');
        
        const examsTaken = submissions.length;
        
        // Calculate average score from graded submissions only
        const gradedSubmissions = submissions.filter(s => 
          s.grade !== undefined && s.grade !== null && !isNaN(s.grade)
        );
        
        let averageScore = 0;
        if (gradedSubmissions.length > 0) {
          const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.grade, 0);
          averageScore = Math.round(totalScore / gradedSubmissions.length);
        }
        
        console.log(`Student ${student.name}: ${examsTaken} exams, ${gradedSubmissions.length} graded, avg: ${averageScore}%`);
        
        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          course: student.course || 'N/A',
          semester: student.semester || 0,
          examsTaken: examsTaken,
          averageScore: averageScore
        };
      } catch (error) {
        console.error(`Error calculating stats for student ${student.name}:`, error);
        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          course: student.course || 'N/A',
          semester: student.semester || 0,
          examsTaken: 0,
          averageScore: 0
        };
      }
    }));
    
    res.json(studentsWithStats);
  }
}));

// @route   GET /api/users/students/:studentId
// @desc    Get specific student details
// @access  Private
router.get('/students/:studentId', protect, asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.studentId).select('-password');
  
  if (!student || student.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }
  
  res.json({
    _id: student._id,
    name: student.name,
    email: student.email,
    course: student.course || 'N/A',
    semester: student.semester || 0,
    enrolledAt: student.createdAt || new Date()
  });
}));

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}));

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.course = req.body.course || user.course;
    user.semester = req.body.semester || user.semester;

    if (req.body.password) {
      if (!req.body.oldPassword) {
        res.status(400);
        throw new Error('Current password is required to set a new password');
      }
      const isMatch = await user.matchPassword(req.body.oldPassword);
      if (!isMatch) {
        res.status(400);
        throw new Error('Current password is incorrect');
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      course: updatedUser.course,
      semester: updatedUser.semester,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}));

// @route   GET /api/users/debug-students
// @desc    Debug endpoint to check students without auth (temporary)
// @access  Public
router.get('/debug-students', asyncHandler(async (req, res) => {
  const { course, semester } = req.query;
  
  // Build filter object
  const filter = { role: 'student' };
  if (course) {
    filter.course = course;
  }
  if (semester) {
    filter.semester = parseInt(semester.toString());
  }

  console.log('DEBUG: Fetching students with filter:', filter);
  
  const students = await User.find(filter).select('_id name email course semester');
  
  console.log(`DEBUG: Found ${students.length} students matching filter`);
  
  res.json({
    filter,
    studentsFound: students.length,
    students: students.map(s => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      course: s.course,
      semester: s.semester
    }))
  });
}));

export default router;
