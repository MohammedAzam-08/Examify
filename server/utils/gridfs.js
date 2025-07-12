import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let gridfsBucket;
let studyMaterialsBucket;

// Initialize GridFS bucket when MongoDB connection is established
const initGridFS = () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Create the buckets with appropriate options
      gridfsBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'examSubmissions',
        chunkSizeBytes: 1024 * 255 // 255KB default chunk size
      });
      
      studyMaterialsBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'studyMaterials',
        chunkSizeBytes: 1024 * 255 // 255KB default chunk size
      });
      
      console.log('GridFS buckets initialized for exam submissions and study materials');
      return true;
    } else {
      console.error('MongoDB connection not ready for GridFS initialization, status:', mongoose.connection.readyState);
      
      // Add event listener for when the connection becomes ready
      mongoose.connection.once('connected', () => {
        console.log('MongoDB connection now ready, initializing GridFS buckets');
        initGridFS();
      });
      
      return false;
    }
  } catch (error) {
    console.error('Error initializing GridFS buckets:', error);
    return false;
  }
};

// Store file buffer in GridFS with improved error handling and chunking for large files
const storeFile = (fileBuffer, filename, metadata = {}, bucketType = 'submissions') => {
  return new Promise((resolve, reject) => {
    // Verify MongoDB connection is active
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB connection not ready for GridFS operations');
      return reject(new Error('Database connection not ready'));
    }
    
    // Get the appropriate bucket
    const bucket = bucketType === 'studyMaterials' ? studyMaterialsBucket : gridfsBucket;
    
    if (!bucket) {
      console.error('GridFS bucket not initialized, reinitializing...');
      try {
        initGridFS();
        // Re-get the bucket after initialization
        const newBucket = bucketType === 'studyMaterials' ? studyMaterialsBucket : gridfsBucket;
        if (!newBucket) {
          return reject(new Error('Failed to initialize GridFS bucket'));
        }
      } catch (initError) {
        console.error('Failed to initialize GridFS bucket:', initError);
        return reject(new Error('Failed to initialize GridFS bucket: ' + initError.message));
      }
    }

    try {
      // Setup upload stream with appropriate options
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          ...metadata,
          contentType: metadata.contentType || 'application/pdf',
          uploadDate: new Date()
        },
        // Add reasonable chunk size setting for better performance
        chunkSizeBytes: 1024 * 255 // 255KB chunks
      });

      // Set up timeout protection with a longer timeout for emergency submissions
      const isEmergency = metadata && (metadata.isEmergencySubmission === true);
      const timeoutDuration = isEmergency ? 15000 : 30000; // 15 seconds for emergency, 30 for normal
      
      const timeoutId = setTimeout(() => {
        console.error('GridFS upload timed out for file:', filename, isEmergency ? '(emergency submission)' : '');
        uploadStream.abort();
        reject(new Error(`Upload timed out after ${timeoutDuration/1000} seconds${isEmergency ? ' (emergency submission)' : ''}`));
      }, timeoutDuration);

      uploadStream.on('error', (error) => {
        clearTimeout(timeoutId);
        console.error('GridFS upload error:', error);
        reject(error);
      });

      uploadStream.on('finish', () => {
        clearTimeout(timeoutId);
        console.log('File stored in GridFS:', uploadStream.id);
        resolve({
          _id: uploadStream.id,
          filename: uploadStream.filename
        });
      });

      // Write the file buffer to GridFS
      uploadStream.end(fileBuffer);
    } catch (streamError) {
      console.error('Error setting up GridFS upload stream:', streamError);
      reject(streamError);
    }
  });
};

// Store PDF buffer in GridFS (alias for backward compatibility)
const storePDF = storeFile;

// Retrieve file from GridFS
const retrieveFile = (fileId, bucketType = 'submissions') => {
  return new Promise((resolve, reject) => {
    const bucket = bucketType === 'studyMaterials' ? studyMaterialsBucket : gridfsBucket;
    
    if (!bucket) {
      return reject(new Error('GridFS bucket not initialized'));
    }

    const chunks = [];
    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('error', (error) => {
      console.error('GridFS download error:', error);
      reject(error);
    });

    downloadStream.on('end', () => {
      const fileBuffer = Buffer.concat(chunks);
      resolve(fileBuffer);
    });
  });
};

// Retrieve PDF from GridFS (alias for backward compatibility)
const retrievePDF = retrieveFile;

// Delete PDF from GridFS
const deletePDF = (fileId) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS bucket not initialized'));
    }

    gridfsBucket.delete(fileId, (error) => {
      if (error) {
        console.error('GridFS delete error:', error);
        reject(error);
      } else {
        console.log('PDF deleted from GridFS:', fileId);
        resolve();
      }
    });
  });
};

// List all PDFs for a specific exam
const listExamPDFs = async (examId) => {
  if (!gridfsBucket) {
    throw new Error('GridFS bucket not initialized');
  }

  const files = await gridfsBucket.find({
    'metadata.examId': examId
  }).toArray();

  return files;
};

// Reassemble multiple chunks into a single file
const reassembleChunks = async (chunkIds, finalFilename, metadata = {}, bucketType = 'submissions') => {
  if (!Array.isArray(chunkIds) || chunkIds.length === 0) {
    throw new Error('No chunk IDs provided for reassembly');
  }

  try {
    // Get the appropriate bucket
    const bucket = bucketType === 'studyMaterials' ? studyMaterialsBucket : gridfsBucket;
    
    if (!bucket) {
      throw new Error('GridFS bucket not initialized');
    }
    
    console.log(`Starting reassembly of ${chunkIds.length} chunks into ${finalFilename}`);
    
    // Get all chunks in order
    const allChunkBuffers = [];
    
    for (const chunkId of chunkIds) {
      try {
        // Download each chunk
        const chunkBuffer = await retrieveFile(chunkId, bucketType);
        allChunkBuffers.push(chunkBuffer);
        console.log(`Retrieved chunk ${chunkId}, size: ${chunkBuffer.length} bytes`);
      } catch (chunkError) {
        console.error(`Error retrieving chunk ${chunkId}:`, chunkError);
        // Continue with other chunks if one fails
      }
    }
    
    if (allChunkBuffers.length === 0) {
      throw new Error('Failed to retrieve any chunks for reassembly');
    }
    
    // Combine all buffers
    const combinedBuffer = Buffer.concat(allChunkBuffers);
    console.log(`Reassembled ${allChunkBuffers.length} chunks into a ${combinedBuffer.length} byte buffer`);
    
    // Store the combined file
    const fileInfo = await storeFile(
      combinedBuffer, 
      finalFilename, 
      { 
        ...metadata,
        isReassembled: true,
        originalChunks: chunkIds.length,
        reassembledAt: new Date()
      }, 
      bucketType
    );
    
    return {
      fileId: fileInfo._id,
      filename: fileInfo.filename,
      size: combinedBuffer.length,
      chunksReassembled: allChunkBuffers.length
    };
  } catch (error) {
    console.error('Error reassembling chunks:', error);
    throw error;
  }
};

export {
  initGridFS,
  storeFile,
  storePDF,
  retrieveFile,
  retrievePDF,
  deletePDF,
  listExamPDFs,
  reassembleChunks
};

export const getGridFSBucket = () => gridfsBucket;
