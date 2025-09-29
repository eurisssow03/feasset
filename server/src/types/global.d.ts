// Global type declarations for missing modules
declare module 'swagger-jsdoc';
declare module 'swagger-ui-express';
declare module 'express';
declare module 'bcryptjs';
declare module 'jsonwebtoken';
declare module 'cors';
declare module 'morgan';
declare module 'compression';
declare module 'multer';
declare module 'path';
declare module 'fs';

// Node.js global types
declare var process: any;
declare var console: any;

// Jest global types
declare var jest: any;
declare var describe: any;
declare var it: any;
declare var expect: any;
declare var beforeEach: any;
declare var afterEach: any;
declare var beforeAll: any;
declare var afterAll: any;
declare var test: any;

// Express namespace for Multer
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}
