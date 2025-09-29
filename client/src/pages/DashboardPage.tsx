import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Users, 
  Building, 
  TrendingUp,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../lib/utils';

interface DashboardStats {
  totalReservations: number;
  totalRevenue: number;
  totalUnits: number;
  totalGuests: number;
  availableUnits: number;
  checkedInToday: number;
  checkedOutToday: number;
  recentReservations: Array<{
    id: string;
    guest: { fullName: string };
    unit: { name: string };
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    status: string;
  }>;
}

type TimePeriod = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth' | 'next2Months' | 'next3Months';

const timePeriods = [
  { key: 'today', label: 'Today', short: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow', short: 'Tomorrow' },
  { key: 'thisWeek', label: 'This Week', short: 'This Week' },
  { key: 'nextWeek', label: 'Next Week', short: 'Next Week' },
  { key: 'thisMonth', label: 'This Month', short: 'This Month' },
  { key: 'nextMonth', label: 'Next Month', short: 'Next Month' },
  { key: 'next2Months', label: 'Next 2 Months', short: 'Next 2M' },
  { key: 'next3Months', label: 'Next 3 Months', short: 'Next 3M' },
] as const;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TimePeriod>('today');

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard?period=${activeTab}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getKPIStats = () => {
    const baseStats = {
      availableUnits: stats?.availableUnits || 0,
      checkedIn: stats?.checkedInToday || 0,
      checkedOut: stats?.checkedOutToday || 0,
      totalUnits: stats?.totalUnits || 0,
    };

    // Calculate occupancy rate
    const occupiedUnits = baseStats.totalUnits - baseStats.availableUnits;
    const occupancyRate = baseStats.totalUnits > 0 ? (occupiedUnits / baseStats.totalUnits) * 100 : 0;

    return {
      ...baseStats,
      occupiedUnits,
      occupancyRate: Math.round(occupancyRate),
    };
  };

  const kpiStats = getKPIStats();

  const kpiCards = [
    {
      title: 'Available Units',
      value: kpiStats.availableUnits,
      total: kpiStats.totalUnits,
      icon: Building,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: `${kpiStats.availableUnits} of ${kpiStats.totalUnits} units available`,
    },
    {
      title: 'Checked In',
      value: kpiStats.checkedIn,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Guests checking in today',
    },
    {
      title: 'Checked Out',
      value: kpiStats.checkedOut,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Guests checking out today',
    },
    {
      title: 'Occupancy Rate',
      value: `${kpiStats.occupancyRate}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: `${kpiStats.occupiedUnits} units occupied`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your homestay operations</p>
      </div>

      {/* Time Period Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Time Period View</CardTitle>
          <CardDescription>Select a time period to view relevant metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {timePeriods.map((period) => (
              <Button
                key={period.key}
                variant={activeTab === period.key ? 'primary' : 'outline'}
                onClick={() => setActiveTab(period.key)}
                className="text-sm"
              >
                {period.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-gray-600 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Reservations Overview
            </CardTitle>
            <CardDescription>Reservation statistics for {timePeriods.find(p => p.key === activeTab)?.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Reservations</span>
                <span className="text-lg font-semibold">{stats?.totalReservations || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                <span className="text-lg font-semibold">{formatCurrency(stats?.totalRevenue || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Guests</span>
                <span className="text-lg font-semibold">{stats?.totalGuests || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest reservation activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentReservations?.length ? (
                stats.recentReservations.slice(0, 5).map((reservation) => (
                  <div key={reservation.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{reservation.guest.fullName}</p>
                        <p className="text-xs text-gray-600">{reservation.unit.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">{formatCurrency(reservation.totalAmount)}</p>
                      <p className="text-xs text-gray-600">{reservation.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent reservations</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Perform common tasks quickly</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="justify-start">
            <Calendar className="mr-2 h-4 w-4" /> New Reservation
          </Button>
          <Button variant="outline" className="justify-start">
            <Users className="mr-2 h-4 w-4" /> Add Guest
          </Button>
          <Button variant="outline" className="justify-start">
            <Building className="mr-2 h-4 w-4" /> Manage Units
          </Button>
          <Button variant="outline" className="justify-start">
            <MapPin className="mr-2 h-4 w-4" /> Manage Locations
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}