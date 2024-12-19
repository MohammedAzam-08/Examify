import express from 'express';
import {
  createExam,
  getExams,
  getExamById,
  submitExam,
  gradeExam,
} from '../controllers/examController.js';
import { protect, faculty } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
  .get(protect, getExams)
  .post(protect, faculty, createExam);

router.route('/:id')
  .get(protect, getExamById);

router.route('/:id/submit')
  .post(protect, upload.single('answerSheet'), submitExam);

router.route('/:id/grade/:submissionId')
  .post(protect, faculty, gradeExam);

export default router;