import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

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
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint to check database connection and user data
app.get('/api/debug/users', async (req: any, res: any) => {
  try {
    console.log('🔍 Debug: Checking database connection...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    console.log('👥 Debug: Found users:', users);
    res.json({ 
      success: true, 
      count: users.length, 
      users: users,
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('💥 Debug: Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: error.message 
    });
  }
});

// Manual database setup endpoint
app.post('/api/debug/setup', async (req: any, res: any) => {
  try {
    console.log('🔧 Manual database setup requested...');
    
    // This will be handled by the build process, but we can provide instructions
    res.json({
      success: true,
      message: 'Database setup should be handled during deployment. Please redeploy the application to run database migrations and seeding.',
      instructions: [
        '1. The database tables will be created during deployment',
        '2. Admin user will be seeded automatically',
        '3. Check the deployment logs for database setup progress'
      ]
    });
  } catch (error) {
    console.error('💥 Debug: Setup error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Setup failed',
      details: error.message 
    });
  }
});

// Test authentication endpoint
app.post('/api/auth/test', (req: any, res: any) => {
  console.log('🧪 Test auth endpoint hit');
  console.log('📝 Request body:', req.body);
  res.json({ 
    success: true, 
    message: 'Auth endpoint is working',
    receivedData: req.body 
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Data endpoints for the frontend
import { dbService } from './services/DatabaseService';

// Dashboard data
app.get('/api/dashboard', async (req: any, res: any) => {
  try {
    const data = await dbService.getDashboardData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Units endpoints
app.get('/api/units', async (req: any, res: any) => {
  try {
    const units = await dbService.getAllUnits();
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

app.post('/api/units', async (req: any, res: any) => {
  try {
    const unit = await dbService.createUnit(req.body);
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

app.put('/api/units/:id', async (req: any, res: any) => {
  try {
    const unit = await dbService.updateUnit(req.params.id, req.body);
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

// Guests endpoints
app.get('/api/guests', async (req: any, res: any) => {
  try {
    const guests = await dbService.getAllGuests();
    res.json(guests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

app.post('/api/guests', async (req: any, res: any) => {
  try {
    const guest = await dbService.createGuest(req.body);
    res.json(guest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create guest' });
  }
});

app.put('/api/guests/:id', async (req: any, res: any) => {
  try {
    const guest = await dbService.updateGuest(req.params.id, req.body);
    res.json(guest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update guest' });
  }
});

// Reservations endpoints
app.get('/api/reservations', async (req: any, res: any) => {
  try {
    const reservations = await dbService.getAllReservations();
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

app.post('/api/reservations', async (req: any, res: any) => {
  try {
    const reservation = await dbService.createReservation(req.body);
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

app.put('/api/reservations/:id', async (req: any, res: any) => {
  try {
    const reservation = await dbService.updateReservation(req.params.id, req.body);
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

// Cleaning tasks endpoints
app.get('/api/cleanings', async (req: any, res: any) => {
  try {
    const tasks = await dbService.getAllCleaningTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cleaning tasks' });
  }
});

app.post('/api/cleanings', async (req: any, res: any) => {
  try {
    const task = await dbService.createCleaningTask(req.body);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create cleaning task' });
  }
});

// Calendar integration endpoints
app.get('/api/calendar/status', async (req: any, res: any) => {
  try {
    // This would check Google Calendar connection status
    res.json({ connected: false, calendarId: null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get calendar status' });
  }
});

app.post('/api/calendar/sync/:id', async (req: any, res: any) => {
  try {
    const reservation = await dbService.syncReservationToCalendar(req.params.id);
    res.json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync to calendar' });
  }
});

// Serve the React app for all routes (SPA routing)
app.get('*', (req: any, res: any) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

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
  console.log(`🚀 Homestay Manager running on port ${PORT}`);
  console.log(`🏠 Web Application: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
