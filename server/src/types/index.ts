// Re-export Prisma types and define additional types
export type Role = 'ADMIN' | 'FINANCE' | 'CLEANER' | 'AGENT';
export type ReservationStatus = 'DRAFT' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELED';
export type DepositStatus = 'NOT_REQUIRED' | 'PENDING' | 'HELD' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FORFEITED' | 'FAILED';
export type CleaningStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'FAILED';

// Node.js Buffer type declaration
declare global {
  interface Buffer {
    length: number;
    toString(encoding?: string): string;
    [index: number]: number;
  }
  var Buffer: {
    new (size: number): Buffer;
    new (array: number[]): Buffer;
    new (arrayBuffer: ArrayBuffer): Buffer;
    new (str: string, encoding?: string): Buffer;
    from(str: string, encoding?: string): Buffer;
    from(array: number[]): Buffer;
    from(arrayBuffer: ArrayBuffer): Buffer;
    isBuffer(obj: any): obj is Buffer;
    concat(list: Buffer[], totalLength?: number): Buffer;
    alloc(size: number, fill?: string | number | Buffer): Buffer;
    allocUnsafe(size: number): Buffer;
  };
}

// Express namespace declaration
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

// Export Role as both type and enum-like object
export const Role = {
  ADMIN: 'ADMIN' as const,
  FINANCE: 'FINANCE' as const,
  CLEANER: 'CLEANER' as const,
  AGENT: 'AGENT' as const,
} as const;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

// Simple AuthRequest interface without extending Request to avoid circular dependencies
export interface AuthRequest {
  user?: AuthUser;
  params: any;
  query: any;
  body: any;
  headers: any;
  files?: Express.Multer.File[];
  file?: Express.Multer.File;
  [key: string]: any;
}
