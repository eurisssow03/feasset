import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReservationStatus, AuthRequest } from '../types/index';

const prisma = new PrismaClient();

export class ReservationController {
  async getAllReservations(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status,
        unitId,
        guestId,
        checkInFrom,
        checkInTo,
        checkOutFrom,
        checkOutTo
      } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { guest: { fullName: { contains: search as string, mode: 'insensitive' } } },
          { guest: { email: { contains: search as string, mode: 'insensitive' } } },
          { unit: { name: { contains: search as string, mode: 'insensitive' } } },
          { unit: { code: { contains: search as string, mode: 'insensitive' } } },
        ];
      }

      if (status) {
        where.status = status as ReservationStatus;
      }

      if (unitId) {
        where.unitId = unitId as string;
      }

      if (guestId) {
        where.guestId = guestId as string;
      }

      if (checkInFrom) {
        where.checkIn = { gte: new Date(checkInFrom as string) };
      }

      if (checkInTo) {
        where.checkIn = { ...where.checkIn, lte: new Date(checkInTo as string) };
      }

      if (checkOutFrom) {
        where.checkOut = { gte: new Date(checkOutFrom as string) };
      }

      if (checkOutTo) {
        where.checkOut = { ...where.checkOut, lte: new Date(checkOutTo as string) };
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
                phone: true,
              },
            },
            unit: {
              select: {
                id: true,
                name: true,
                code: true,
                location: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            cleaningTasks: {
              select: {
                id: true,
                status: true,
                scheduledDate: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.reservation.count({ where }),
      ]);

      res.json({
        success: true,
        data: reservations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get all reservations error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async createReservation(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const {
        unitId,
        guestId,
        checkIn,
        checkOut,
        nightlyRate,
        cleaningFee,
        totalAmount,
        depositRequired = false,
        depositAmount,
        headCount = 1,
        specialRequests
      } = req.body as any;

      // Validate dates
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (checkInDate >= checkOutDate) {
        res.status(400).json({
          success: false,
          error: 'Check-out date must be after check-in date',
        });
        return;
      }

      // Check for overlapping reservations
      const overlappingReservation = await prisma.reservation.findFirst({
        where: {
          unitId,
          status: {
            in: ['CONFIRMED', 'CHECKED_IN'],
          },
          OR: [
            {
              AND: [
                { checkIn: { lte: checkInDate } },
                { checkOut: { gt: checkInDate } },
              ],
            },
            {
              AND: [
                { checkIn: { lt: checkOutDate } },
                { checkOut: { gte: checkOutDate } },
              ],
            },
            {
              AND: [
                { checkIn: { gte: checkInDate } },
                { checkOut: { lte: checkOutDate } },
              ],
            },
          ],
        },
      });

      if (overlappingReservation) {
        res.status(400).json({
          success: false,
          error: 'Unit is not available for the selected dates',
        });
        return;
      }

      // Verify unit and guest exist
      const [unit, guest] = await Promise.all([
        prisma.unit.findUnique({ where: { id: unitId } }),
        prisma.guest.findUnique({ where: { id: guestId } }),
      ]);

      if (!unit) {
        res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
        return;
      }

      if (!guest) {
        res.status(404).json({
          success: false,
          error: 'Guest not found',
        });
        return;
      }

      const reservation = await prisma.reservation.create({
        data: {
          unitId,
          guestId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nightlyRate,
          cleaningFee,
          totalAmount,
          depositRequired,
          depositAmount,
          headCount,
          specialRequests,
          status: 'DRAFT',
        },
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      console.error('Create reservation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getReservationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: {
          guest: true,
          unit: true,
          cleaningTasks: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              photos: true,
            },
          },
          depositEvents: {
            orderBy: { createdAt: 'desc' },
            include: {
              actedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!reservation) {
        res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
        return;
      }

      res.json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      console.error('Get reservation by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async updateReservation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const updateData = req.body as any;

      // Check if reservation exists
      const existingReservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!existingReservation) {
        res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
      }

      // If dates are being updated, check for overlaps
      if (updateData.checkIn || updateData.checkOut) {
        const checkInDate = updateData.checkIn ? new Date(updateData.checkIn) : existingReservation!.checkIn;
        const checkOutDate = updateData.checkOut ? new Date(updateData.checkOut) : existingReservation!.checkOut;

        if (checkInDate >= checkOutDate) {
          res.status(400).json({
            success: false,
            error: 'Check-out date must be after check-in date',
          });
          return;
        }

        const overlappingReservation = await prisma.reservation.findFirst({
          where: {
            unitId: updateData.unitId || existingReservation!.unitId,
            status: {
              in: ['CONFIRMED', 'CHECKED_IN'],
            },
            id: { not: id },
            OR: [
              {
                AND: [
                  { checkIn: { lte: checkInDate } },
                  { checkOut: { gt: checkInDate } },
                ],
              },
              {
                AND: [
                  { checkIn: { lt: checkOutDate } },
                  { checkOut: { gte: checkOutDate } },
                ],
              },
              {
                AND: [
                  { checkIn: { gte: checkInDate } },
                  { checkOut: { lte: checkOutDate } },
                ],
              },
            ],
          },
        });

        if (overlappingReservation) {
          res.status(400).json({
            success: false,
            error: 'Unit is not available for the selected dates',
          });
        }
      }

      const reservation = await prisma.reservation.update({
        where: { id },
        data: updateData,
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      console.error('Update reservation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async deleteReservation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;

      // Check if reservation exists
      const existingReservation = await prisma.reservation.findUnique({
        where: { id },
      });

      if (!existingReservation) {
        res.status(404).json({
          success: false,
          error: 'Reservation not found',
        });
      }

      // Only allow deletion of DRAFT or CANCELED reservations
      if (!['DRAFT', 'CANCELED'].includes(existingReservation!.status)) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete confirmed or active reservations',
        });
        return;
      }

      await prisma.reservation.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Reservation deleted successfully',
      });
    } catch (error) {
      console.error('Delete reservation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async checkIn(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;

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

      if (reservation.status !== 'CONFIRMED') {
        res.status(400).json({
          success: false,
          error: 'Only confirmed reservations can be checked in',
        });
        return;
      }

      // Check deposit requirement
      if (reservation.depositRequired && !['HELD', 'PAID'].includes(reservation.depositStatus)) {
        const allowPendingDeposit = process.env.ALLOW_CHECKIN_WITH_PENDING_DEPOSIT === 'true';
        const isAdmin = req.user?.role === 'ADMIN';

        if (!allowPendingDeposit && !isAdmin) {
          res.status(400).json({
            success: false,
            error: 'Deposit must be held or paid before check-in',
          });
          return;
        }
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: { status: 'CHECKED_IN' },
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedReservation,
        message: 'Check-in successful',
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async checkOut(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;

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

      if (reservation.status !== 'CHECKED_IN') {
        res.status(400).json({
          success: false,
          error: 'Only checked-in reservations can be checked out',
        });
        return;
      }

      // Update reservation status
      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: { status: 'CHECKED_OUT' },
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
            },
          },
        },
      });

      // Auto-create cleaning task
      await prisma.cleaningTask.create({
        data: {
          reservationId: id,
          unitId: reservation.unitId,
          status: 'PENDING',
          scheduledDate: new Date(), // Schedule for today
        },
      });

      res.json({
        success: true,
        data: updatedReservation,
        message: 'Check-out successful. Cleaning task created.',
      });
    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async extend(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const { newCheckOut, reason } = req.body as any;

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

      if (!['CONFIRMED', 'CHECKED_IN'].includes(reservation.status)) {
        res.status(400).json({
          success: false,
          error: 'Only confirmed or checked-in reservations can be extended',
        });
        return;
      }

      const newCheckOutDate = new Date(newCheckOut);

      if (newCheckOutDate <= reservation.checkOut) {
        res.status(400).json({
          success: false,
          error: 'New check-out date must be after current check-out date',
        });
        return;
      }

      // Check for overlapping reservations
      const overlappingReservation = await prisma.reservation.findFirst({
        where: {
          unitId: reservation.unitId,
          status: {
            in: ['CONFIRMED', 'CHECKED_IN'],
          },
          id: { not: id },
          OR: [
            {
              AND: [
                { checkIn: { lte: reservation.checkOut } },
                { checkOut: { gt: reservation.checkOut } },
              ],
            },
            {
              AND: [
                { checkIn: { lt: newCheckOutDate } },
                { checkOut: { gte: newCheckOutDate } },
              ],
            },
            {
              AND: [
                { checkIn: { gte: reservation.checkOut } },
                { checkOut: { lte: newCheckOutDate } },
              ],
            },
          ],
        },
      });

      if (overlappingReservation) {
        res.status(400).json({
          success: false,
          error: 'Unit is not available for the extended dates',
        });
        return;
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: { 
          checkOut: newCheckOutDate,
          specialRequests: reason ? `${reservation.specialRequests || ''}\nExtension reason: ${reason}`.trim() : reservation.specialRequests,
        },
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedReservation,
        message: 'Reservation extended successfully',
      });
    } catch (error) {
      console.error('Extend reservation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
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

      if (reservation.status === 'CANCELED') {
        res.status(400).json({
          success: false,
          error: 'Reservation is already canceled',
        });
        return;
      }

      if (reservation.status === 'CHECKED_OUT') {
        res.status(400).json({
          success: false,
          error: 'Cannot cancel completed reservations',
        });
        return;
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: { 
          status: 'CANCELED',
          specialRequests: reason ? `${reservation.specialRequests || ''}\nCancellation reason: ${reason}`.trim() : reservation.specialRequests,
        },
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedReservation,
        message: 'Reservation canceled successfully',
      });
    } catch (error) {
      console.error('Cancel reservation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
