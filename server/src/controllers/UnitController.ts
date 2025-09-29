import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UnitController {
  async getAllUnits(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        active
      } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { code: { contains: search as string, mode: 'insensitive' } },
          { address: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (active !== undefined) {
        where.active = active === 'true';
      }

      const [units, total] = await Promise.all([
        prisma.unit.findMany({
          where,
          skip,
          take,
          include: {
            _count: {
              select: {
                reservations: true,
                cleaningTasks: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.unit.count({ where }),
      ]);

      res.json({
        success: true,
        data: units,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get all units error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async createUnit(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, address, active = true } = req.body as any;

      // Check if unit code already exists
      const existingUnit = await prisma.unit.findUnique({
        where: { code },
      });

      if (existingUnit) {
        res.status(400).json({
          success: false,
          error: 'Unit code already exists',
        });
        return;
      }

      const unit = await prisma.unit.create({
        data: {
          name,
          code,
          active,
        },
        include: {
          _count: {
            select: {
              reservations: true,
              cleaningTasks: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: unit,
      });
    } catch (error) {
      console.error('Create unit error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getUnitById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;

      const unit = await prisma.unit.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              reservations: true,
              cleaningTasks: true,
            },
          },
        },
      });

      if (!unit) {
        res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
        return;
      }

      res.json({
        success: true,
        data: unit,
      });
    } catch (error) {
      console.error('Get unit by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async updateUnit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const updateData = req.body as any;

      // Check if unit exists
      const existingUnit = await prisma.unit.findUnique({
        where: { id },
      });

      if (!existingUnit) {
        res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
        return;
      }

      // Check if code is being changed and if it's already taken
      if (updateData.code && updateData.code !== existingUnit.code) {
        const codeExists = await prisma.unit.findUnique({
          where: { code: updateData.code },
        });

        if (codeExists) {
          res.status(400).json({
            success: false,
            error: 'Unit code already taken',
          });
          return;
        }
      }

      const unit = await prisma.unit.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              reservations: true,
              cleaningTasks: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: unit,
      });
    } catch (error) {
      console.error('Update unit error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async deleteUnit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;

      // Check if unit exists
      const existingUnit = await prisma.unit.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              reservations: true,
            },
          },
        },
      });

      if (!existingUnit) {
        res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
        return;
      }

      // Check if unit has active reservations
      if (existingUnit._count.reservations > 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete unit with active reservations',
        });
        return;
      }

      // Soft delete by setting active to false
      await prisma.unit.update({
        where: { id },
        data: { active: false },
      });

      res.json({
        success: true,
        message: 'Unit deleted successfully',
      });
    } catch (error) {
      console.error('Delete unit error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async syncCalendar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const { calendarId } = req.body as any;

      // Check if unit exists
      const existingUnit = await prisma.unit.findUnique({
        where: { id },
      });

      if (!existingUnit) {
        res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
        return;
      }

      const unit = await prisma.unit.update({
        where: { id },
        data: { calendarId },
        include: {
          _count: {
            select: {
              reservations: true,
              cleaningTasks: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: unit,
        message: 'Calendar sync configured successfully',
      });
    } catch (error) {
      console.error('Sync calendar error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
