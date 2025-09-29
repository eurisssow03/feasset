# 🚀 Render Deployment Guide

## Database Schema Changes Deployment

This guide will help you deploy the enhanced Location and Unit schema changes to Render.

## 📋 Prerequisites

1. **Render Account**: Make sure you have a Render account
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)
3. **Database Access**: Access to your Render PostgreSQL database

## 🔧 Step 1: Local Database Migration

Before deploying to Render, test the migration locally:

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migration locally (if you have a local database)
npx prisma migrate dev --name enhance-location-unit-schema

# Or push changes directly (for development)
npx prisma db push --accept-data-loss
```

## 🌐 Step 2: Deploy to Render

### Option A: Using Render Dashboard

1. **Go to your Render dashboard**
2. **Select your backend service**
3. **Go to "Settings" → "Build & Deploy"**
4. **Update Build Command**:
   ```bash
   cd server && npm ci && npx prisma generate
   ```
5. **Update Start Command**:
   ```bash
   cd server && npx prisma migrate deploy && npm start
   ```
6. **Click "Save Changes"**
7. **Trigger a manual deploy**

### Option B: Using render.yaml (Recommended)

1. **Commit all changes to your Git repository**
2. **Push to your main branch**
3. **Render will automatically detect the render.yaml file**
4. **The deployment will run the migration automatically**

## 🗄️ Step 3: Database Migration

The migration will:
- ✅ Create the simplified `locations` table
- ✅ Add new columns to `units` table (cleaningCost, facilities)
- ✅ Remove the `address` column from `units`
- ✅ Add foreign key relationship between units and locations

## 🌱 Step 4: Seed Production Database (Optional)

After deployment, you can seed the production database:

```bash
# Connect to your Render service via SSH or use Render Shell
cd server
npm run db:seed:prod
```

## 🔍 Step 5: Verify Deployment

1. **Check your backend logs** in Render dashboard
2. **Verify the database schema** using Prisma Studio:
   ```bash
   npx prisma studio
   ```
3. **Test the API endpoints**:
   - `GET /api/locations` - Should return locations
   - `GET /api/units` - Should return units with new fields

## 📊 Database Schema Changes

### Locations Table (Simplified)
```sql
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);
```

### Units Table (Enhanced)
```sql
ALTER TABLE "units" 
DROP COLUMN "address",
ADD COLUMN "cleaningCost" DECIMAL(10,2),
ADD COLUMN "washingMachine" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "airConditioning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "wifi" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "kitchen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "parking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "balcony" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pool" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "gym" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "locationId" TEXT;
```

## 🚨 Troubleshooting

### Migration Fails
- Check Render logs for specific error messages
- Ensure DATABASE_URL is correctly set
- Verify database permissions

### Build Fails
- Check if all dependencies are installed
- Verify Prisma client generation
- Check TypeScript compilation errors

### Runtime Errors
- Verify environment variables
- Check database connection
- Review application logs

## 🔄 Rollback (If Needed)

If you need to rollback:

1. **Revert to previous commit**
2. **Redeploy to Render**
3. **Run rollback migration** (if you have one)

## 📝 Environment Variables

Make sure these are set in Render:

```env
DATABASE_URL=postgresql://...
NODE_ENV=production
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

## ✅ Success Checklist

- [ ] Migration runs successfully
- [ ] New locations table created
- [ ] Units table updated with new fields
- [ ] API endpoints working
- [ ] Frontend can create/edit locations and units
- [ ] Database seeded with sample data (optional)

## 🎉 You're Done!

Your enhanced Location and Unit management system is now deployed to Render with:
- ✅ Simplified Location management
- ✅ Enhanced Unit management with facilities
- ✅ Location dropdown in Unit forms
- ✅ Cleaning cost tracking
- ✅ Room facilities checkboxes

Happy coding! 🚀
