import { diskStorage, FileFilterCallback } from 'multer';
import * as path from 'path';

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const unique = `${base}_${Date.now()}${ext}`;
    cb(null, unique.replace(/\\/g, '/'));
  },
});

const allowedTypes = /\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png)$/i;

export const multerConfig = {
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    if (!file.originalname.match(allowedTypes)) {
      cb(null, false);
      return cb(new Error('Only document and image formats allowed!'));
    }
    cb(null, true);
  },
};
