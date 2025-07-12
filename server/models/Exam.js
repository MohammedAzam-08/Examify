import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  }
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true,
    enum: ['MCA', 'BCA', 'BSc']
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  targetGroup: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    required: true
  },
  scheduledStart: {
    type: Date,
    required: true
  },
  questions: [questionSchema],
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const Exam = mongoose.model('Exam', examSchema);
export default Exam;