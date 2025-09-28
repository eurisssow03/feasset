import { Router } from 'express';
import { CalendarController } from '../controllers/CalendarController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import Joi from 'joi';
import { Role } from '../types';

const router = Router();
const calendarController = new CalendarController();

// Validation schemas
const paramsSchema = Joi.object({
  id: Joi.string().required(),
});

/**
 * @swagger
 * /api/v1/calendar/connect:
 *   get:
 *     summary: Connect to Google Calendar (Admin only)
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google OAuth URL generated successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/connect', authenticate, authorize(Role.ADMIN), calendarController.connect);

/**
 * @swagger
 * /api/v1/calendar/connect/callback:
 *   get:
 *     summary: Google Calendar OAuth callback
 *     tags: [Calendar]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Google Calendar connected successfully
 *       400:
 *         description: Invalid OAuth code
 */
router.get('/connect/callback', calendarController.callback);

/**
 * @swagger
 * /api/v1/calendar/disconnect:
 *   post:
 *     summary: Disconnect from Google Calendar (Admin only)
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google Calendar disconnected successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post('/disconnect', authenticate, authorize(Role.ADMIN), calendarController.disconnect);

/**
 * @swagger
 * /api/v1/calendar/units/{id}/sync:
 *   post:
 *     summary: Sync unit with Google Calendar (Admin only)
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unit synced with Google Calendar successfully
 *       404:
 *         description: Unit not found
 *       403:
 *         description: Insufficient permissions
 */
router.post('/units/:id/sync', authenticate, authorize(Role.ADMIN), validateParams(paramsSchema), calendarController.syncUnit);

/**
 * @swagger
 * /api/v1/calendar/units/{id}/events:
 *   get:
 *     summary: Get unit calendar events (Admin only)
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Calendar events retrieved successfully
 *       404:
 *         description: Unit not found
 *       403:
 *         description: Insufficient permissions
 */
router.get('/units/:id/events', authenticate, authorize(Role.ADMIN), validateParams(paramsSchema), calendarController.getUnitEvents);

/**
 * @swagger
 * /api/v1/calendar/status:
 *   get:
 *     summary: Get Google Calendar connection status (Admin only)
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendar connection status retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/status', authenticate, authorize(Role.ADMIN), calendarController.getStatus);

export default router;
