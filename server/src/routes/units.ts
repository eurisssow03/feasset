import { Router } from 'express';
import { UnitController } from '../controllers/UnitController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';
import Joi from 'joi';
import { Role } from '@prisma/client';

const router = Router();
const unitController = new UnitController();

// Validation schemas
const createUnitSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(2).max(20).required(),
  address: Joi.string().max(500).allow(''),
  active: Joi.boolean().default(true),
});

const updateUnitSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  code: Joi.string().min(2).max(20),
  address: Joi.string().max(500).allow(''),
  active: Joi.boolean(),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow(''),
  active: Joi.boolean(),
});

const paramsSchema = Joi.object({
  id: Joi.string().required(),
});

const syncCalendarSchema = Joi.object({
  calendarId: Joi.string().required(),
});

/**
 * @swagger
 * /api/v1/units:
 *   get:
 *     summary: Get all units
 *     tags: [Units]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Units retrieved successfully
 */
router.get('/', authenticate, validateQuery(querySchema), unitController.getAllUnits);

/**
 * @swagger
 * /api/v1/units:
 *   post:
 *     summary: Create new unit (Admin only)
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *               address:
 *                 type: string
 *                 maxLength: 500
 *               active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Unit created successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', authenticate, authorize(Role.ADMIN), validate(createUnitSchema), unitController.createUnit);

/**
 * @swagger
 * /api/v1/units/{id}:
 *   get:
 *     summary: Get unit by ID
 *     tags: [Units]
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
 *         description: Unit retrieved successfully
 *       404:
 *         description: Unit not found
 */
router.get('/:id', authenticate, validateParams(paramsSchema), unitController.getUnitById);

/**
 * @swagger
 * /api/v1/units/{id}:
 *   put:
 *     summary: Update unit (Admin only)
 *     tags: [Units]
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
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *               address:
 *                 type: string
 *                 maxLength: 500
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *       404:
 *         description: Unit not found
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id', authenticate, authorize(Role.ADMIN), validateParams(paramsSchema), validate(updateUnitSchema), unitController.updateUnit);

/**
 * @swagger
 * /api/v1/units/{id}:
 *   delete:
 *     summary: Delete unit (Admin only)
 *     tags: [Units]
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
 *         description: Unit deleted successfully
 *       404:
 *         description: Unit not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:id', authenticate, authorize(Role.ADMIN), validateParams(paramsSchema), unitController.deleteUnit);

/**
 * @swagger
 * /api/v1/units/{id}/sync-calendar:
 *   post:
 *     summary: Sync unit with Google Calendar (Admin only)
 *     tags: [Units]
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
 *               - calendarId
 *             properties:
 *               calendarId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Calendar sync configured successfully
 *       404:
 *         description: Unit not found
 *       403:
 *         description: Insufficient permissions
 */
router.post('/:id/sync-calendar', authenticate, authorize(Role.ADMIN), validateParams(paramsSchema), validate(syncCalendarSchema), unitController.syncCalendar);

export default router;
