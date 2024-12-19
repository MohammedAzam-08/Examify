import mongoose from 'mongoose';

const examSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    questions: [{
      question: String,
      marks: Number,
    }],
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model('Exam', examSchema);
export default Exam;