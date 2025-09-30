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

// __dirname is available in CommonJS modules
declare const __dirname: string;

// Load environment variables
dotenv.config();

// Check critical environment variables
console.log('🔧 Environment check:');
console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('🔑 JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);
console.log('🗄️ DATABASE_URL exists:', !!process.env.DATABASE_URL);

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

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API status endpoint
app.get('/', (req: any, res: any) => {
  res.json({ 
    message: 'Homestay Management API is running!',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      locations: '/api/locations',
      units: '/api/units',
      reservations: '/api/reservations',
      guests: '/api/guests',
      users: '/api/users',
      cleanings: '/api/cleanings'
    }
  });
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
    const period = req.query.period || 'today';
    const data = await dbService.getDashboardData(period);
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

// Locations endpoints
app.get('/api/locations', async (req: any, res: any) => {
  try {
    const locations = await dbService.getAllLocations();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

app.post('/api/locations', async (req: any, res: any) => {
  try {
    const location = await dbService.createLocation(req.body);
    res.json(location);
  } catch (error: any) {
    console.error('Error creating location:', error);
    res.status(400).json({ error: error.message || 'Failed to create location' });
  }
});

app.put('/api/locations/:id', async (req: any, res: any) => {
  try {
    const location = await dbService.updateLocation(req.params.id, req.body);
    res.json(location);
  } catch (error: any) {
    console.error('Error updating location:', error);
    res.status(400).json({ error: error.message || 'Failed to update location' });
  }
});

// Users endpoints
app.get('/api/users', async (req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
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

// API not found handler
app.get('*', (req: any, res: any) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    message: 'Please check the available endpoints at the root URL',
    availableEndpoints: [
      '/health',
      '/api/locations',
      '/api/units', 
      '/api/reservations',
      '/api/guests',
      '/api/users',
      '/api/cleanings'
    ]
  });
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
