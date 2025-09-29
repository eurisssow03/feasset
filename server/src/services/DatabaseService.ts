import { PrismaClient } from '@prisma/client';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // User Management
  async createUser(userData: any) {
    return await this.prisma.user.create({
      data: userData,
    });
  }

  async getUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getAllUsers() {
    return await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Unit Management
  async createUnit(unitData: any) {
    return await this.prisma.unit.create({
      data: unitData,
    });
  }

  async getAllUnits() {
    return await this.prisma.unit.findMany({
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUnit(id: string, unitData: any) {
    return await this.prisma.unit.update({
      where: { id },
      data: unitData,
    });
  }

  // Location Management
  async createLocation(locationData: any) {
    try {
      return await this.prisma.location.create({
        data: locationData,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Location name already exists. Please choose a different name.');
      }
      throw error;
    }
  }

  async getAllLocations() {
    return await this.prisma.location.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLocation(id: string, locationData: any) {
    try {
      return await this.prisma.location.update({
        where: { id },
        data: locationData,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Location name already exists. Please choose a different name.');
      }
      throw error;
    }
  }

  // Guest Management
  async createGuest(guestData: any) {
    return await this.prisma.guest.create({
      data: guestData,
    });
  }

  async getAllGuests() {
    return await this.prisma.guest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateGuest(id: string, guestData: any) {
    return await this.prisma.guest.update({
      where: { id },
      data: guestData,
    });
  }

  // Reservation Management
  async createReservation(reservationData: any) {
    return await this.prisma.reservation.create({
      data: reservationData,
      include: {
        guest: true,
        unit: true,
      },
    });
  }

  async getAllReservations() {
    return await this.prisma.reservation.findMany({
      include: {
        guest: true,
        unit: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReservation(id: string, reservationData: any) {
    return await this.prisma.reservation.update({
      where: { id },
      data: reservationData,
      include: {
        guest: true,
        unit: true,
      },
    });
  }

  // Cleaning Management
  async createCleaningTask(cleaningData: any) {
    return await this.prisma.cleaningTask.create({
      data: cleaningData,
      include: {
        reservation: {
          include: {
            guest: true,
            unit: true,
          },
        },
        assignedTo: true,
      },
    });
  }

  async getAllCleaningTasks() {
    return await this.prisma.cleaningTask.findMany({
      include: {
        reservation: {
          include: {
            guest: true,
            unit: true,
          },
        },
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Dashboard Data
  async getDashboardData(period: string = 'today') {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    // Calculate date range based on period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'tomorrow':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
        break;
      case 'thisWeek':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        endDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7);
        break;
      case 'nextWeek':
        const nextWeekStart = new Date(now);
        nextWeekStart.setDate(now.getDate() - now.getDay() + 7);
        startDate = new Date(nextWeekStart.getFullYear(), nextWeekStart.getMonth(), nextWeekStart.getDate());
        endDate = new Date(nextWeekStart.getFullYear(), nextWeekStart.getMonth(), nextWeekStart.getDate() + 7);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'nextMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        break;
      case 'next2Months':
        startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 3, 1);
        break;
      case 'next3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 4, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    const [
      totalReservations,
      totalRevenue,
      totalUnits,
      totalGuests,
      availableUnits,
      checkedInToday,
      checkedOutToday,
      recentReservations,
    ] = await Promise.all([
      // Total reservations in period
      this.prisma.reservation.count({
        where: {
          OR: [
            {
              checkIn: {
                gte: startDate,
                lt: endDate,
              },
            },
            {
              checkOut: {
                gte: startDate,
                lt: endDate,
              },
            },
            {
              AND: [
                { checkIn: { lte: startDate } },
                { checkOut: { gte: endDate } },
              ],
            },
          ],
        },
      }),
      // Total revenue in period
      this.prisma.reservation.aggregate({
        where: {
          OR: [
            {
              checkIn: {
                gte: startDate,
                lt: endDate,
              },
            },
            {
              checkOut: {
                gte: startDate,
                lt: endDate,
              },
            },
            {
              AND: [
                { checkIn: { lte: startDate } },
                { checkOut: { gte: endDate } },
              ],
            },
          ],
        },
        _sum: { totalAmount: true },
      }),
      // Total units
      this.prisma.unit.count({
        where: { active: true },
      }),
      // Total guests
      this.prisma.guest.count(),
      // Available units (not occupied during the period)
      this.getAvailableUnitsCount(startDate, endDate),
      // Check-ins today
      this.prisma.reservation.count({
        where: {
          checkIn: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        },
      }),
      // Check-outs today
      this.prisma.reservation.count({
        where: {
          checkOut: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        },
      }),
      // Recent reservations
      this.prisma.reservation.findMany({
        take: 5,
        include: {
          guest: true,
          unit: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      totalReservations,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalUnits,
      totalGuests,
      availableUnits,
      checkedInToday,
      checkedOutToday,
      recentReservations,
    };
  }

  // Helper method to calculate available units
  private async getAvailableUnitsCount(startDate: Date, endDate: Date): Promise<number> {
    const totalUnits = await this.prisma.unit.count({
      where: { active: true },
    });

    const occupiedUnits = await this.prisma.reservation.count({
      where: {
        status: {
          in: ['CONFIRMED', 'CHECKED_IN'],
        },
        OR: [
          {
            checkIn: {
              gte: startDate,
              lt: endDate,
            },
          },
          {
            checkOut: {
              gte: startDate,
              lt: endDate,
            },
          },
          {
            AND: [
              { checkIn: { lte: startDate } },
              { checkOut: { gte: endDate } },
            ],
          },
        ],
      },
    });

    return Math.max(0, totalUnits - occupiedUnits);
  }

  // Google Calendar Integration
  async syncReservationToCalendar(reservationId: string) {
    // This would integrate with Google Calendar API
    // For now, we'll just return the reservation data
    return await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        unit: true,
      },
    });
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export const dbService = new DatabaseService();
