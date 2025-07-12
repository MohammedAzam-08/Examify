import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: function() {
      return !this.isChunkedUpload; // Only required for non-chunked uploads
    }
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: function() {
      return !this.isChunkedUpload; // Only required for complete submissions
    }
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return !this.isChunkedUpload && !this.cloudinaryUrl; // Only required for complete submissions without cloudinary
    }
  },
  // Cloudinary specific fields
  cloudinaryUrl: {
    type: String
  },
  cloudinaryPublicId: {
    type: String
  },
  storageType: {
    type: String,
    enum: ['gridfs', 'cloudinary'],
    default: 'gridfs'
  },
  // Fields for chunked uploads
  isChunkedUpload: {
    type: Boolean,
    default: false
  },
  chunks: {
    received: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  chunkStatus: {
    type: [Boolean],
    default: []
  },
  readyForReassembly: {
    type: Boolean,
    default: false
  },
  reassemblyComplete: {
    type: Boolean,
    default: false
  },
  textOnly: {
    type: Boolean,
    default: false
  },
  fallbackReason: {
    type: String
  },
  // Store emergency submission data directly in the document
  emergencyData: {
    type: mongoose.Schema.Types.Mixed
  },
  // Existing fields
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: Date
}, {
  timestamps: true
});

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;