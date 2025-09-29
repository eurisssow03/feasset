import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, Calendar, Building, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { toast } from 'react-hot-toast';

interface Reservation {
  id: string;
  guest: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  unit: {
    id: string;
    name: string;
    code: string;
  };
  checkIn: string;
  checkOut: string;
  nightlyRate: number;
  totalAmount: number;
  cleaningFee: number;
  depositRequired: boolean;
  depositAmount: number;
  depositStatus: string;
  status: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  CHECKED_OUT: 'bg-purple-100 text-purple-800',
  CANCELED: 'bg-red-100 text-red-800',
};

const statusIcons = {
  DRAFT: Clock,
  CONFIRMED: CheckCircle,
  CHECKED_IN: Calendar,
  CHECKED_OUT: CheckCircle,
  CANCELED: XCircle,
};

export default function ReservationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const queryClient = useQueryClient();

  // Fetch reservations
  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ['reservations'],
    queryFn: async () => {
      const response = await fetch('/api/reservations');
      if (!response.ok) throw new Error('Failed to fetch reservations');
      return response.json();
    },
  });

  // Create reservation mutation
  const createReservationMutation = useMutation({
    mutationFn: async (reservationData: Partial<Reservation>) => {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });
      if (!response.ok) throw new Error('Failed to create reservation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setShowAddForm(false);
      toast.success('Reservation created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create reservation');
    },
  });

  // Update reservation mutation
  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Reservation> }) => {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update reservation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setEditingReservation(null);
      toast.success('Reservation updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update reservation');
    },
  });

  // Filter reservations
  const filteredReservations = reservations.filter((reservation: any) => {
    const matchesSearch = 
      reservation.guest.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.unit.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddReservation = (reservationData: Partial<Reservation>) => {
    createReservationMutation.mutate(reservationData);
  };

  const handleUpdateReservation = (id: string, reservationData: Partial<Reservation>) => {
    updateReservationMutation.mutate({ id, data: reservationData });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reservations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-600">Manage guest reservations and bookings</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Reservation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservations ({filteredReservations.length})</CardTitle>
          <CardDescription>View and manage all reservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search reservations..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className="input w-full pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="CANCELED">Canceled</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
          
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No reservations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation: any) => {
                const StatusIcon = statusIcons[reservation.status as keyof typeof statusIcons] || Clock;
                return (
                  <div key={reservation.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{reservation.guest.fullName}</h3>
                          <p className="text-sm text-gray-600">{reservation.unit.name} ({reservation.unit.code})</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[reservation.status as keyof typeof statusColors]}`}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {reservation.status.replace('_', ' ')}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setEditingReservation(reservation)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <div>
                          <p className="font-medium">Check-in</p>
                          <p>{new Date(reservation.checkIn).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <div>
                          <p className="font-medium">Check-out</p>
                          <p>{new Date(reservation.checkOut).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <div>
                          <p className="font-medium">Total Amount</p>
                          <p>${Number(reservation.totalAmount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="h-4 w-4 mr-2" />
                        <div>
                          <p className="font-medium">Nightly Rate</p>
                          <p>${Number(reservation.nightlyRate || 0).toFixed(2)}/night</p>
                        </div>
                      </div>
                    </div>
                    
                    {reservation.specialRequests && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Special Requests:</span> {reservation.specialRequests}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Reservation Modal */}
      {showAddForm && (
        <AddReservationModal
          onClose={() => setShowAddForm(false)}
          onSave={handleAddReservation}
          isLoading={createReservationMutation.isPending}
        />
      )}

      {/* Edit Reservation Modal */}
      {editingReservation && (
        <EditReservationModal
          reservation={editingReservation}
          onClose={() => setEditingReservation(null)}
          onSave={handleUpdateReservation}
          isLoading={updateReservationMutation.isPending}
        />
      )}
    </div>
  );
}

// Add Reservation Modal Component
function AddReservationModal({ onClose, onSave, isLoading }: {
  onClose: () => void;
  onSave: (data: Partial<Reservation>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    guestId: '',
    unitId: '',
    checkIn: '',
    checkOut: '',
    nightlyRate: 0,
    cleaningFee: 0,
    depositRequired: false,
    depositAmount: 0,
    specialRequests: '',
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add New Reservation</CardTitle>
          <CardDescription>Create a new guest reservation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Guest</label>
                <select
                  value={formData.guestId}
                  onChange={(e: any) => setFormData({ ...formData, guestId: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Select Guest</option>
                  {/* Guest options would be populated from API */}
                </select>
              </div>
              <div>
                <label className="label">Unit</label>
                <select
                  value={formData.unitId}
                  onChange={(e: any) => setFormData({ ...formData, unitId: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Select Unit</option>
                  {/* Unit options would be populated from API */}
                </select>
              </div>
              <div>
                <label className="label">Check-in Date</label>
                <input
                  type="date"
                  value={formData.checkIn}
                  onChange={(e: any) => setFormData({ ...formData, checkIn: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="label">Check-out Date</label>
                <input
                  type="date"
                  value={formData.checkOut}
                  onChange={(e: any) => setFormData({ ...formData, checkOut: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="label">Nightly Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.nightlyRate}
                  onChange={(e: any) => setFormData({ ...formData, nightlyRate: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="label">Cleaning Fee</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cleaningFee}
                  onChange={(e: any) => setFormData({ ...formData, cleaningFee: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="depositRequired"
                checked={formData.depositRequired}
                onChange={(e: any) => setFormData({ ...formData, depositRequired: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="depositRequired" className="text-sm">Deposit Required</label>
            </div>
            {formData.depositRequired && (
              <div>
                <label className="label">Deposit Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={(e: any) => setFormData({ ...formData, depositAmount: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                />
              </div>
            )}
            <div>
              <label className="label">Special Requests</label>
              <textarea
                value={formData.specialRequests}
                onChange={(e: any) => setFormData({ ...formData, specialRequests: e.target.value })}
                className="input w-full"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Reservation'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Edit Reservation Modal Component
function EditReservationModal({ reservation, onClose, onSave, isLoading }: {
  reservation: Reservation;
  onClose: () => void;
  onSave: (id: string, data: Partial<Reservation>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    checkIn: reservation.checkIn.split('T')[0],
    checkOut: reservation.checkOut.split('T')[0],
    nightlyRate: reservation.nightlyRate || 0,
    cleaningFee: reservation.cleaningFee || 0,
    depositRequired: reservation.depositRequired,
    depositAmount: reservation.depositAmount || 0,
    specialRequests: reservation.specialRequests || '',
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(reservation.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Edit Reservation</CardTitle>
          <CardDescription>Update reservation information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Check-in Date</label>
                <input
                  type="date"
                  value={formData.checkIn}
                  onChange={(e: any) => setFormData({ ...formData, checkIn: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="label">Check-out Date</label>
                <input
                  type="date"
                  value={formData.checkOut}
                  onChange={(e: any) => setFormData({ ...formData, checkOut: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="label">Nightly Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.nightlyRate}
                  onChange={(e: any) => setFormData({ ...formData, nightlyRate: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="label">Cleaning Fee</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cleaningFee}
                  onChange={(e: any) => setFormData({ ...formData, cleaningFee: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="depositRequired"
                checked={formData.depositRequired}
                onChange={(e: any) => setFormData({ ...formData, depositRequired: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="depositRequired" className="text-sm">Deposit Required</label>
            </div>
            {formData.depositRequired && (
              <div>
                <label className="label">Deposit Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={(e: any) => setFormData({ ...formData, depositAmount: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                />
              </div>
            )}
            <div>
              <label className="label">Special Requests</label>
              <textarea
                value={formData.specialRequests}
                onChange={(e: any) => setFormData({ ...formData, specialRequests: e.target.value })}
                className="input w-full"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Updating...' : 'Update Reservation'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
