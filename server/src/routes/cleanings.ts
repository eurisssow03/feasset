import { Router } from 'express';
import { CleaningController } from '../controllers/CleaningController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';
import Joi from 'joi';
import { Role } from '../types';

const router = Router();
const cleaningController = new CleaningController();

// Validation schemas
const assignCleaningSchema = Joi.object({
  assignedToUserId: Joi.string().required(),
  scheduledDate: Joi.date().iso().required(),
  notes: Joi.string().max(1000).allow(''),
});

const updateCleaningSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'FAILED'),
  scheduledDate: Joi.date().iso(),
  notes: Joi.string().max(1000).allow(''),
});

const completeCleaningSchema = Joi.object({
  notes: Joi.string().max(1000).allow(''),
  photoUrls: Joi.array().items(Joi.string().uri()).max(5),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'FAILED'),
  assignedToUserId: Joi.string(),
  unitId: Joi.string(),
  scheduledFrom: Joi.date().iso(),
  scheduledTo: Joi.date().iso(),
});

const paramsSchema = Joi.object({
  id: Joi.string().required(),
});

/**
 * @swagger
 * /api/v1/cleanings:
 *   get:
 *     summary: Get all cleaning tasks
 *     tags: [Cleanings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ASSIGNED, IN_PROGRESS, DONE, FAILED]
 *       - in: query
 *         name: assignedToUserId
 *         schema:
 *           type: string
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: scheduledFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: scheduledTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Cleaning tasks retrieved successfully
 */
router.get('/', authenticate, validateQuery(querySchema), cleaningController.getAllCleanings);

/**
 * @swagger
 * /api/v1/cleanings/my-tasks:
 *   get:
 *     summary: Get my assigned cleaning tasks (Cleaner only)
 *     tags: [Cleanings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ASSIGNED, IN_PROGRESS, DONE, FAILED]
 *     responses:
 *       200:
 *         description: My cleaning tasks retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/my-tasks', authenticate, authorize(Role.CLEANER), validateQuery(querySchema), cleaningController.getMyTasks);

/**
 * @swagger
 * /api/v1/cleanings/{id}:
 *   get:
 *     summary: Get cleaning task by ID
 *     tags: [Cleanings]
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
 *         description: Cleaning task retrieved successfully
 *       404:
 *         description: Cleaning task not found
 */
router.get('/:id', authenticate, validateParams(paramsSchema), cleaningController.getCleaningById);

/**
 * @swagger
 * /api/v1/cleanings/{id}/assign:
 *   post:
 *     summary: Assign cleaning task (Admin/Manager only)
 *     tags: [Cleanings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedToUserId
 *               - scheduledDate
 *             properties:
 *               assignedToUserId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Cleaning task assigned successfully
 *       404:
 *         description: Cleaning task not found
 *       403:
 *         description: Insufficient permissions
 */
router.post('/:id/assign', authenticate, authorize(Role.ADMIN), validateParams(paramsSchema), validate(assignCleaningSchema), cleaningController.assignCleaning);

/**
 * @swagger
 * /api/v1/cleanings/{id}/start:
 *   post:
 *     summary: Start cleaning task (Cleaner only)
 *     tags: [Cleanings]
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
 *         description: Cleaning task started successfully
 *       404:
 *         description: Cleaning task not found
 *       403:
 *         description: Insufficient permissions
 */
router.post('/:id/start', authenticate, authorize(Role.CLEANER), validateParams(paramsSchema), cleaningController.startCleaning);

/**
 * @swagger
 * /api/v1/cleanings/{id}/complete:
 *   post:
 *     summary: Complete cleaning task (Cleaner only)
 *     tags: [Cleanings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *               photoUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Cleaning task completed successfully
 *       404:
 *         description: Cleaning task not found
 *       403:
 *         description: Insufficient permissions
 */
router.post('/:id/complete', authenticate, authorize(Role.CLEANER), validateParams(paramsSchema), validate(completeCleaningSchema), cleaningController.completeCleaning);

/**
 * @swagger
 * /api/v1/cleanings/{id}:
 *   put:
 *     summary: Update cleaning task (Admin only)
 *     tags: [Cleanings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, ASSIGNED, IN_PROGRESS, DONE, FAILED]
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Cleaning task updated successfully
 *       404:
 *         description: Cleaning task not found
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id', authenticate, authorize(Role.ADMIN), validateParams(paramsSchema), validate(updateCleaningSchema), cleaningController.updateCleaning);

export default router;
