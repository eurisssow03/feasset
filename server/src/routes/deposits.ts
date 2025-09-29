import { Router } from 'express';
import { DepositController } from '../controllers/DepositController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import Joi from 'joi';
import { Role } from '../types';

const router = Router();
const depositController = new DepositController();

// Validation schemas
const requestDepositSchema = Joi.object({
  amount: Joi.number().precision(2).min(0).required(),
  reason: Joi.string().max(500).allow(''),
});

const collectDepositSchema = Joi.object({
  method: Joi.string().required(),
  txnId: Joi.string().max(100).allow(''),
  evidenceUrls: Joi.array().items(Joi.string().uri()).max(5),
});

const refundDepositSchema = Joi.object({
  amount: Joi.number().precision(2).min(0).required(),
  reason: Joi.string().max(500).required(),
  method: Joi.string().required(),
  txnId: Joi.string().max(100).allow(''),
  evidenceUrls: Joi.array().items(Joi.string().uri()).max(5),
});

const forfeitDepositSchema = Joi.object({
  amount: Joi.number().precision(2).min(0).required(),
  reason: Joi.string().max(500).required(),
  evidenceUrls: Joi.array().items(Joi.string().uri()).max(5),
});

const failDepositSchema = Joi.object({
  reason: Joi.string().max(500).required(),
});

const paramsSchema = Joi.object({
  id: Joi.string().required(),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('NOT_REQUIRED', 'PENDING', 'HELD', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FORFEITED', 'FAILED'),
  method: Joi.string(),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
});

/**
 * @swagger
 * /api/v1/deposits/ledger:
 *   get:
 *     summary: Get deposits ledger (Finance/Admin only)
 *     tags: [Deposits]
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
 *           enum: [NOT_REQUIRED, PENDING, HELD, PAID, PARTIALLY_REFUNDED, REFUNDED, FORFEITED, FAILED]
 *       - in: query
 *         name: method
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
 *         description: Deposits ledger retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/ledger', authenticate, authorize('FINANCE', 'ADMIN'), validate(querySchema), depositController.getDepositsLedger);

/**
 * @swagger
 * /api/v1/deposits/ledger/export:
 *   get:
 *     summary: Export deposits ledger as CSV (Finance/Admin only)
 *     tags: [Deposits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOT_REQUIRED, PENDING, HELD, PAID, PARTIALLY_REFUNDED, REFUNDED, FORFEITED, FAILED]
 *       - in: query
 *         name: method
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
 *         description: CSV file generated successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/ledger/export', authenticate, authorize('FINANCE', 'ADMIN'), validate(querySchema), depositController.exportDepositsLedger);

/**
 * @swagger
 * /api/v1/deposits/reservations/{id}/request:
 *   post:
 *     summary: Request deposit for reservation
 *     tags: [Deposits]
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Deposit requested successfully
 *       404:
 *         description: Reservation not found
 */
router.post('/reservations/:id/request', authenticate, validateParams(paramsSchema), validate(requestDepositSchema), depositController.requestDeposit);

/**
 * @swagger
 * /api/v1/deposits/reservations/{id}/collect:
 *   post:
 *     summary: Collect deposit for reservation
 *     tags: [Deposits]
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
 *               - method
 *             properties:
 *               method:
 *                 type: string
 *               txnId:
 *                 type: string
 *                 maxLength: 100
 *               evidenceUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Deposit collected successfully
 *       404:
 *         description: Reservation not found
 */
router.post('/reservations/:id/collect', authenticate, validateParams(paramsSchema), validate(collectDepositSchema), depositController.collectDeposit);

/**
 * @swagger
 * /api/v1/deposits/reservations/{id}/refund:
 *   post:
 *     summary: Refund deposit for reservation
 *     tags: [Deposits]
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
 *               - amount
 *               - reason
 *               - method
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *               method:
 *                 type: string
 *               txnId:
 *                 type: string
 *                 maxLength: 100
 *               evidenceUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Deposit refunded successfully
 *       404:
 *         description: Reservation not found
 */
router.post('/reservations/:id/refund', authenticate, validateParams(paramsSchema), validate(refundDepositSchema), depositController.refundDeposit);

/**
 * @swagger
 * /api/v1/deposits/reservations/{id}/forfeit:
 *   post:
 *     summary: Forfeit deposit for reservation
 *     tags: [Deposits]
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
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *               evidenceUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Deposit forfeited successfully
 *       404:
 *         description: Reservation not found
 */
router.post('/reservations/:id/forfeit', authenticate, validateParams(paramsSchema), validate(forfeitDepositSchema), depositController.forfeitDeposit);

/**
 * @swagger
 * /api/v1/deposits/reservations/{id}/fail:
 *   post:
 *     summary: Mark deposit as failed
 *     tags: [Deposits]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Deposit marked as failed successfully
 *       404:
 *         description: Reservation not found
 */
router.post('/reservations/:id/fail', authenticate, validateParams(paramsSchema), validate(failDepositSchema), depositController.failDeposit);

export default router;
