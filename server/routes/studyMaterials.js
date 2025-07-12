import express from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import mongoose from 'mongoose';
import { protect, instructor } from '../middleware/authMiddleware.js';
import { storeFile, retrieveFile, deletePDF } from '../utils/gridfs.js';

// Study Material Schema (you might want to create a separate model file)
// Question schema for practice tests
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: { type: Number, default: 10 }
});

const studyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['practice', 'video', 'guide', 'flashcard'] 
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: String,
  pages: Number,
  cards: Number,
  subject: { type: String, required: true },
  course: { type: String, required: true },
  semester: { type: Number, required: true },
  content: String,
  videoUrl: String,
  fileUrl: String,
  fileId: mongoose.Schema.Types.ObjectId,
  // Questions for practice tests
  questions: [questionSchema],
  totalPoints: { type: Number, default: 0 },
  passingScore: { type: Number, default: 70 },
  instructor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  isPublished: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

function createStudyMaterialsRouter(mongoUri) {
  const router = express.Router();

  // Configure multer for memory storage
  const storage = multer.memoryStorage();
  const upload = multer({ 
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept PDFs and common document formats
      if (file.mimetype.startsWith('application/pdf') || 
          file.mimetype.startsWith('application/msword') ||
          file.mimetype.startsWith('application/vnd.openxmlformats') ||
          file.mimetype.startsWith('text/')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF and document files are allowed.'));
      }
    }
  });

  // @route   GET /api/study-materials
  // @desc    Get all study materials for instructor
  // @access  Private/Instructor
  router.get('/', protect, instructor, asyncHandler(async (req, res) => {
    const studyMaterials = await StudyMaterial.find({ instructor: req.user._id })
      .sort('-createdAt');
    
    res.json(studyMaterials);
  }));
  
  // @route   GET /api/study-materials/:id
  // @desc    Get study material by ID
  // @access  Private
  router.get('/:id', protect, asyncHandler(async (req, res, next) => {
    // Skip this route for the /published endpoint
    if (req.params.id === 'published') {
      return next();
    }
    
    console.log(`Getting study material with ID: ${req.params.id}`);
    
    try {
      const studyMaterial = await StudyMaterial.findById(req.params.id)
        .populate('instructor', 'name email');
      
      console.log('Study material found:', studyMaterial ? {
        id: studyMaterial._id,
        title: studyMaterial.title,
        type: studyMaterial.type,
        hasContent: Boolean(studyMaterial.content),
        contentLength: studyMaterial.content ? studyMaterial.content.length : 0
      } : 'None');
      
      if (!studyMaterial) {
        res.status(404);
        throw new Error('Study material not found');
      }
      
      // Students can only access published materials
      if (req.user.role === 'student' && !studyMaterial.isPublished) {
        console.log('Student tried to access unpublished material');
        res.status(403);
        throw new Error('This study material is not available');
      }
      
      // Instructors can only access their own materials
      if (req.user.role === 'instructor' && 
          studyMaterial.instructor._id.toString() !== req.user._id.toString()) {
        console.log('Instructor tried to access another instructor\'s material');
        res.status(403);
        throw new Error('Not authorized to access this study material');
      }
      
      console.log('Returning study material to client');
      res.json(studyMaterial);
    } catch (error) {
      console.error('Error in GET /:id route:', error);
      throw error;
    }
  }));

  // @route   GET /api/study-materials/published
  // @desc    Get all published study materials for students
  // @access  Private
  router.get('/published', protect, asyncHandler(async (req, res) => {
    const { course, semester, role } = req.user;

    console.log('Student requesting published materials:', {
      userId: req.user._id,
      userName: req.user.name,
      userCourse: course,
      userSemester: semester,
      userRole: role
    });

    // Query for published materials based on student's course and semester
    // if the user is a student
    const query = { isPublished: true };
    
    // Only filter by course and semester for students
    // This will show resources to instructors regardless of course/semester
    if (role === 'student') {
      if (course) {
        query.course = course;
      }
      if (semester) {
        query.semester = semester;
      }
    }
    
    console.log('Query for published materials:', query);

    const studyMaterials = await StudyMaterial.find(query)
      .populate('instructor', 'name email')
      .sort('-createdAt');
    
    // Filter out guide-type materials that don't have files
    const validStudyMaterials = studyMaterials.filter(material => {
      if (material.type === 'guide') {
        // Guide materials must have a file
        const hasFile = material.fileId && material.fileUrl && !material.fileUrl.includes('undefined');
        if (!hasFile) {
          console.log(`Filtering out guide "${material.title}" - no file attached`);
          return false;
        }
      }
      return true;
    });
    
    console.log('Found study materials:', studyMaterials.length);
    console.log('Valid study materials (after filtering):', validStudyMaterials.length);
    console.log('Materials:', validStudyMaterials.map(m => ({
      title: m.title,
      course: m.course,
      semester: m.semester,
      type: m.type,
      isPublished: m.isPublished,
      hasFile: m.fileId ? true : false
    })));
    
    res.json(validStudyMaterials);
  }));

  // @route   POST /api/study-materials
  // @desc    Create a new study material
  // @access  Private/Instructor
  router.post('/', protect, instructor, upload.single('file'), asyncHandler(async (req, res) => {
    try {
      console.log('Creating study material...');
      console.log('Request body:', req.body);
      console.log('File info:', req.file ? { name: req.file.originalname, size: req.file.size, type: req.file.mimetype } : 'No file');

      const {
        title,
        description,
        type,
        difficulty,
        duration,
        pages,
        cards,
        subject,
        course,
        semester,
        content,
        videoUrl,
        isPublished,
        questions,
        passingScore
      } = req.body;

      // Parse questions if they exist
      let parsedQuestions = [];
      let totalPoints = 0;
      
      if (questions && type === 'practice') {
        try {
          parsedQuestions = JSON.parse(questions);
          // Calculate total points
          totalPoints = parsedQuestions.reduce((sum, q) => sum + (parseInt(q.points) || 0), 0);
          console.log('Parsed practice test questions:', parsedQuestions.length);
          console.log('Total points:', totalPoints);
        } catch (error) {
          console.error('Error parsing questions:', error);
        }
      }

      const studyMaterialData = {
        title,
        description,
        type,
        difficulty,
        duration,
        pages: pages ? parseInt(pages) : undefined,
        cards: cards ? parseInt(cards) : undefined,
        subject,
        course,
        semester: parseInt(semester),
        content,
        videoUrl,
        instructor: req.user._id,
        isPublished: isPublished === 'true',
        updatedAt: new Date()
      };
      
      // Add questions and related fields for practice tests
      if (type === 'practice' && parsedQuestions.length > 0) {
        studyMaterialData.questions = parsedQuestions;
        studyMaterialData.totalPoints = totalPoints;
        studyMaterialData.passingScore = passingScore ? parseInt(passingScore) : 70;
      }

      // Add special logging for flashcard creation
      if (type === 'flashcard') {
        console.log('Creating flashcard resource:');
        console.log('Content:', content);
        console.log('Cards count:', cards);
      }

      // Validate that guide-type materials have files
      if (type === 'guide' && !req.file) {
        res.status(400);
        throw new Error('Study guides must include a file upload (PDF or document)');
      }

      // If a file was uploaded, store it in GridFS
      if (req.file) {
        console.log('Storing file in GridFS...');
        const filename = `${title}_${Date.now()}_${req.file.originalname}`;
        
        const fileInfo = await storeFile(req.file.buffer, filename, {
          title: title,
          type: type,
          subject: subject,
          course: course,
          semester: semester,
          instructorId: req.user._id,
          instructorName: req.user.name,
          originalName: req.file.originalname,
          contentType: req.file.mimetype
        }, 'studyMaterials');

        console.log('File stored in GridFS with ID:', fileInfo._id);
        studyMaterialData.fileId = fileInfo._id;
        studyMaterialData.fileUrl = `/api/study-materials/file/${fileInfo._id}`;
      }

      const studyMaterial = await StudyMaterial.create(studyMaterialData);
      console.log('Study material created:', studyMaterial._id);
      
      res.status(201).json(studyMaterial);
    } catch (error) {
      console.error('Error creating study material:', error);
      res.status(500);
      throw new Error('Failed to create study material: ' + error.message);
    }
  }));

  // @route   PUT /api/study-materials/:id
  // @desc    Update a study material
  // @access  Private/Instructor
  router.put('/:id', protect, instructor, upload.single('file'), asyncHandler(async (req, res) => {
    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (!studyMaterial) {
      res.status(404);
      throw new Error('Study material not found');
    }

    // Check if user owns this study material
    if (studyMaterial.instructor.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this study material');
    }

    const {
      title,
      description,
      type,
      difficulty,
      duration,
      pages,
      cards,
      subject,
      course,
      semester,
      content,
      videoUrl,
      isPublished,
      questions,
      passingScore
    } = req.body;

    // Parse questions if they exist
    let parsedQuestions = [];
    let totalPoints = 0;
    
    if (questions && (type === 'practice' || studyMaterial.type === 'practice')) {
      try {
        parsedQuestions = JSON.parse(questions);
        // Calculate total points
        totalPoints = parsedQuestions.reduce((sum, q) => sum + (parseInt(q.points) || 0), 0);
        console.log('Parsed practice test questions:', parsedQuestions.length);
        console.log('Total points:', totalPoints);
      } catch (error) {
        console.error('Error parsing questions:', error);
      }
    }

    // Update fields
    studyMaterial.title = title || studyMaterial.title;
    studyMaterial.description = description || studyMaterial.description;
    studyMaterial.type = type || studyMaterial.type;
    studyMaterial.difficulty = difficulty || studyMaterial.difficulty;
    studyMaterial.duration = duration || studyMaterial.duration;
    studyMaterial.pages = pages ? parseInt(pages) : studyMaterial.pages;
    studyMaterial.cards = cards ? parseInt(cards) : studyMaterial.cards;
    studyMaterial.subject = subject || studyMaterial.subject;
    studyMaterial.course = course || studyMaterial.course;
    studyMaterial.semester = semester ? parseInt(semester) : studyMaterial.semester;
    studyMaterial.content = content || studyMaterial.content;
    studyMaterial.videoUrl = videoUrl || studyMaterial.videoUrl;
    studyMaterial.updatedAt = new Date();
    
    // Update questions and related fields for practice tests
    if (parsedQuestions.length > 0 && (type === 'practice' || studyMaterial.type === 'practice')) {
      studyMaterial.questions = parsedQuestions;
      studyMaterial.totalPoints = totalPoints;
      studyMaterial.passingScore = passingScore ? parseInt(passingScore) : studyMaterial.passingScore || 70;
    }

    // Validate that guide-type materials have files when being published
    const willBePublished = isPublished === 'true';
    const isGuideType = (type && type === 'guide') || (!type && studyMaterial.type === 'guide');
    
    if (willBePublished && isGuideType) {
      const hasExistingFile = studyMaterial.fileId && studyMaterial.fileUrl && !studyMaterial.fileUrl.includes('undefined');
      const hasNewFile = req.file;
      
      if (!hasExistingFile && !hasNewFile) {
        res.status(400);
        throw new Error('Study guides must include a file upload (PDF or document) before they can be published');
      }
    }

    // If a new file was uploaded, update file information
    if (req.file) {
      console.log('Storing new file in GridFS...');
      const filename = `${studyMaterial.title}_${Date.now()}_${req.file.originalname}`;
      
      const fileInfo = await storeFile(req.file.buffer, filename, {
        title: studyMaterial.title,
        type: studyMaterial.type,
        subject: studyMaterial.subject,
        course: studyMaterial.course,
        semester: studyMaterial.semester,
        instructorId: req.user._id,
        instructorName: req.user.name,
        originalName: req.file.originalname,
        contentType: req.file.mimetype
      }, 'studyMaterials');

      console.log('New file stored in GridFS with ID:', fileInfo._id);
      
      // Delete old file if it exists
      if (studyMaterial.fileId) {
        try {
          await deletePDF(studyMaterial.fileId, 'studyMaterials');
          console.log('Old file deleted from GridFS');
        } catch (error) {
          console.warn('Could not delete old file from GridFS:', error.message);
        }
      }
      
      studyMaterial.fileId = fileInfo._id;
      studyMaterial.fileUrl = `/api/study-materials/file/${fileInfo._id}`;
    }

    // Set publication status after validation
    studyMaterial.isPublished = willBePublished;

    const updatedStudyMaterial = await studyMaterial.save();
    
    res.json(updatedStudyMaterial);
  }));

  // @route   DELETE /api/study-materials/:id
  // @desc    Delete a study material
  // @access  Private/Instructor
  router.delete('/:id', protect, instructor, asyncHandler(async (req, res) => {
    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (!studyMaterial) {
      res.status(404);
      throw new Error('Study material not found');
    }

    // Check if user owns this study material
    if (studyMaterial.instructor.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this study material');
    }

    // Delete associated file from GridFS if exists
    if (studyMaterial.fileId) {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'study-materials'
      });
      
      try {
        await bucket.delete(studyMaterial.fileId);
      } catch (error) {
        console.warn('Could not delete file from GridFS:', error.message);
      }
    }

    await studyMaterial.deleteOne();
    
    res.json({ message: 'Study material removed' });
  }));

  // @route   GET /api/study-materials/file/:fileId
  // @desc    Stream file
  // @access  Private
  router.get('/file/:fileId', protect, asyncHandler(async (req, res) => {
    // Check if fileId is valid
    if (req.params.fileId === 'undefined' || !req.params.fileId) {
      res.status(404);
      throw new Error('File not found - no file was uploaded for this study material');
    }

    const studyMaterial = await StudyMaterial.findOne({ fileId: req.params.fileId });
    
    if (!studyMaterial) {
      res.status(404);
      throw new Error('File not found');
    }

    // Check if user has access to this file
    const isInstructor = req.user.role === 'instructor' && 
                        studyMaterial.instructor.toString() === req.user._id.toString();
    const isStudent = req.user.role === 'student' && studyMaterial.isPublished;

    if (!isInstructor && !isStudent) {
      res.status(403);
      throw new Error('Not authorized to access this file');
    }

    // Increment download count for published materials
    if (studyMaterial.isPublished && req.user.role === 'student') {
      studyMaterial.downloads += 1;
      await studyMaterial.save();
    }

    try {
      console.log('Retrieving study material file from GridFS, fileId:', req.params.fileId);
      const fileBuffer = await retrieveFile(new mongoose.Types.ObjectId(req.params.fileId), 'studyMaterials');
      
      // Set appropriate content type based on file extension or stored metadata
      const contentType = studyMaterial.type === 'pdf' ? 'application/pdf' : 'application/octet-stream';
      res.set('Content-Type', contentType);
      res.set('Content-Disposition', `inline; filename="${studyMaterial.title}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error retrieving study material file:', error);
      res.status(404);
      throw new Error('File not found or corrupted');
    }
  }));

  // @route   PUT /api/study-materials/:id/view
  // @desc    Increment view count
  // @access  Private
  router.put('/:id/view', protect, asyncHandler(async (req, res) => {
    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (!studyMaterial) {
      res.status(404);
      throw new Error('Study material not found');
    }

    if (!studyMaterial.isPublished && req.user.role === 'student') {
      res.status(403);
      throw new Error('Not authorized to view this study material');
    }

    studyMaterial.views += 1;
    await studyMaterial.save();
    
    res.json({ message: 'View count updated' });
  }));

  // @route   GET /api/study-materials/debug
  // @desc    Debug endpoint to check study materials without auth
  // @access  Public (temporary for debugging)
  router.get('/debug', asyncHandler(async (req, res) => {
    const allMaterials = await StudyMaterial.find({});
    const publishedMaterials = await StudyMaterial.find({ isPublished: true });
    
    res.json({
      totalMaterials: allMaterials.length,
      publishedMaterials: publishedMaterials.length,
      allMaterials: allMaterials.map(m => ({
        title: m.title,
        type: m.type,
        course: m.course,
        isPublished: m.isPublished,
        instructor: m.instructor
      })),
      publishedMaterials: publishedMaterials.map(m => ({
        title: m.title,
        type: m.type,
        course: m.course,
        isPublished: m.isPublished
      }))
    });
  }));

  return router;
}

export default createStudyMaterialsRouter;
