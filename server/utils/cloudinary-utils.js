import { cloudinary } from '../config/cloudinary.js';

/**
 * Upload a file buffer to Cloudinary
 * 
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {String} filename - The name of the file
 * @param {Object} metadata - Additional metadata for the file
 * @returns {Promise<Object>} - Resolves to the Cloudinary upload result
 */
export const uploadToCloudinary = async (fileBuffer, filename, metadata = {}) => {
  try {
    // Create a unique folder structure based on metadata if available
    const folder = metadata.examId 
      ? `examify_pdfs/${metadata.examId}`
      : 'examify_pdfs';
    
    // Create a unique public_id based on metadata
    const userId = metadata.userId || 'anonymous';
    const examId = metadata.examId || 'unknown';
    const timestamp = Date.now();
    const publicId = `${folder}/submission_${userId}_${examId}_${timestamp}`;
    
    console.log('Upload to Cloudinary - Details:');
    console.log('- File buffer size:', fileBuffer.length, 'bytes');
    console.log('- Filename:', filename);
    console.log('- Public ID:', publicId);
    console.log('- Metadata:', JSON.stringify(metadata));
    console.log('- Cloudinary config loaded:', !!cloudinary.config && !!cloudinary.config().cloud_name);
    
    // Add additional debug for Cloudinary config
    try {
      const config = cloudinary.config();
      console.log('- Cloudinary cloud name:', config.cloud_name);
      console.log('- API key valid:', !!config.api_key && config.api_key.length > 0);
    } catch (configError) {
      console.error('- Error checking Cloudinary config:', configError);
    }

    // Upload the buffer to Cloudinary using their upload API
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'raw',
        public_id: publicId,
        tags: [
          'examify', 
          'submission', 
          metadata.isEmergencySubmission ? 'emergency' : 'normal'
        ]
      };
      
      // Add all metadata as context
      if (metadata) {
        uploadOptions.context = Object.keys(metadata)
          .filter(key => typeof metadata[key] !== 'object' && metadata[key] !== null)
          .map(key => `${key}=${metadata[key]}`)
          .join('|');
      }
      
      console.log('Starting Cloudinary upload with options:', JSON.stringify(uploadOptions));
      
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            console.error('Error details:', JSON.stringify(error));
            reject(error);
            return;
          }
          
          console.log('File uploaded to Cloudinary successfully!');
          console.log('- Public ID:', result.public_id);
          console.log('- URL:', result.secure_url);
          console.log('- Format:', result.format);
          console.log('- Size:', result.bytes, 'bytes');
          
          resolve({
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes,
            createdAt: result.created_at
          });
        }
      );
      
      // Handle errors during streaming
      uploadStream.on('error', (error) => {
        console.error('Error in Cloudinary upload stream:', error);
        reject(error);
      });
      
      // Write the buffer to the upload stream
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * 
 * @param {String} publicId - The public ID of the file to delete
 * @returns {Promise<Object>} - Resolves to the Cloudinary deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    
    console.log('File deleted from Cloudinary:', publicId, result);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Retrieve a file from Cloudinary as a readable stream
 * 
 * @param {String} publicId - The public ID of the file to retrieve
 * @returns {ReadableStream} - A readable stream of the file
 */
export const getCloudinaryReadStream = (publicId) => {
  return cloudinary.api.resource_stream(publicId, {
    resource_type: 'raw'
  });
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryReadStream
};
