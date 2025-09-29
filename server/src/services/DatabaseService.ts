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
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUnit(id: string, unitData: any) {
    return await this.prisma.unit.update({
      where: { id },
      data: unitData,
    });
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
  async getDashboardData() {
    const [
      totalReservations,
      totalRevenue,
      totalUnits,
      totalGuests,
      recentReservations,
    ] = await Promise.all([
      this.prisma.reservation.count(),
      this.prisma.reservation.aggregate({
        _sum: { totalAmount: true },
      }),
      this.prisma.unit.count(),
      this.prisma.guest.count(),
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
      recentReservations,
    };
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
