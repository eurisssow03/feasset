import { Router } from 'express';
import { GuestController } from '../controllers/GuestController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';
import Joi from 'joi';
import { Role } from '@prisma/client';

const router = Router();
const guestController = new GuestController();

// Validation schemas
const createGuestSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().max(20).allow(''),
  email: Joi.string().email().allow(''),
  notes: Joi.string().max(1000).allow(''),
});

const updateGuestSchema = Joi.object({
  fullName: Joi.string().min(2).max(100),
  phone: Joi.string().max(20).allow(''),
  email: Joi.string().email().allow(''),
  notes: Joi.string().max(1000).allow(''),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow(''),
});

const paramsSchema = Joi.object({
  id: Joi.string().required(),
});

/**
 * @swagger
 * /api/v1/guests:
 *   get:
 *     summary: Get all guests
 *     tags: [Guests]
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
 *     responses:
 *       200:
 *         description: Guests retrieved successfully
 */
router.get('/', authenticate, validateQuery(querySchema), guestController.getAllGuests);

/**
 * @swagger
 * /api/v1/guests:
 *   post:
 *     summary: Create new guest
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *               email:
 *                 type: string
 *                 format: email
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Guest created successfully
 */
router.post('/', authenticate, validate(createGuestSchema), guestController.createGuest);

/**
 * @swagger
 * /api/v1/guests/{id}:
 *   get:
 *     summary: Get guest by ID
 *     tags: [Guests]
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
 *         description: Guest retrieved successfully
 *       404:
 *         description: Guest not found
 */
router.get('/:id', authenticate, validateParams(paramsSchema), guestController.getGuestById);

/**
 * @swagger
 * /api/v1/guests/{id}:
 *   put:
 *     summary: Update guest
 *     tags: [Guests]
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
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *               email:
 *                 type: string
 *                 format: email
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Guest updated successfully
 *       404:
 *         description: Guest not found
 */
router.put('/:id', authenticate, validateParams(paramsSchema), validate(updateGuestSchema), guestController.updateGuest);

/**
 * @swagger
 * /api/v1/guests/{id}:
 *   delete:
 *     summary: Delete guest (Admin only)
 *     tags: [Guests]
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
 *         description: Guest deleted successfully
 *       404:
 *         description: Guest not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:id', authenticate, authorize(Role.ADMIN), validateParams(paramsSchema), guestController.deleteGuest);

export default router;
