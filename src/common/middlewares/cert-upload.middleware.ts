import AWS from 'aws-sdk';
import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

const s3 = new AWS.S3();

const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET || 'certificates',
  metadata: function (req: Request, file: Express.Multer.File, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Accept images & PDF only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|pdf|PDF)$/)) {
    return cb(new Error('Only Image and PDF files are allowed!'));
  }
  cb(null, true);
};

export const certUploadMiddleware = multer({ storage: storage, fileFilter }).single('certificate');
