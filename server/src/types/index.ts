// Re-export Prisma types and define additional types
export type Role = 'ADMIN' | 'FINANCE' | 'CLEANER' | 'AGENT';
export type ReservationStatus = 'DRAFT' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELED';
export type DepositStatus = 'NOT_REQUIRED' | 'PENDING' | 'HELD' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FORFEITED' | 'FAILED';
export type CleaningStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}
