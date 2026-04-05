import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

export { s3Client };
export default s3Client;