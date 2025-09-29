import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GuestController {
  async getAllGuests(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search = ''
      } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [guests, total] = await Promise.all([
        prisma.guest.findMany({
          where,
          skip,
          take,
          include: {
            _count: {
              select: {
                reservations: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.guest.count({ where }),
      ]);

      res.json({
        success: true,
        data: guests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get all guests error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async createGuest(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, phone, email, notes } = req.body as any;

      const guest = await prisma.guest.create({
        data: {
          fullName,
          phone,
          email,
          notes,
        },
        include: {
          _count: {
            select: {
              reservations: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: guest,
      });
    } catch (error) {
      console.error('Create guest error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getGuestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;

      const guest = await prisma.guest.findUnique({
        where: { id },
        include: {
          reservations: {
            include: {
              unit: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              reservations: true,
            },
          },
        },
      });

      if (!guest) {
        res.status(404).json({
          success: false,
          error: 'Guest not found',
        });
        return;
      }

      res.json({
        success: true,
        data: guest,
      });
    } catch (error) {
      console.error('Get guest by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async updateGuest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const updateData = req.body as any;

      // Check if guest exists
      const existingGuest = await prisma.guest.findUnique({
        where: { id },
      });

      if (!existingGuest) {
        res.status(404).json({
          success: false,
          error: 'Guest not found',
        });
        return;
      }

      const guest = await prisma.guest.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              reservations: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: guest,
      });
    } catch (error) {
      console.error('Update guest error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async deleteGuest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;

      // Check if guest exists
      const existingGuest = await prisma.guest.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              reservations: true,
            },
          },
        },
      });

      if (!existingGuest) {
        res.status(404).json({
          success: false,
          error: 'Guest not found',
        });
        return;
      }

      // Check if guest has reservations
      if (existingGuest._count.reservations > 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete guest with existing reservations',
        });
        return;
      }

      await prisma.guest.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Guest deleted successfully',
      });
    } catch (error) {
      console.error('Delete guest error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
