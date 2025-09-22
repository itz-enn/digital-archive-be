import { diskStorage, FileFilterCallback } from 'multer';
import * as path from 'path';

// Organize uploads by projectId and fileStage if available
const storage = diskStorage({
  destination: (req, file, cb) => {
    // Example: uploads/{projectId}/{fileStage}
    const projectId = req.body.projectId || 'general';
    const fileStage = req.body.fileStage || 'misc';
    const dest = path.join(
      'uploads',
      projectId.toString(),
      fileStage.toString(),
    );
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const unique = `${base}_${Date.now()}${ext}`;
    cb(null, unique.replace(/\\/g, '/'));
  },
});

// Accept common document and image types
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
