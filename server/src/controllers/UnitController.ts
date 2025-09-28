import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UnitController {
  async getAllUnits(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        active
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

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
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
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

  async createUnit(req: Request, res: Response) {
    try {
      const { name, code, address, active = true } = req.body;

      // Check if unit code already exists
      const existingUnit = await prisma.unit.findUnique({
        where: { code },
      });

      if (existingUnit) {
        return res.status(400).json({
          success: false,
          error: 'Unit code already exists',
        });
      }

      const unit = await prisma.unit.create({
        data: {
          name,
          code,
          address,
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

  async getUnitById(req: Request, res: Response) {
    try {
      const { id } = req.params;

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
        return res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
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

  async updateUnit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if unit exists
      const existingUnit = await prisma.unit.findUnique({
        where: { id },
      });

      if (!existingUnit) {
        return res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
      }

      // Check if code is being changed and if it's already taken
      if (updateData.code && updateData.code !== existingUnit.code) {
        const codeExists = await prisma.unit.findUnique({
          where: { code: updateData.code },
        });

        if (codeExists) {
          return res.status(400).json({
            success: false,
            error: 'Unit code already taken',
          });
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

  async deleteUnit(req: Request, res: Response) {
    try {
      const { id } = req.params;

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
        return res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
      }

      // Check if unit has active reservations
      if (existingUnit._count.reservations > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete unit with active reservations',
        });
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

  async syncCalendar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { calendarId } = req.body;

      // Check if unit exists
      const existingUnit = await prisma.unit.findUnique({
        where: { id },
      });

      if (!existingUnit) {
        return res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
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
