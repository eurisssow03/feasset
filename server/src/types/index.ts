// Re-export Prisma types and define additional types
export type Role = 'ADMIN' | 'FINANCE' | 'CLEANER' | 'AGENT';
export type ReservationStatus = 'DRAFT' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELED';
export type DepositStatus = 'NOT_REQUIRED' | 'PENDING' | 'HELD' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FORFEITED' | 'FAILED';
export type CleaningStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'FAILED';

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
