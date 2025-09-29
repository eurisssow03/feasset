// Global type declarations
declare module 'swagger-jsdoc';
declare module 'swagger-ui-express';
declare module 'bcryptjs';
declare module 'jsonwebtoken';
declare module 'cors';
declare module 'morgan';
declare module 'compression';
declare module 'multer';
declare module 'path';
declare module 'fs';

// Node.js globals
declare var process: any;
declare var console: any;

// Jest globals
declare var jest: any;
declare var describe: any;
declare var it: any;
declare var expect: any;
declare var beforeEach: any;
declare var afterEach: any;
declare var beforeAll: any;
declare var afterAll: any;
declare var test: any;

// Express namespace
declare namespace Express {
  interface Request {
    user?: any;
    params: any;
    query: any;
    body: any;
    headers: any;
    files?: any[];
    file?: any;
    originalUrl?: string;
  }
  
  interface Response {
    status(code: number): Response;
    json(obj: any): Response;
    send(data: any): Response;
    setHeader(name: string, value: string): void;
    end(data?: any): void;
  }
  
  interface NextFunction {
    (err?: any): void;
  }
  
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

// Global interfaces
declare global {
  interface Request {
    user?: any;
    params: any;
    query: any;
    body: any;
    headers: any;
    files?: any[];
    file?: any;
    originalUrl?: string;
  }
  
  interface Response {
    status(code: number): Response;
    json(obj: any): Response;
    send(data: any): Response;
    setHeader(name: string, value: string): void;
    end(data?: any): void;
  }
}
