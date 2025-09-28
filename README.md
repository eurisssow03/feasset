# FE Homestay Manager

A comprehensive homestay management system built with modern web technologies. This system provides end-to-end homestay operations including reservations, deposits, check-in/out, cleaner scheduling, and finance consolidation with Google Calendar integration.

## 🚀 Features

### Core Functionality
- **Reservation Management**: Create, edit, check-in, check-out, extend, and cancel reservations
- **Deposit Handling**: Complete deposit lifecycle management with multiple payment methods
- **Cleaning Workflow**: Automated task creation and cleaner assignment system
- **Finance Module**: Revenue tracking, deposit ledger, and financial reporting
- **Google Calendar Integration**: Automatic event synchronization
- **Role-Based Access Control**: ADMIN, FINANCE, CLEANER, and AGENT roles

### User Roles
- **ADMIN**: Full system access including user management
- **FINANCE**: View reservations, deposits, cleaning tasks, and financial reports
- **CLEANER**: Manage assigned cleaning tasks and upload completion photos
- **AGENT**: Create reservations only (cannot delete)

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** with Zod validation
- **Lucide React** for icons

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** with Prisma ORM
- **JWT** authentication with refresh tokens
- **Google APIs** for Calendar integration
- **Multer** for file uploads
- **Swagger/OpenAPI** documentation

### Infrastructure
- **Docker** and Docker Compose
- **Redis** for caching (optional)
- **Nginx** for reverse proxy
- **ESLint** and **Prettier** for code quality

## 📦 Project Structure

```
feasset/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities and API client
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # Database scripts
│   │   └── index.ts        # Server entry point
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── docker-compose.yml      # Docker services configuration
├── package.json            # Root package.json for workspace
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)

### 1. Clone and Install

```bash
git clone <repository-url>
cd feasset
npm install
```

### 2. Environment Setup

Copy the environment file and configure:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```env
# Server
PORT=8080
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/homestay?schema=public

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/v1/calendar/connect/callback

# Admin User
ADMIN_EMAIL=admin@homestay.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=System Administrator
```

### 3. Database Setup

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Generate Prisma client and run migrations
cd server
npm run db:generate
npm run db:push

# Seed the database with sample data
npm run db:seed
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:server  # Backend on :8080
npm run dev:client  # Frontend on :5173
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api-docs
- **Health Check**: http://localhost:8080/health

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@homestay.com | admin123 |
| Finance | finance@homestay.com | finance123 |
| Cleaner | cleaner@homestay.com | cleaner123 |
| Agent | agent@homestay.com | agent123 |

## 🐳 Docker Deployment

### Development with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

1. Update environment variables for production
2. Build and deploy:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Database Schema

### Key Entities

- **Users**: System users with role-based access
- **Units**: Homestay properties/rooms
- **Guests**: Guest information and profiles
- **Reservations**: Booking records with status tracking
- **Deposits**: Deposit management with event logging
- **CleaningTasks**: Cleaning assignments and completion tracking
- **AuditLogs**: System activity logging

### Enums

- **Role**: ADMIN, FINANCE, CLEANER, AGENT
- **ReservationStatus**: DRAFT, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELED
- **DepositStatus**: NOT_REQUIRED, PENDING, HELD, PAID, PARTIALLY_REFUNDED, REFUNDED, FORFEITED, FAILED
- **CleaningStatus**: PENDING, ASSIGNED, IN_PROGRESS, DONE, FAILED

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Reservations
- `GET /api/v1/reservations` - List reservations
- `POST /api/v1/reservations` - Create reservation
- `GET /api/v1/reservations/:id` - Get reservation details
- `PUT /api/v1/reservations/:id` - Update reservation
- `POST /api/v1/reservations/:id/check-in` - Check in
- `POST /api/v1/reservations/:id/check-out` - Check out
- `POST /api/v1/reservations/:id/extend` - Extend reservation
- `POST /api/v1/reservations/:id/cancel` - Cancel reservation

### Deposits
- `GET /api/v1/deposits/ledger` - Get deposits ledger
- `POST /api/v1/deposits/reservations/:id/request` - Request deposit
- `POST /api/v1/deposits/reservations/:id/collect` - Collect deposit
- `POST /api/v1/deposits/reservations/:id/refund` - Refund deposit
- `POST /api/v1/deposits/reservations/:id/forfeit` - Forfeit deposit

### Cleaning Tasks
- `GET /api/v1/cleanings` - List cleaning tasks
- `GET /api/v1/cleanings/my-tasks` - Get cleaner's tasks
- `POST /api/v1/cleanings/:id/assign` - Assign task
- `POST /api/v1/cleanings/:id/start` - Start task
- `POST /api/v1/cleanings/:id/complete` - Complete task

### Finance
- `GET /api/v1/finance/dashboard` - Dashboard statistics
- `GET /api/v1/finance/cleanings` - Cleaning consolidation
- `GET /api/v1/finance/deposits` - Deposits summary
- `GET /api/v1/finance/reports/monthly` - Monthly report

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `CORS_ORIGIN` | CORS allowed origin | http://localhost:5173 |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | - |
| `ADMIN_EMAIL` | Default admin email | admin@homestay.com |
| `ADMIN_PASSWORD` | Default admin password | admin123 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api-docs`
- Review the code comments and documentation

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete homestay management system
- Role-based access control
- Google Calendar integration
- Docker support
- Comprehensive API documentation
