import { Request, Response } from 'express';
import { PrismaClient, DepositStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class DepositController {
  async getDepositsLedger(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        method,
        fromDate,
        toDate
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

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
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
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

  async exportDepositsLedger(req: Request, res: Response) {
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
      
      const csvRows = reservations.map(reservation => {
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

  async requestDeposit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
      }

      if (reservation.depositRequired) {
        return res.status(400).json({
          success: false,
          error: 'Deposit is already required for this reservation',
        });
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

  async collectDeposit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { method, txnId, evidenceUrls = [] } = req.body;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
      }

      if (!reservation.depositRequired) {
        return res.status(400).json({
          success: false,
          error: 'No deposit required for this reservation',
        });
      }

      if (reservation.depositStatus === 'PAID') {
        return res.status(400).json({
          success: false,
          error: 'Deposit already collected',
        });
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

  async refundDeposit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { amount, reason, method, txnId, evidenceUrls = [] } = req.body;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
      }

      if (!['HELD', 'PAID'].includes(reservation.depositStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Deposit must be held or paid to refund',
        });
      }

      const refundAmount = Number(amount);
      const currentDepositAmount = Number(reservation.depositAmount || 0);
      const currentRefundAmount = Number(reservation.depositRefundAmt || 0);

      if (refundAmount > (currentDepositAmount - currentRefundAmount)) {
        return res.status(400).json({
          success: false,
          error: 'Refund amount cannot exceed remaining deposit amount',
        });
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

  async forfeitDeposit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { amount, reason, evidenceUrls = [] } = req.body;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
      }

      if (!['HELD', 'PAID'].includes(reservation.depositStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Deposit must be held or paid to forfeit',
        });
      }

      const forfeitAmount = Number(amount);
      const currentDepositAmount = Number(reservation.depositAmount || 0);

      if (forfeitAmount > currentDepositAmount) {
        return res.status(400).json({
          success: false,
          error: 'Forfeit amount cannot exceed deposit amount',
        });
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

  async failDeposit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
      }

      if (reservation.depositStatus !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Only pending deposits can be marked as failed',
        });
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
