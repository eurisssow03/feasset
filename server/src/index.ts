import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import unitRoutes from './routes/units';
import guestRoutes from './routes/guests';
import reservationRoutes from './routes/reservations';
import depositRoutes from './routes/deposits';
import cleaningRoutes from './routes/cleanings';
import financeRoutes from './routes/finance';
import calendarRoutes from './routes/calendar';
import uploadRoutes from './routes/uploads';
import healthRoutes from './routes/health';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { swaggerSetup } from './config/swagger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger documentation (dev only)
if (process.env.NODE_ENV === 'development') {
  swaggerSetup(app);
}

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/units', unitRoutes);
app.use('/api/v1/guests', guestRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/deposits', depositRoutes);
app.use('/api/v1/cleanings', cleaningRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/health', healthRoutes);

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
