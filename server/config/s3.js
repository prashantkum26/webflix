import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS S3 Client v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Custom multer storage engine for S3
class S3Storage {
  constructor(options) {
    this.s3 = options.s3;
    this.bucket = options.bucket;
    this.acl = options.acl || 'public-read';
    this.keyGenerator = options.key;
  }

  _handleFile(req, file, cb) {
    this.keyGenerator(req, file, (err, key) => {
      if (err) return cb(err);

      const uploadParams = {
        Bucket: this.bucket,
        Key: key,
        Body: file.stream,
        ContentType: file.mimetype,
        // Removed ACL - use bucket policy instead
      };

      // Use Upload for better handling of large files
      const upload = new Upload({
        client: this.s3,
        params: uploadParams,
      });

      upload.done()
        .then((result) => {
          // Generate the public URL manually since we're not using ACLs
          const location = `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
          
          cb(null, {
            key: key,
            location: location,
            bucket: result.Bucket,
            etag: result.ETag,
            size: file.size
          });
        })
        .catch((error) => {
          console.error('S3 upload error:', error);
          cb(error);
        });
    });
  }

  _removeFile(req, file, cb) {
    // Optional: implement file removal logic
    cb(null);
  }
}

// Helper function to create S3 storage
function s3Storage(options) {
  return new S3Storage(options);
}

// Generate unique filename
const generateKey = (folder) => (req, file, cb) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(6).toString('hex');
  const ext = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
  const key = `${folder}/${timestamp}-${randomString}-${baseName}${ext}`;
  cb(null, key);
};

// Configure multer for file uploads
export const uploadMovieFiles = multer({
  storage: s3Storage({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: (req, file, cb) => {
      let folder = '';
      if (file.fieldname === 'video') {
        folder = 'videos';
      } else if (file.fieldname === 'thumbnail') {
        folder = 'thumbnails';
      }
      generateKey(folder)(req, file, cb);
    }
  }),
  fileFilter: (req, file, cb) => {
    console.log('Processing file:', {
      fieldname: file.fieldname,
      mimetype: file.mimetype,
      originalname: file.originalname
    });

    if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for video field!'), false);
      }
    } else if (file.fieldname === 'thumbnail') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for thumbnail field!'), false);
      }
    } else {
      cb(new Error('Invalid field name. Only video and thumbnail are allowed.'), false);
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
    fieldSize: 10 * 1024 * 1024, // 10MB for form fields
  }
});

// Individual video upload
export const uploadVideo = multer({
  storage: s3Storage({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: generateKey('videos')
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Individual image upload
export const uploadImage = multer({
  storage: s3Storage({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: generateKey('thumbnails')
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Utility function to extract S3 key from URL
export const extractS3Key = (url) => {
  if (!url) return null;
  
  try {
    console.log('🔍 Extracting S3 key from URL:', url);
    
    // Handle various S3 URL formats
    let key = null;
    
    if (url.includes('.s3.') && url.includes('.amazonaws.com/')) {
      // Format: https://bucket.s3.region.amazonaws.com/key
      key = url.split('.amazonaws.com/')[1];
      console.log('📝 Extracted key (bucket.s3.region format):', key);
    } else if (url.includes('s3.amazonaws.com/')) {
      // Format: https://s3.amazonaws.com/bucket/key or https://s3.region.amazonaws.com/bucket/key
      const urlParts = url.split('amazonaws.com/')[1];
      if (urlParts) {
        const pathParts = urlParts.split('/');
        if (pathParts.length > 1) {
          key = pathParts.slice(1).join('/'); // Remove bucket name, keep the rest as key
          console.log('📝 Extracted key (s3.amazonaws.com format):', key);
        }
      }
    } else if (url.includes('amazonaws.com/')) {
      // Try to extract from any amazonaws.com URL
      const urlParts = url.split('amazonaws.com/')[1];
      if (urlParts) {
        // If it's a direct path after amazonaws.com, use it as key
        key = urlParts;
        console.log('📝 Extracted key (direct amazonaws format):', key);
      }
    }
    
    // Clean up key (remove query parameters and decode URI)
    if (key) {
      key = key.split('?')[0]; // Remove query parameters
      key = decodeURIComponent(key); // Decode URI components
      console.log('✅ Final cleaned key:', key);
    } else {
      console.warn('❌ Could not extract S3 key from URL:', url);
    }
    
    return key;
  } catch (error) {
    console.error('❌ Error extracting S3 key from URL:', url, error);
    return null;
  }
};

// Delete single file from S3
export const deleteS3File = async (fileUrl) => {
  try {
    console.log('🗑️ Attempting to delete S3 file:', fileUrl);
    
    const key = extractS3Key(fileUrl);
    if (!key) {
      console.warn('❌ Unable to extract S3 key from URL:', fileUrl);
      return { success: false, error: 'Could not extract S3 key from URL' };
    }
    
    const bucketName = process.env.AWS_S3_BUCKET;
    console.log('🪣 Using bucket:', bucketName);
    console.log('🔑 Using key:', key);
    
    if (!bucketName) {
      console.error('❌ AWS_S3_BUCKET environment variable not set');
      return { success: false, error: 'S3 bucket name not configured' };
    }
    
    const deleteParams = {
      Bucket: bucketName,
      Key: key
    };
    
    console.log('📋 Delete parameters:', deleteParams);
    
    const command = new DeleteObjectCommand(deleteParams);
    const result = await s3Client.send(command);
    
    console.log('✅ Successfully deleted S3 file:', key);
    console.log('📄 S3 delete result:', result);
    return { success: true, key, result };
  } catch (error) {
    console.error('❌ Error deleting S3 file:', fileUrl);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.Code || error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    });
    return { success: false, error: error.message, details: error };
  }
};

// Delete multiple files from S3
export const deleteS3Files = async (fileUrls) => {
  try {
    console.log('🗂️ Starting bulk S3 file deletion...');
    console.log('📋 File URLs received:', fileUrls);
    
    if (!fileUrls || fileUrls.length === 0) {
      console.log('⚠️ No file URLs provided for deletion');
      return { deletedCount: 0, errors: [] };
    }
    
    console.log(`📊 Processing ${fileUrls.length} file URLs...`);
    
    // Extract keys and filter out invalid ones
    const keys = fileUrls
      .map(url => {
        const key = extractS3Key(url);
        console.log(`🔗 URL: ${url} → Key: ${key}`);
        return key;
      })
      .filter(key => key !== null);
    
    console.log(`🔑 Valid keys extracted: ${keys.length}/${fileUrls.length}`);
    console.log('📝 Keys to delete:', keys);
    
    if (keys.length === 0) {
      console.warn('❌ No valid S3 keys found in URLs:', fileUrls);
      return { deletedCount: 0, errors: ['No valid S3 keys found'] };
    }
    
    const bucketName = process.env.AWS_S3_BUCKET;
    console.log(`🪣 Using S3 bucket: ${bucketName}`);
    
    if (!bucketName) {
      console.error('❌ AWS_S3_BUCKET environment variable not set');
      return { deletedCount: 0, errors: ['S3 bucket name not configured'] };
    }
    
    // Prepare delete objects params
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false
      }
    };
    
    console.log('📋 S3 Delete Parameters:');
    console.log('  - Bucket:', deleteParams.Bucket);
    console.log('  - Objects to delete:', deleteParams.Delete.Objects.length);
    console.log('  - Keys:', deleteParams.Delete.Objects.map(obj => obj.Key));
    
    const command = new DeleteObjectsCommand(deleteParams);
    console.log('🚀 Sending delete command to S3...');
    
    const result = await s3Client.send(command);
    console.log('📄 S3 Delete Response:', JSON.stringify(result, null, 2));
    
    const deletedCount = result.Deleted ? result.Deleted.length : 0;
    const errors = result.Errors || [];
    
    console.log(`✅ S3 Deletion Summary:`);
    console.log(`  - Successfully deleted: ${deletedCount} files`);
    console.log(`  - Errors: ${errors.length}`);
    
    if (result.Deleted && result.Deleted.length > 0) {
      console.log('🗑️ Successfully deleted files:');
      result.Deleted.forEach((deleted, index) => {
        console.log(`  ${index + 1}. ${deleted.Key} (ETag: ${deleted.ETag || 'N/A'})`);
      });
    }
    
    if (errors.length > 0) {
      console.warn('⚠️ Files that failed to delete:');
      errors.forEach((error, index) => {
        console.warn(`  ${index + 1}. Key: ${error.Key}, Code: ${error.Code}, Message: ${error.Message}`);
      });
    }
    
    return { deletedCount, errors, details: result };
  } catch (error) {
    console.error('❌ Error during bulk S3 file deletion:');
    console.error('  - Error name:', error.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error code:', error.Code || error.$metadata?.httpStatusCode);
    console.error('  - Request ID:', error.$metadata?.requestId);
    console.error('  - Full error:', error);
    return { deletedCount: 0, errors: [error.message], details: error };
  }
};

// Delete all files associated with a movie
export const deleteMovieFiles = async (movie) => {
  try {
    console.log('🎬 ================== MOVIE FILE DELETION START ==================');
    console.log(`🎭 Movie Title: ${movie.title}`);
    console.log(`🆔 Movie ID: ${movie._id}`);
    
    const filesToDelete = [];
    
    console.log('📋 Collecting files for deletion:');
    
    // Add main files
    if (movie.videoUrl) {
      console.log(`  📹 Video URL: ${movie.videoUrl}`);
      filesToDelete.push(movie.videoUrl);
    } else {
      console.log('  📹 No video URL found');
    }
    
    if (movie.thumbnail) {
      console.log(`  🖼️  Thumbnail: ${movie.thumbnail}`);
      filesToDelete.push(movie.thumbnail);
    } else {
      console.log('  🖼️  No thumbnail found');
    }
    
    if (movie.trailer) {
      console.log(`  🎥 Trailer: ${movie.trailer}`);
      filesToDelete.push(movie.trailer);
    } else {
      console.log('  🎥 No trailer found');
    }
    
    // Add additional images
    if (movie.additionalImages && Array.isArray(movie.additionalImages)) {
      console.log(`  🖼️  Additional Images (${movie.additionalImages.length}):`);
      movie.additionalImages.forEach((img, index) => {
        console.log(`    ${index + 1}. ${img}`);
      });
      filesToDelete.push(...movie.additionalImages);
    } else {
      console.log('  🖼️  No additional images found');
    }
    
    // Add SEO og image
    if (movie.seo?.ogImage) {
      console.log(`  🔍 SEO OG Image: ${movie.seo.ogImage}`);
      filesToDelete.push(movie.seo.ogImage);
    } else {
      console.log('  🔍 No SEO OG image found');
    }
    
    // Add cast images
    if (movie.cast && Array.isArray(movie.cast)) {
      const castImages = movie.cast.filter(member => member.image);
      if (castImages.length > 0) {
        console.log(`  👥 Cast Images (${castImages.length}):`);
        castImages.forEach((member, index) => {
          console.log(`    ${index + 1}. ${member.name}: ${member.image}`);
          filesToDelete.push(member.image);
        });
      } else {
        console.log('  👥 No cast images found');
      }
    } else {
      console.log('  👥 No cast data found');
    }
    
    console.log('📊 Collection Summary:');
    console.log(`  - Total files to delete: ${filesToDelete.length}`);
    console.log(`  - Unique files: ${[...new Set(filesToDelete)].length}`);
    
    if (filesToDelete.length === 0) {
      console.log('⚠️ No files found for deletion');
      console.log('🎬 ================== MOVIE FILE DELETION END ==================');
      return { deletedCount: 0, errors: [] };
    }
    
    console.log('🚀 Proceeding with S3 deletion...');
    const result = await deleteS3Files(filesToDelete);
    
    console.log('📈 Final Deletion Summary:');
    console.log(`  - Files processed: ${filesToDelete.length}`);
    console.log(`  - Successfully deleted: ${result.deletedCount}`);
    console.log(`  - Errors: ${result.errors?.length || 0}`);
    
    console.log('🎬 ================== MOVIE FILE DELETION END ==================');
    
    return result;
  } catch (error) {
    console.error('❌ Error in deleteMovieFiles function:', error);
    console.error('🎬 ================== MOVIE FILE DELETION END (ERROR) ==================');
    return { deletedCount: 0, errors: [error.message] };
  }
};

// Log S3 configuration on startup
export const logS3Configuration = () => {
  console.log('🔧 ================== S3 CONFIGURATION CHECK ==================');
  console.log('📋 Environment Variables:');
  console.log(`  - AWS_S3_BUCKET: ${process.env.AWS_S3_BUCKET ? '✅ Set' : '❌ Not Set'}`);
  console.log(`  - AWS_REGION: ${process.env.AWS_REGION || 'us-east-1'} ${process.env.AWS_REGION ? '✅ Set' : '⚠️ Using default'}`);
  console.log(`  - AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not Set'}`);
  console.log(`  - AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not Set'}`);
  
  if (process.env.AWS_S3_BUCKET) {
    console.log(`🪣 S3 Bucket: ${process.env.AWS_S3_BUCKET}`);
  }
  
  console.log('🔧 ================== S3 CONFIGURATION CHECK END ==================');
  
  // Return configuration status
  return {
    isConfigured: !!(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION || 'us-east-1',
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
  };
};

export { s3Client };
export default s3Client;
