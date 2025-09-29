// Global type declarations
declare module 'swagger-jsdoc' {
  const swaggerJSDoc: any;
  export = swaggerJSDoc;
}

declare module 'swagger-ui-express' {
  const swaggerUi: any;
  export = swaggerUi;
}

declare module 'express' {
  interface Request {
    user?: any;
    files?: any;
    file?: any;
  }
}

declare module 'multer' {
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
