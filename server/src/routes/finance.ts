import { Router } from 'express';
import { FinanceController } from '../controllers/FinanceController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import Joi from 'joi';
import { Role } from '../types';

const router = Router();
const financeController = new FinanceController();

// Validation schemas
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  status: Joi.string().valid('PENDING', 'DONE', 'FAILED'),
});

const cleaningConsolidationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED'),
  unitId: Joi.string(),
});

/**
 * @swagger
 * /api/v1/finance/dashboard:
 *   get:
 *     summary: Get finance dashboard data (Finance/Admin only)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Finance dashboard data retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/dashboard', authenticate, authorize('FINANCE', 'ADMIN'), financeController.getDashboard);

/**
 * @swagger
 * /api/v1/finance/cleanings:
 *   get:
 *     summary: Get cleaning consolidation data (Finance/Admin only)
 *     tags: [Finance]
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
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cleaning consolidation data retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/cleanings', authenticate, authorize('FINANCE', 'ADMIN'), validateQuery(cleaningConsolidationQuerySchema), financeController.getCleaningConsolidation);

/**
 * @swagger
 * /api/v1/finance/cleanings/export:
 *   get:
 *     summary: Export cleaning consolidation as CSV (Finance/Admin only)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file generated successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/cleanings/export', authenticate, authorize('FINANCE', 'ADMIN'), validateQuery(cleaningConsolidationQuerySchema), financeController.exportCleaningConsolidation);

/**
 * @swagger
 * /api/v1/finance/cleanings/approve:
 *   post:
 *     summary: Approve cleaning consolidation batch (Finance/Admin only)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cleaningTaskIds
 *             properties:
 *               cleaningTaskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Cleaning consolidation approved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post('/cleanings/approve', authenticate, authorize('FINANCE', 'ADMIN'), financeController.approveCleaningConsolidation);

/**
 * @swagger
 * /api/v1/finance/deposits:
 *   get:
 *     summary: Get deposits summary (Finance/Admin only)
 *     tags: [Finance]
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
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOT_REQUIRED, PENDING, HELD, PAID, PARTIALLY_REFUNDED, REFUNDED, FORFEITED, FAILED]
 *     responses:
 *       200:
 *         description: Deposits summary retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/deposits', authenticate, authorize('FINANCE', 'ADMIN'), validateQuery(querySchema), financeController.getDepositsSummary);

/**
 * @swagger
 * /api/v1/finance/deposits/export:
 *   get:
 *     summary: Export deposits summary as CSV (Finance/Admin only)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOT_REQUIRED, PENDING, HELD, PAID, PARTIALLY_REFUNDED, REFUNDED, FORFEITED, FAILED]
 *     responses:
 *       200:
 *         description: CSV file generated successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/deposits/export', authenticate, authorize('FINANCE', 'ADMIN'), validateQuery(querySchema), financeController.exportDepositsSummary);

/**
 * @swagger
 * /api/v1/finance/reports/monthly:
 *   get:
 *     summary: Get monthly financial report (Finance/Admin only)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2030
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Monthly financial report retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/reports/monthly', authenticate, authorize('FINANCE', 'ADMIN'), financeController.getMonthlyReport);

export default router;
