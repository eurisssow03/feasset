import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

const router = Router();
const healthController = new HealthController();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', healthController.healthCheck);

/**
 * @swagger
 * /api/v1/health/detailed:
 *   get:
 *     summary: Detailed health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health status
 *       503:
 *         description: Service is unhealthy
 */
router.get('/detailed', healthController.detailedHealthCheck);

export default router;
