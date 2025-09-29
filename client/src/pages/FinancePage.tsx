import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, DollarSign, Calendar, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

interface FinancialData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalDeposits: number;
  pendingDeposits: number;
  refundedDeposits: number;
  recentTransactions: Array<{
    id: string;
    type: 'REVENUE' | 'DEPOSIT' | 'REFUND';
    amount: number;
    description: string;
    date: string;
    status: string;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    revenue: number;
    deposits: number;
  }>;
}

const transactionIcons = {
  REVENUE: TrendingUp,
  DEPOSIT: CreditCard,
  REFUND: AlertCircle,
};

const transactionColors = {
  REVENUE: 'text-green-600',
  DEPOSIT: 'text-blue-600',
  REFUND: 'text-red-600',
};

const statusColors = {
  COMPLETED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
};

const statusIcons = {
  COMPLETED: CheckCircle,
  PENDING: Clock,
  FAILED: AlertCircle,
  PROCESSING: Clock,
};

export default function FinancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Fetch financial data
  const { data: financialData, isLoading } = useQuery<FinancialData>({
    queryKey: ['finance', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/finance?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch financial data');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading financial data...</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-600">Financial reports and deposit management</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e: any) => setSelectedPeriod(e.target.value)}
            className="input"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData?.totalRevenue || 0)}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData?.monthlyRevenue || 0)}</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData?.totalDeposits || 0)}</div>
            <p className="text-xs text-gray-500">Held in security</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData?.pendingDeposits || 0)}</div>
            <p className="text-xs text-gray-500">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Revenue Overview
            </CardTitle>
            <CardDescription>Monthly revenue and financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(financialData?.totalRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Revenue</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(financialData?.monthlyRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Refunded Deposits</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(financialData?.refundedDeposits || 0)}
                </span>
              </div>
              
              {/* Monthly Breakdown Chart */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Monthly Breakdown</h4>
                <div className="space-y-2">
                  {financialData?.monthlyBreakdown?.slice(0, 6).map((month: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{month.month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-green-600">{formatCurrency(month.revenue)}</span>
                        <span className="text-blue-600">{formatCurrency(month.deposits)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Deposit Management
            </CardTitle>
            <CardDescription>Track and manage security deposits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Deposits Held</span>
                <span className="text-lg font-bold text-purple-600">
                  {formatCurrency(financialData?.totalDeposits || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending Deposits</span>
                <span className="text-lg font-bold text-yellow-600">
                  {formatCurrency(financialData?.pendingDeposits || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Refunded Deposits</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(financialData?.refundedDeposits || 0)}
                </span>
              </div>
              
              {/* Deposit Status Summary */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Deposit Status Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(financialData?.totalDeposits || 0)}
                    </div>
                    <div className="text-xs text-green-600">Held</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">
                      {formatCurrency(financialData?.pendingDeposits || 0)}
                    </div>
                    <div className="text-xs text-yellow-600">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          {financialData?.recentTransactions?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No recent transactions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {financialData?.recentTransactions?.map((transaction: any) => {
                const TransactionIcon = transactionIcons[transaction.type as keyof typeof transactionIcons] || TrendingUp;
                const StatusIcon = statusIcons[transaction.status as keyof typeof statusIcons] || Clock;
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'REVENUE' ? 'bg-green-100' :
                        transaction.type === 'DEPOSIT' ? 'bg-blue-100' : 'bg-red-100'
                      }`}>
                        <TransactionIcon className={`h-5 w-5 ${
                          transaction.type === 'REVENUE' ? 'text-green-600' :
                          transaction.type === 'DEPOSIT' ? 'text-blue-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[transaction.status as keyof typeof statusColors]}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {transaction.status}
                      </span>
                      <span className={`text-lg font-bold ${transactionColors[transaction.type as keyof typeof transactionColors]}`}>
                        {transaction.type === 'REFUND' ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}