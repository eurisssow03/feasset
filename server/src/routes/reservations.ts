import { Router } from 'express';
import { ReservationController } from '../controllers/ReservationController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';
import Joi from 'joi';
import { Role } from '../types';

const router = Router();
const reservationController = new ReservationController();

// Validation schemas
const createReservationSchema = Joi.object({
  unitId: Joi.string().required(),
  guestId: Joi.string().required(),
  checkIn: Joi.date().iso().required(),
  checkOut: Joi.date().iso().required(),
  nightlyRate: Joi.number().precision(2).min(0),
  cleaningFee: Joi.number().precision(2).min(0),
  totalAmount: Joi.number().precision(2).min(0),
  depositRequired: Joi.boolean().default(false),
  depositAmount: Joi.number().precision(2).min(0),
  headCount: Joi.number().integer().min(1).default(1),
  specialRequests: Joi.string().max(1000).allow(''),
});

const updateReservationSchema = Joi.object({
  unitId: Joi.string(),
  guestId: Joi.string(),
  checkIn: Joi.date().iso(),
  checkOut: Joi.date().iso(),
  nightlyRate: Joi.number().precision(2).min(0),
  cleaningFee: Joi.number().precision(2).min(0),
  totalAmount: Joi.number().precision(2).min(0),
  depositRequired: Joi.boolean(),
  depositAmount: Joi.number().precision(2).min(0),
  headCount: Joi.number().integer().min(1),
  specialRequests: Joi.string().max(1000).allow(''),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow(''),
  status: Joi.string().valid('DRAFT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELED'),
  unitId: Joi.string(),
  guestId: Joi.string(),
  checkInFrom: Joi.date().iso(),
  checkInTo: Joi.date().iso(),
  checkOutFrom: Joi.date().iso(),
  checkOutTo: Joi.date().iso(),
});

const paramsSchema = Joi.object({
  id: Joi.string().required(),
});

const extendReservationSchema = Joi.object({
  newCheckOut: Joi.date().iso().required(),
  reason: Joi.string().max(500).allow(''),
});

/**
 * @swagger
 * /api/v1/reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELED]
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: guestId
 *         schema:
 *           type: string
 *       - in: query
 *         name: checkInFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: checkInTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reservations retrieved successfully
 */
router.get('/', authenticate, validateQuery(querySchema), reservationController.getAllReservations);

/**
 * @swagger
 * /api/v1/reservations:
 *   post:
 *     summary: Create new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unitId
 *               - guestId
 *               - checkIn
 *               - checkOut
 *             properties:
 *               unitId:
 *                 type: string
 *               guestId:
 *                 type: string
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *               nightlyRate:
 *                 type: number
 *                 minimum: 0
 *               cleaningFee:
 *                 type: number
 *                 minimum: 0
 *               totalAmount:
 *                 type: number
 *                 minimum: 0
 *               depositRequired:
 *                 type: boolean
 *                 default: false
 *               depositAmount:
 *                 type: number
 *                 minimum: 0
 *               headCount:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *               specialRequests:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Reservation created successfully
 */
router.post('/', authenticate, validate(createReservationSchema), reservationController.createReservation);

/**
 * @swagger
 * /api/v1/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags: [Reservations]
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
 *         description: Reservation retrieved successfully
 *       404:
 *         description: Reservation not found
 */
router.get('/:id', authenticate, validateParams(paramsSchema), reservationController.getReservationById);

/**
 * @swagger
 * /api/v1/reservations/{id}:
 *   put:
 *     summary: Update reservation
 *     tags: [Reservations]
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
 *               unitId:
 *                 type: string
 *               guestId:
 *                 type: string
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *               nightlyRate:
 *                 type: number
 *                 minimum: 0
 *               cleaningFee:
 *                 type: number
 *                 minimum: 0
 *               totalAmount:
 *                 type: number
 *                 minimum: 0
 *               depositRequired:
 *                 type: boolean
 *               depositAmount:
 *                 type: number
 *                 minimum: 0
 *               headCount:
 *                 type: integer
 *                 minimum: 1
 *               specialRequests:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Reservation updated successfully
 *       404:
 *         description: Reservation not found
 */
router.put('/:id', authenticate, validateParams(paramsSchema), validate(updateReservationSchema), reservationController.updateReservation);

/**
 * @swagger
 * /api/v1/reservations/{id}:
 *   delete:
 *     summary: Delete reservation (Admin only)
 *     tags: [Reservations]
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
 *         description: Reservation deleted successfully
 *       404:
 *         description: Reservation not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:id', authenticate, authorize('ADMIN'), validateParams(paramsSchema), reservationController.deleteReservation);

/**
 * @swagger
 * /api/v1/reservations/{id}/check-in:
 *   post:
 *     summary: Check in reservation
 *     tags: [Reservations]
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
 *         description: Check-in successful
 *       400:
 *         description: Check-in not allowed
 *       404:
 *         description: Reservation not found
 */
router.post('/:id/check-in', authenticate, validateParams(paramsSchema), reservationController.checkIn);

/**
 * @swagger
 * /api/v1/reservations/{id}/check-out:
 *   post:
 *     summary: Check out reservation
 *     tags: [Reservations]
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
 *         description: Check-out successful
 *       400:
 *         description: Check-out not allowed
 *       404:
 *         description: Reservation not found
 */
router.post('/:id/check-out', authenticate, validateParams(paramsSchema), reservationController.checkOut);

/**
 * @swagger
 * /api/v1/reservations/{id}/extend:
 *   post:
 *     summary: Extend reservation
 *     tags: [Reservations]
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
 *               - newCheckOut
 *             properties:
 *               newCheckOut:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Reservation extended successfully
 *       400:
 *         description: Extension not allowed
 *       404:
 *         description: Reservation not found
 */
router.post('/:id/extend', authenticate, validateParams(paramsSchema), validate(extendReservationSchema), reservationController.extend);

/**
 * @swagger
 * /api/v1/reservations/{id}/cancel:
 *   post:
 *     summary: Cancel reservation
 *     tags: [Reservations]
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
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Reservation canceled successfully
 *       400:
 *         description: Cancellation not allowed
 *       404:
 *         description: Reservation not found
 */
router.post('/:id/cancel', authenticate, validateParams(paramsSchema), reservationController.cancel);

export default router;
