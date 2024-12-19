import mongoose from 'mongoose';

const submissionSchema = mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Exam',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    fileUrl: {
      type: String,
      required: true,
    },
    marks: {
      type: Number,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'submitted', 'graded'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;