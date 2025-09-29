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

// Express module declaration
declare module 'express' {
  export interface Request {
    user?: any;
    params: any;
    query: any;
    body: any;
    headers: any;
    files?: any[];
    file?: any;
    originalUrl?: string;
  }
  
  export interface Response {
    status(code: number): Response;
    json(obj: any): Response;
    send(data: any): Response;
    setHeader(name: string, value: string): void;
    end(data?: any): void;
  }
  
  export interface NextFunction {
    (err?: any): void;
  }
  
  export interface Router {
    get(path: string, ...handlers: any[]): Router;
    post(path: string, ...handlers: any[]): Router;
    put(path: string, ...handlers: any[]): Router;
    delete(path: string, ...handlers: any[]): Router;
    patch(path: string, ...handlers: any[]): Router;
    use(path: string, ...handlers: any[]): Router;
    use(...handlers: any[]): Router;
  }
  
  export interface Application {
    use(path: string, ...handlers: any[]): Application;
    use(...handlers: any[]): Application;
    get(path: string, ...handlers: any[]): Application;
    post(path: string, ...handlers: any[]): Application;
    put(path: string, ...handlers: any[]): Application;
    delete(path: string, ...handlers: any[]): Application;
    patch(path: string, ...handlers: any[]): Application;
    listen(port: number, callback?: () => void): any;
  }
  
  export function Router(): Router;
  export function json(options?: any): any;
  export function urlencoded(options?: any): any;
  export function static(root: string): any;
  export default function (): Application;
  
  export namespace Express {
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
}

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
