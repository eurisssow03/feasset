// Homestay Management Service - Direct database integration
// This service handles all data operations for the homestay management system

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'FINANCE' | 'CLEANER' | 'AGENT';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  name: string;
  code: string;
  address: string;
  active: boolean;
  calendarId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  guestId: string;
  unitId: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  cleaningFee: number;
  depositAmount: number;
  depositRefundAmt: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELED';
  notes?: string;
  guest: Guest;
  unit: Unit;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningTask {
  id: string;
  reservationId: string;
  assignedToId: string;
  scheduledDate: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'FAILED';
  notes?: string;
  completedAt?: string;
  reservation: Reservation;
  assignedTo: User;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  totalReservations: number;
  totalRevenue: number;
  totalUnits: number;
  totalGuests: number;
  recentReservations: Reservation[];
}

class HomestayService {
  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // In a real implementation, this would call the server's authentication
    // For now, we'll simulate the login process
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return await response.json();
  }

  async register(userData: Partial<User> & { password: string }): Promise<{ user: User; token: string }> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    return await response.json();
  }

  // Dashboard
  async getDashboardData(): Promise<DashboardData> {
    const response = await fetch('/api/dashboard');
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    return await response.json();
  }

  // Units
  async getUnits(): Promise<Unit[]> {
    const response = await fetch('/api/units');
    if (!response.ok) {
      throw new Error('Failed to fetch units');
    }
    return await response.json();
  }

  async createUnit(unitData: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Unit> {
    const response = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unitData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create unit');
    }
    
    return await response.json();
  }

  async updateUnit(id: string, unitData: Partial<Unit>): Promise<Unit> {
    const response = await fetch(`/api/units/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unitData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update unit');
    }
    
    return await response.json();
  }

  // Guests
  async getGuests(): Promise<Guest[]> {
    const response = await fetch('/api/guests');
    if (!response.ok) {
      throw new Error('Failed to fetch guests');
    }
    return await response.json();
  }

  async createGuest(guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest> {
    const response = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create guest');
    }
    
    return await response.json();
  }

  async updateGuest(id: string, guestData: Partial<Guest>): Promise<Guest> {
    const response = await fetch(`/api/guests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update guest');
    }
    
    return await response.json();
  }

  // Reservations
  async getReservations(): Promise<Reservation[]> {
    const response = await fetch('/api/reservations');
    if (!response.ok) {
      throw new Error('Failed to fetch reservations');
    }
    return await response.json();
  }

  async createReservation(reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'guest' | 'unit'>): Promise<Reservation> {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create reservation');
    }
    
    return await response.json();
  }

  async updateReservation(id: string, reservationData: Partial<Reservation>): Promise<Reservation> {
    const response = await fetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update reservation');
    }
    
    return await response.json();
  }

  async checkInReservation(id: string): Promise<Reservation> {
    const response = await fetch(`/api/reservations/${id}/checkin`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to check in reservation');
    }
    
    return await response.json();
  }

  async checkOutReservation(id: string): Promise<Reservation> {
    const response = await fetch(`/api/reservations/${id}/checkout`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to check out reservation');
    }
    
    return await response.json();
  }

  // Cleaning Tasks
  async getCleaningTasks(): Promise<CleaningTask[]> {
    const response = await fetch('/api/cleanings');
    if (!response.ok) {
      throw new Error('Failed to fetch cleaning tasks');
    }
    return await response.json();
  }

  async createCleaningTask(taskData: Omit<CleaningTask, 'id' | 'createdAt' | 'updatedAt' | 'reservation' | 'assignedTo'>): Promise<CleaningTask> {
    const response = await fetch('/api/cleanings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create cleaning task');
    }
    
    return await response.json();
  }

  async updateCleaningTask(id: string, taskData: Partial<CleaningTask>): Promise<CleaningTask> {
    const response = await fetch(`/api/cleanings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update cleaning task');
    }
    
    return await response.json();
  }

  // Google Calendar Integration
  async syncToCalendar(reservationId: string): Promise<void> {
    const response = await fetch(`/api/calendar/sync/${reservationId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync to calendar');
    }
  }

  async getCalendarStatus(): Promise<{ connected: boolean; calendarId?: string }> {
    const response = await fetch('/api/calendar/status');
    if (!response.ok) {
      throw new Error('Failed to get calendar status');
    }
    return await response.json();
  }
}

export const homestayService = new HomestayService();
export default homestayService;
