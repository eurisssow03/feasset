import { Router } from 'express';
import { UploadController } from '../controllers/UploadController';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();
const uploadController = new UploadController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

/**
 * @swagger
 * /api/v1/uploads/cleaning-photos:
 *   post:
 *     summary: Upload cleaning photos
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *       400:
 *         description: Invalid file type or size
 */
router.post('/cleaning-photos', authenticate, upload.array('photos', 5), uploadController.uploadCleaningPhotos);

/**
 * @swagger
 * /api/v1/uploads/deposit-evidence:
 *   post:
 *     summary: Upload deposit evidence
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       400:
 *         description: Invalid file type or size
 */
router.post('/deposit-evidence', authenticate, upload.array('files', 5), uploadController.uploadDepositEvidence);

/**
 * @swagger
 * /api/v1/uploads/general:
 *   post:
 *     summary: Upload general files
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file type or size
 */
router.post('/general', authenticate, upload.single('file'), uploadController.uploadGeneral);

/**
 * @swagger
 * /api/v1/uploads/{filename}:
 *   get:
 *     summary: Get uploaded file
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *       404:
 *         description: File not found
 */
router.get('/:filename', authenticate, uploadController.getFile);

export default router;
