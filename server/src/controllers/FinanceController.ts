import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CleaningStatus } from '../types';

const prisma = new PrismaClient();

export class FinanceController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Get today's arrivals and departures
      const [arrivals, departures] = await Promise.all([
        prisma.reservation.count({
          where: {
            checkIn: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
            },
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          },
        }),
        prisma.reservation.count({
          where: {
            checkOut: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
            },
            status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
          },
        }),
      ]);

      // Get occupancy rate
      const totalUnits = await prisma.unit.count({
        where: { active: true },
      });

      const occupiedUnits = await prisma.reservation.count({
        where: {
          status: 'CHECKED_IN',
          checkIn: { lte: today },
          checkOut: { gt: today },
        },
      });

      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      // Get overdue cleaning tasks
      const overdueTasks = await prisma.cleaningTask.count({
        where: {
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
          scheduledDate: { lt: today },
        },
      });

      // Get monthly revenue
      const monthlyRevenue = await prisma.reservation.aggregate({
        where: {
          status: 'CHECKED_OUT',
          checkOut: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      // Get deposit summary
      const depositSummary = await prisma.reservation.aggregate({
        where: {
          depositRequired: true,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
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
        data: {
          today: {
            arrivals,
            departures,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            overdueTasks,
          },
          monthly: {
            revenue: monthlyRevenue._sum.totalAmount || 0,
            deposits: {
              total: depositSummary._sum.depositAmount || 0,
              refunded: depositSummary._sum.depositRefundAmt || 0,
              forfeited: depositSummary._sum.depositForfeitAmt || 0,
              count: depositSummary._count.depositStatus,
            },
          },
        },
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getCleaningConsolidation(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        fromDate,
        toDate,
        status,
        unitId
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Build where clause
      const where: any = {
        status: 'DONE',
      };

      if (fromDate || toDate) {
        where.completedAt = {};
        if (fromDate) {
          where.completedAt.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.completedAt.lte = new Date(toDate as string);
        }
      }

      if (unitId) {
        where.unitId = unitId as string;
      }

      const [cleanings, total] = await Promise.all([
        prisma.cleaningTask.findMany({
          where,
          skip,
          take,
          include: {
            reservation: {
              include: {
                guest: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
            unit: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            photos: true,
          },
          orderBy: { completedAt: 'desc' },
        }),
        prisma.cleaningTask.count({ where }),
      ]);

      // Calculate summary
      const summary = await prisma.cleaningTask.aggregate({
        where,
        _count: {
          id: true,
        },
      });

      res.json({
        success: true,
        data: cleanings,
        summary: {
          totalTasks: summary._count.id,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get cleaning consolidation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async exportCleaningConsolidation(req: Request, res: Response): Promise<void> {
    try {
      const { fromDate, toDate, unitId } = req.query;

      // Build where clause
      const where: any = {
        status: 'DONE',
      };

      if (fromDate || toDate) {
        where.completedAt = {};
        if (fromDate) {
          where.completedAt.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.completedAt.lte = new Date(toDate as string);
        }
      }

      if (unitId) {
        where.unitId = unitId as string;
      }

      const cleanings = await prisma.cleaningTask.findMany({
        where,
        include: {
          reservation: {
            include: {
              guest: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          unit: {
            select: {
              name: true,
              code: true,
            },
          },
          assignedTo: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      });

      // Generate CSV
      const csvHeader = 'Task ID,Unit,Guest,Cleaner,Scheduled Date,Started At,Completed At,Notes,Photos Count\n';
      
      const csvRows = cleanings.map((cleaning: any) => {
        return [
          cleaning.id,
          `${cleaning.unit.name} (${cleaning.unit.code})`,
          cleaning.reservation.guest.fullName,
          cleaning.assignedTo?.name || 'Unassigned',
          cleaning.scheduledDate.toISOString().split('T')[0],
          cleaning.startedAt?.toISOString().split('T')[0] || '',
          cleaning.completedAt?.toISOString().split('T')[0] || '',
          cleaning.notes || '',
          cleaning.photos.length,
        ].join(',');
      }).join('\n');

      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cleaning-consolidation.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Export cleaning consolidation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async approveCleaningConsolidation(req: Request, res: Response): Promise<void> {
    try {
      const { cleaningTaskIds, notes } = req.body;

      if (!Array.isArray(cleaningTaskIds) || cleaningTaskIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Cleaning task IDs are required',
        });
        return;
      }

      // Verify all tasks exist and are completed
      const tasks = await prisma.cleaningTask.findMany({
        where: {
          id: { in: cleaningTaskIds },
          status: 'DONE',
        },
      });

      if (tasks.length !== cleaningTaskIds.length) {
        res.status(400).json({
          success: false,
          error: 'Some cleaning tasks not found or not completed',
        });
        return;
      }

      // Update tasks with approval notes
      await prisma.cleaningTask.updateMany({
        where: {
          id: { in: cleaningTaskIds },
        },
        data: {
          notes: notes ? `${tasks[0]?.notes || ''}\nApproved: ${notes}`.trim() : tasks[0]?.notes,
        },
      });

      res.json({
        success: true,
        message: `${cleaningTaskIds.length} cleaning tasks approved successfully`,
      });
    } catch (error) {
      console.error('Approve cleaning consolidation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getDepositsSummary(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        fromDate,
        toDate,
        status
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Build where clause
      const where: any = {
        depositRequired: true,
      };

      if (status) {
        where.depositStatus = status;
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
      console.error('Get deposits summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async exportDepositsSummary(req: Request, res: Response): Promise<void> {
    try {
      const { fromDate, toDate, status } = req.query;

      // Build where clause
      const where: any = {
        depositRequired: true,
      };

      if (status) {
        where.depositStatus = status;
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
      const csvHeader = 'Reservation ID,Guest,Unit,Deposit Amount,Status,Method,Collected At,Refunded At,Refund Amount,Forfeit Amount\n';
      
      const csvRows = reservations.map((reservation: any) => {
        return [
          reservation.id,
          reservation.guest.fullName,
          `${reservation.unit.name} (${reservation.unit.code})`,
          reservation.depositAmount || 0,
          reservation.depositStatus,
          reservation.depositMethod || '',
          reservation.depositPaidAt?.toISOString().split('T')[0] || '',
          reservation.depositRefundedAt?.toISOString().split('T')[0] || '',
          reservation.depositRefundAmt || 0,
          reservation.depositForfeitAmt || 0,
        ].join(',');
      }).join('\n');

      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="deposits-summary.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Export deposits summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getMonthlyReport(req: Request, res: Response): Promise<void> {
    try {
      const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

      const startOfMonth = new Date(Number(year), Number(month) - 1, 1);
      const endOfMonth = new Date(Number(year), Number(month), 0);

      // Get reservations for the month
      const reservations = await prisma.reservation.findMany({
        where: {
          status: 'CHECKED_OUT',
          checkOut: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: {
          unit: {
            select: {
              name: true,
              code: true,
            },
          },
          guest: {
            select: {
              fullName: true,
            },
          },
        },
      });

      // Calculate revenue by unit
      const revenueByUnit = reservations.reduce((acc: any, reservation: any) => {
        const unitKey = `${reservation.unit.name} (${reservation.unit.code})`;
        if (!acc[unitKey]) {
          acc[unitKey] = {
            unit: unitKey,
            reservations: 0,
            revenue: 0,
            cleaningFees: 0,
          };
        }
        acc[unitKey].reservations += 1;
        acc[unitKey].revenue += Number(reservation.totalAmount || 0);
        acc[unitKey].cleaningFees += Number(reservation.cleaningFee || 0);
        return acc;
      }, {} as any);

      // Calculate totals
      const totalRevenue = reservations.reduce((sum: any, r: any) => sum + Number(r.totalAmount || 0), 0);
      const totalCleaningFees = reservations.reduce((sum: any, r: any) => sum + Number(r.cleaningFee || 0), 0);
      const totalReservations = reservations.length;

      // Get deposit summary
      const depositSummary = await prisma.reservation.aggregate({
        where: {
          depositRequired: true,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
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
        data: {
          period: {
            year: Number(year),
            month: Number(month),
            startDate: startOfMonth.toISOString().split('T')[0],
            endDate: endOfMonth.toISOString().split('T')[0],
          },
          summary: {
            totalReservations,
            totalRevenue,
            totalCleaningFees,
            netRevenue: totalRevenue - totalCleaningFees,
            deposits: {
              total: depositSummary._sum.depositAmount || 0,
              refunded: depositSummary._sum.depositRefundAmt || 0,
              forfeited: depositSummary._sum.depositForfeitAmt || 0,
              net: (depositSummary._sum.depositAmount || 0) - (depositSummary._sum.depositRefundAmt || 0),
            },
          },
          revenueByUnit: Object.values(revenueByUnit),
          reservations: reservations.map((r: any) => ({
            id: r.id,
            unit: `${r.unit.name} (${r.unit.code})`,
            guest: r.guest.fullName,
            checkIn: r.checkIn.toISOString().split('T')[0],
            checkOut: r.checkOut.toISOString().split('T')[0],
            totalAmount: r.totalAmount,
            cleaningFee: r.cleaningFee,
          })),
        },
      });
    } catch (error) {
      console.error('Get monthly report error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
