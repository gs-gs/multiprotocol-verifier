import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Accept images & PDF only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|pdf|PDF)$/)) {
    return cb(new Error('Only Image and PDF files are allowed!'));
  }
  cb(null, true);
};

export const certUploadMiddleware = multer({ storage: storage, fileFilter }).single('certificate');
