import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { DepositStatus, AuthRequest } from '../types';

const prisma = new PrismaClient();

export class DepositController {
  async getDepositsLedger(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        method,
        fromDate,
        toDate
      } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where: any = {};

      if (status) {
        where.depositStatus = status as DepositStatus;
      }

      if (method) {
        where.depositMethod = method as string;
      }

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.createdAt.lte = new Date(toDate as string);
        }
      }

      const [reservations, total] = await Promise.all([
        prisma.reservation.findMany({
          where,
          skip,
          take,
          include: {
            guest: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            unit: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            depositEvents: {
              orderBy: { createdAt: 'desc' },
              include: {
                actedBy: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.reservation.count({ where }),
      ]);

      // Calculate summary statistics
      const summary = await prisma.reservation.aggregate({
        where,
        _sum: {
          depositAmount: true,
          depositRefundAmt: true,
          depositForfeitAmt: true,
        },
        _count: {
          depositStatus: true,
        },
      });

      res.json({
        success: true,
        data: reservations,
        summary: {
          totalDeposits: summary._sum.depositAmount || 0,
          totalRefunded: summary._sum.depositRefundAmt || 0,
          totalForfeited: summary._sum.depositForfeitAmt || 0,
          totalCount: summary._count.depositStatus,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get deposits ledger error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async exportDepositsLedger(req: Request, res: Response): Promise<void> {
    try {
      const { status, method, fromDate, toDate } = req.query;

      // Build where clause
      const where: any = {};

      if (status) {
        where.depositStatus = status as DepositStatus;
      }

      if (method) {
        where.depositMethod = method as string;
      }

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.createdAt.lte = new Date(toDate as string);
        }
      }

      const reservations = await prisma.reservation.findMany({
        where,
        include: {
          guest: {
            select: {
              fullName: true,
              email: true,
            },
          },
          unit: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Generate CSV
      const csvHeader = 'Reservation ID,Guest Name,Guest Email,Unit,Check In,Check Out,Deposit Amount,Deposit Status,Deposit Method,Transaction ID,Collected At,Refunded At,Refund Amount,Forfeit Amount,Created At\n';
      
      const csvRows = reservations.map((reservation: any) => {
        return [
          reservation.id,
          reservation.guest.fullName,
          reservation.guest.email || '',
          `${reservation.unit.name} (${reservation.unit.code})`,
          reservation.checkIn.toISOString().split('T')[0],
          reservation.checkOut.toISOString().split('T')[0],
          reservation.depositAmount || 0,
          reservation.depositStatus,
          reservation.depositMethod || '',
          reservation.depositTxnId || '',
          reservation.depositPaidAt?.toISOString().split('T')[0] || '',
          reservation.depositRefundedAt?.toISOString().split('T')[0] || '',
          reservation.depositRefundAmt || 0,
          reservation.depositForfeitAmt || 0,
          reservation.createdAt.toISOString().split('T')[0],
        ].join(',');
      }).join('\n');

      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="deposits-ledger.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Export deposits ledger error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async requestDeposit(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const { amount, reason } = req.body as any;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
        return;
      }

      if (reservation.depositRequired) {
        res.status(400).json({
          success: false,
          error: 'Deposit is already required for this reservation',
        });
        return;
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: {
          depositRequired: true,
          depositAmount: amount,
          depositStatus: 'PENDING',
        },
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Create deposit event
      await prisma.depositEvent.create({
        data: {
          reservationId: id,
          type: 'request',
          status: 'PENDING',
          amount,
          reason,
          actedById: req.user?.id,
        },
      });

      res.json({
        success: true,
        data: updatedReservation,
        message: 'Deposit requested successfully',
      });
    } catch (error) {
      console.error('Request deposit error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async collectDeposit(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const { method, txnId, evidenceUrls = [] } = req.body as any;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
        return;
      }

      if (!reservation.depositRequired) {
        res.status(400).json({
          success: false,
          error: 'No deposit required for this reservation',
        });
        return;
      }

      if (reservation.depositStatus === 'PAID') {
        res.status(400).json({
          success: false,
          error: 'Deposit already collected',
        });
        return;
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: {
          depositStatus: 'PAID',
          depositMethod: method,
          depositTxnId: txnId,
          depositPaidAt: new Date(),
          depositEvidenceUrls: evidenceUrls,
        },
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Create deposit event
      await prisma.depositEvent.create({
        data: {
          reservationId: id,
          type: 'collect',
          status: 'PAID',
          amount: reservation.depositAmount || 0,
          method,
          txnId,
          evidenceUrls,
          actedById: req.user?.id,
        },
      });

      res.json({
        success: true,
        data: updatedReservation,
        message: 'Deposit collected successfully',
      });
    } catch (error) {
      console.error('Collect deposit error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async refundDeposit(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const { amount, reason, method, txnId, evidenceUrls = [] } = req.body as any;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
        return;
      }

      if (!['HELD', 'PAID'].includes(reservation.depositStatus)) {
        res.status(400).json({
          success: false,
          error: 'Deposit must be held or paid to refund',
        });
        return;
      }

      const refundAmount = parseFloat(amount);
      const currentDepositAmount = parseFloat(String(reservation.depositAmount || 0));
      const currentRefundAmount = parseFloat(String(reservation.depositRefundAmt || 0));

      if (refundAmount > (currentDepositAmount - currentRefundAmount)) {
        res.status(400).json({
          success: false,
          error: 'Refund amount cannot exceed remaining deposit amount',
        });
        return;
      }

      const newRefundAmount = currentRefundAmount + refundAmount;
      const isFullyRefunded = newRefundAmount >= currentDepositAmount;

      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: {
          depositStatus: isFullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          depositRefundAmt: newRefundAmount,
          depositRefundedAt: new Date(),
          depositRefundReason: reason,
        },
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Create deposit event
      await prisma.depositEvent.create({
        data: {
          reservationId: id,
          type: 'refund',
          status: isFullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          amount: refundAmount,
          method,
          txnId,
          reason,
          evidenceUrls,
          actedById: req.user?.id,
        },
      });

      res.json({
        success: true,
        data: updatedReservation,
        message: `Deposit ${isFullyRefunded ? 'fully' : 'partially'} refunded successfully`,
      });
    } catch (error) {
      console.error('Refund deposit error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async forfeitDeposit(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const { amount, reason, evidenceUrls = [] } = req.body as any;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
        return;
      }

      if (!['HELD', 'PAID'].includes(reservation.depositStatus)) {
        res.status(400).json({
          success: false,
          error: 'Deposit must be held or paid to forfeit',
        });
        return;
      }

      const forfeitAmount = parseFloat(amount);
      const currentDepositAmount = parseFloat(String(reservation.depositAmount || 0));

      if (forfeitAmount > currentDepositAmount) {
        res.status(400).json({
          success: false,
          error: 'Forfeit amount cannot exceed deposit amount',
        });
        return;
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: {
          depositStatus: 'FORFEITED',
          depositForfeitAmt: forfeitAmount,
          depositForfeitReason: reason,
        },
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Create deposit event
      await prisma.depositEvent.create({
        data: {
          reservationId: id,
          type: 'forfeit',
          status: 'FORFEITED',
          amount: forfeitAmount,
          reason,
          evidenceUrls,
          actedById: req.user?.id,
        },
      });

      res.json({
        success: true,
        data: updatedReservation,
        message: 'Deposit forfeited successfully',
      });
    } catch (error) {
      console.error('Forfeit deposit error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async failDeposit(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const { reason } = req.body as any;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
        return;
      }

      if (reservation.depositStatus !== 'PENDING') {
        res.status(400).json({
          success: false,
          error: 'Only pending deposits can be marked as failed',
        });
        return;
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: {
          depositStatus: 'FAILED',
        },
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Create deposit event
      await prisma.depositEvent.create({
        data: {
          reservationId: id,
          type: 'fail',
          status: 'FAILED',
          amount: 0,
          reason,
          actedById: req.user?.id,
        },
      });

      res.json({
        success: true,
        data: updatedReservation,
        message: 'Deposit marked as failed',
      });
    } catch (error) {
      console.error('Fail deposit error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
