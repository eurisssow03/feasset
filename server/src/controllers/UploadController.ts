import { Request, Response } from 'express';
import { AuthRequest } from '../types/index';
import path from 'path';
import fs from 'fs';

export class UploadController {
  async uploadCleaningPhotos(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files uploaded',
        });
        return;
      }

      if (files.length > 5) {
        res.status(400).json({
          success: false,
          error: 'Maximum 5 photos allowed',
        });
        return;
      }

      const photoUrls = files.map(file => {
        // In a real application, you would upload to cloud storage
        // For now, return the local file path
        return `/uploads/${file.filename}`;
      });

      res.json({
        success: true,
        data: {
          photoUrls,
          count: photoUrls.length,
        },
        message: 'Photos uploaded successfully',
      });
    } catch (error) {
      console.error('Upload cleaning photos error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async uploadDepositEvidence(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files uploaded',
        });
        return;
      }

      if (files.length > 5) {
        res.status(400).json({
          success: false,
          error: 'Maximum 5 files allowed',
        });
        return;
      }

      const fileUrls = files.map(file => {
        // In a real application, you would upload to cloud storage
        // For now, return the local file path
        return `/uploads/${file.filename}`;
      });

      res.json({
        success: true,
        data: {
          fileUrls,
          count: fileUrls.length,
        },
        message: 'Files uploaded successfully',
      });
    } catch (error) {
      console.error('Upload deposit evidence error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async uploadGeneral(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
        return;
      }

      const fileUrl = `/uploads/${file.filename}`;

      res.json({
        success: true,
        data: {
          fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        },
        message: 'File uploaded successfully',
      });
    } catch (error) {
      console.error('Upload general file error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getFile(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { filename } = req.params;

      // Validate filename to prevent directory traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        res.status(400).json({
          success: false,
          error: 'Invalid filename',
        });
        return;
      }

      const filePath = path.join(process.cwd(), 'uploads', filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      // Get file stats
      const stats = fs.statSync(filePath);

      // Set appropriate headers
      res.setHeader('Content-Type', this.getMimeType(filename));
      res.setHeader('Content-Length', stats.size.toString());
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res as any);
    } catch (error) {
      console.error('Get file error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}
