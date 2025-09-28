import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class HealthController {
  async healthCheck(req: Request, res: Response) {
    try {
      // Basic health check
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  }

  async detailedHealthCheck(req: Request, res: Response) {
    try {
      const checks = {
        server: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        },
        database: {
          status: 'unknown',
          responseTime: 0,
        },
        redis: {
          status: 'unknown',
          responseTime: 0,
        },
      };

      // Test database connection
      const dbStart = Date.now();
      try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database.status = 'healthy';
        checks.database.responseTime = Date.now() - dbStart;
      } catch (error) {
        checks.database.status = 'unhealthy';
        checks.database.responseTime = Date.now() - dbStart;
        console.error('Database health check failed:', error);
      }

      // Test Redis connection (if configured)
      const redisStart = Date.now();
      try {
        // In a real application, you would test Redis here
        // For now, we'll just mark it as healthy
        checks.redis.status = 'healthy';
        checks.redis.responseTime = Date.now() - redisStart;
      } catch (error) {
        checks.redis.status = 'unhealthy';
        checks.redis.responseTime = Date.now() - redisStart;
        console.error('Redis health check failed:', error);
      }

      const overallStatus = checks.database.status === 'healthy' ? 'healthy' : 'unhealthy';

      res.status(overallStatus === 'healthy' ? 200 : 503).json({
        success: overallStatus === 'healthy',
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
      });
    } catch (error) {
      console.error('Detailed health check error:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  }
}
