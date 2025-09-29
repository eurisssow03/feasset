import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CleaningStatus, AuthRequest } from '../types/index';

const prisma = new PrismaClient();

export class CleaningController {
  async getAllCleanings(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        assignedToUserId,
        unitId,
        scheduledFrom,
        scheduledTo
      } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where: any = {};

      if (status) {
        where.status = status as CleaningStatus;
      }

      if (assignedToUserId) {
        where.assignedToUserId = assignedToUserId as string;
      }

      if (unitId) {
        where.unitId = unitId as string;
      }

      if (scheduledFrom || scheduledTo) {
        where.scheduledDate = {};
        if (scheduledFrom) {
          where.scheduledDate.gte = new Date(scheduledFrom as string);
        }
        if (scheduledTo) {
          where.scheduledDate.lte = new Date(scheduledTo as string);
        }
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
                location: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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
          orderBy: { scheduledDate: 'asc' },
        }),
        prisma.cleaningTask.count({ where }),
      ]);

      res.json({
        success: true,
        data: cleanings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get all cleanings error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getMyTasks(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        status
      } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where: any = {
        assignedToUserId: req.user?.id,
      };

      if (status) {
        where.status = status as CleaningStatus;
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
                location: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            photos: true,
          },
          orderBy: { scheduledDate: 'asc' },
        }),
        prisma.cleaningTask.count({ where }),
      ]);

      res.json({
        success: true,
        data: cleanings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get my tasks error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getCleaningById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;

      const cleaning = await prisma.cleaningTask.findUnique({
        where: { id },
        include: {
          reservation: {
            include: {
              guest: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
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
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          photos: true,
        },
      });

      if (!cleaning) {
        res.status(404).json({
          success: false,
          error: 'Cleaning task not found',
        });
        return;
      }

      res.json({
        success: true,
        data: cleaning,
      });
    } catch (error) {
      console.error('Get cleaning by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async assignCleaning(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const { assignedToUserId, scheduledDate, notes } = req.body as any;

      const cleaning = await prisma.cleaningTask.findUnique({
        where: { id },
      });

      if (!cleaning) {
        res.status(404).json({
          success: false,
          error: 'Cleaning task not found',
        });
        return;
      }

      // Verify assigned user exists and is a cleaner
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToUserId },
        select: { id: true, role: true, isActive: true },
      });

      if (!assignedUser || !assignedUser.isActive) {
        res.status(404).json({
          success: false,
          error: 'Assigned user not found or inactive',
        });
        return;
      }

      if (assignedUser.role !== 'CLEANER') {
        res.status(400).json({
          success: false,
          error: 'Assigned user must be a cleaner',
        });
        return;
      }

      const updatedCleaning = await prisma.cleaningTask.update({
        where: { id },
        data: {
          assignedToUserId,
          scheduledDate: new Date(scheduledDate),
          status: 'ASSIGNED',
          notes,
        },
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
              address: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedCleaning,
        message: 'Cleaning task assigned successfully',
      });
    } catch (error) {
      console.error('Assign cleaning error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async startCleaning(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;

      const cleaning = await prisma.cleaningTask.findUnique({
        where: { id },
      });

      if (!cleaning) {
        res.status(404).json({
          success: false,
          error: 'Cleaning task not found',
        });
        return;
      }

      if (cleaning.assignedToUserId !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'You can only start tasks assigned to you',
        });
        return;
      }

      if (cleaning.status !== 'ASSIGNED') {
        res.status(400).json({
          success: false,
          error: 'Only assigned tasks can be started',
        });
        return;
      }

      const updatedCleaning = await prisma.cleaningTask.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
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
              address: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedCleaning,
        message: 'Cleaning task started',
      });
    } catch (error) {
      console.error('Start cleaning error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async completeCleaning(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const { notes, photoUrls = [] } = req.body as any;

      const cleaning = await prisma.cleaningTask.findUnique({
        where: { id },
      });

      if (!cleaning) {
        res.status(404).json({
          success: false,
          error: 'Cleaning task not found',
        });
        return;
      }

      if (cleaning.assignedToUserId !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'You can only complete tasks assigned to you',
        });
        return;
      }

      if (cleaning.status !== 'IN_PROGRESS') {
        res.status(400).json({
          success: false,
          error: 'Only in-progress tasks can be completed',
        });
        return;
      }

      // Create photos if provided
      if (photoUrls.length > 0) {
        await prisma.cleaningPhoto.createMany({
          data: photoUrls.map((url: string) => ({
            cleaningTaskId: id,
            url,
          })),
        });
      }

      const updatedCleaning = await prisma.cleaningTask.update({
        where: { id },
        data: {
          status: 'DONE',
          completedAt: new Date(),
          notes,
        },
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
              address: true,
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
      });

      res.json({
        success: true,
        data: updatedCleaning,
        message: 'Cleaning task completed successfully',
      });
    } catch (error) {
      console.error('Complete cleaning error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async updateCleaning(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as any;
      const updateData = req.body as any;

      const cleaning = await prisma.cleaningTask.findUnique({
        where: { id },
      });

      if (!cleaning) {
        res.status(404).json({
          success: false,
          error: 'Cleaning task not found',
        });
        return;
      }

      const updatedCleaning = await prisma.cleaningTask.update({
        where: { id },
        data: {
          ...updateData,
          ...(updateData.scheduledDate && { scheduledDate: new Date(updateData.scheduledDate) }),
        },
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
              address: true,
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
      });

      res.json({
        success: true,
        data: updatedCleaning,
        message: 'Cleaning task updated successfully',
      });
    } catch (error) {
      console.error('Update cleaning error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
