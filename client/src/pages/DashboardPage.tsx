import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Users, 
  Building, 
  Sparkles, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../lib/utils';

interface DashboardStats {
  today: {
    arrivals: number;
    departures: number;
    occupancyRate: number;
    overdueTasks: number;
  };
  monthly: {
    revenue: number;
    deposits: {
      total: number;
      refunded: number;
      forfeited: number;
      count: number;
    };
  };
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get('/finance/dashboard');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Today\'s Arrivals',
      value: stats?.today.arrivals || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Today\'s Departures',
      value: stats?.today.departures || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Occupancy Rate',
      value: `${stats?.today.occupancyRate || 0}%`,
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Overdue Tasks',
      value: stats?.today.overdueTasks || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to FE Homestay Manager</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Monthly Revenue
            </CardTitle>
            <CardDescription>Revenue for the current month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats?.monthly.revenue || 0)}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total revenue from completed reservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Deposit Summary
            </CardTitle>
            <CardDescription>Deposit activity for the current month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Deposits</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(stats?.monthly.deposits.total || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Refunded</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats?.monthly.deposits.refunded || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Forfeited</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(stats?.monthly.deposits.forfeited || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium text-gray-900">Net Deposits</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(
                    (stats?.monthly.deposits.total || 0) - 
                    (stats?.monthly.deposits.refunded || 0)
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">New Reservation</p>
                  <p className="text-sm text-gray-600">Create a new booking</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Add Guest</p>
                  <p className="text-sm text-gray-600">Register new guest</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Manage Units</p>
                  <p className="text-sm text-gray-600">View and edit units</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Cleaning Tasks</p>
                  <p className="text-sm text-gray-600">View cleaning schedule</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
