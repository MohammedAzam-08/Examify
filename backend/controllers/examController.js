import asyncHandler from 'express-async-handler';
import { bucket } from '../config/firebase.js';
import Exam from '../models/examModel.js';
import Submission from '../models/submissionModel.js';
import User from '../models/User.js';

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Faculty
const createExam = asyncHandler(async (req, res) => {
  const { title, subject, duration, startTime, endTime, questions } = req.body;

  const students = await User.find({ role: 'student' }).select('_id');
  const studentIds = students.map(student => student._id);

  const exam = await Exam.create({
    title,
    subject,
    duration,
    startTime,
    endTime,
    questions,
    students: studentIds,
    faculty: req.user._id,
  });

  res.status(201).json(exam);
});

// @desc    Get all exams for a user
// @route   GET /api/exams
// @access  Private
const getExams = asyncHandler(async (req, res) => {
  let exams;
  
  if (req.user.role === 'faculty') {
    exams = await Exam.find({ faculty: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    for (let exam of exams) {
      const submissionCount = await Submission.countDocuments({ exam: exam._id });
      exam.submissions = submissionCount;
    }
  } else {
    exams = await Exam.find({ 
      students: req.user._id,
      endTime: { $gte: new Date() }
    })
    .sort({ startTime: 1 })
    .lean();

    for (let exam of exams) {
      const submission = await Submission.findOne({
        exam: exam._id,
        student: req.user._id
      });
      exam.submitted = !!submission;
    }
  }

  res.json(exams);
});

// @desc    Submit exam
// @route   POST /api/exams/:id/submit
// @access  Private/Student
const submitExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,
    students: req.user._id
  });

  if (!exam) {
    res.status(404);
    throw new Error('Exam not found or not authorized');
  }

  const now = new Date();
  const examEnd = new Date(exam.endTime);

  if (now > examEnd) {
    res.status(400);
    throw new Error('Exam time has expired');
  }

  const existingSubmission = await Submission.findOne({
    exam: exam._id,
    student: req.user._id
  });

  if (existingSubmission) {
    res.status(400);
    throw new Error('You have already submitted this exam');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload your answer sheet');
  }

  try {
    const fileName = `submissions/${exam._id}/${req.user._id}/${Date.now()}-${req.file.originalname}`;
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500);
      throw new Error('Failed to upload file');
    });

    blobStream.on('finish', async () => {
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      const submission = await Submission.create({
        exam: exam._id,
        student: req.user._id,
        fileUrl: publicUrl,
        status: 'submitted',
        submittedAt: now
      });

      res.status(201).json(submission);
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500);
    throw new Error('Failed to upload file');
  }
});

// @desc    Grade exam submission
// @route   POST /api/exams/:id/grade/:submissionId
// @access  Private/Faculty
const gradeExam = asyncHandler(async (req, res) => {
  const { marks } = req.body;
  
  const exam = await Exam.findOne({
    _id: req.params.id,
    faculty: req.user._id
  });

  if (!exam) {
    res.status(404);
    throw new Error('Exam not found or not authorized');
  }

  const submission = await Submission.findById(req.params.submissionId);
  
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  submission.marks = marks;
  submission.status = 'graded';
  await submission.save();

  res.json(submission);
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  if (req.user.role === 'faculty') {
    if (exam.faculty.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this exam');
    }

    const submissions = await Submission.find({ exam: exam._id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    res.json({
      ...exam.toObject(),
      submissions
    });
  } else {
    if (!exam.students.includes(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to access this exam');
    }

    const submission = await Submission.findOne({
      exam: exam._id,
      student: req.user._id
    });

    res.json({
      ...exam.toObject(),
      submitted: !!submission
    });
  }
});

export { createExam, getExams, getExamById, submitExam, gradeExam };