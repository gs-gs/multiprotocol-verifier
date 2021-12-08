import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/');
  },

  // By default, multer removes file extensions so let's add them back
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
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

export const certUploader = multer({ storage: storage, fileFilter }).single('certificate');
