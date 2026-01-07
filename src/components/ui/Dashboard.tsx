import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Plus } from 'lucide-react';
import type { PurchaseRecord } from '../../types';

interface DashboardProps {
  records: PurchaseRecord[];
  summary: any;
  onStartNewRecord: () => void;
  onViewRecords: () => void;
  onGenerateReport: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  records,
  summary,
  onStartNewRecord,
  onViewRecords,
  onGenerateReport
}) => {
  // Quick stats
  const stats = [
    {
      title: 'Total Records',
      value: records.length,
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Expenditure',
      value: `KSh ${summary.totalExpenditure.toFixed(2)}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Cash Balance',
      value: `KSh ${summary.totalCashBalance.toFixed(2)}`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: summary.totalCashBalance >= 0 ? 'bg-green-500' : 'bg-red-500',
      change: summary.totalCashBalance >= 0 ? '+5%' : '-3%'
    },
    {
      title: 'Active Suppliers',
      value: summary.topSuppliers.length,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-purple-500',
      change: '+2'
    }
  ];

  // Recent records
  const recentRecords = records.slice(0, 5);

  // Monthly expenditure
  const monthlyData = records.reduce((acc: Record<string, number>, record) => {
    const month = record.date.substring(0, 7);
    acc[month] = (acc[month] || 0) + record.totalExpenditure;
    return acc;
  }, {});

  const last6Months = Object.entries(monthlyData)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <div className="flex gap-3">
          <button
            onClick={onStartNewRecord}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} /> New Record
          </button>
          <button
            onClick={onGenerateReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <BarChart3 size={20} /> Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-full text-white`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expenditure Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Expenditure</h3>
          <div className="space-y-3">
            {last6Months.map(([month, amount]) => (
              <div key={month} className="flex items-center">
                <div className="w-24 text-sm text-gray-600">{month}</div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min((amount as number) / 100000 * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right text-sm font-medium">
                  KSh {(amount as number).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Records</h3>
            <button
              onClick={onViewRecords}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {recentRecords.map(record => (
              <div key={record.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{record.date}</p>
                    <p className="text-sm text-gray-600">
                      {record.receipts.length} receipts • KSh {record.totalExpenditure.toFixed(2)}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-sm ${
                    record.cashBalance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    KSh {record.cashBalance.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Suppliers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Suppliers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            

{summary.topSuppliers.map((supplier: any, index: number) => (
  <div key={index} className="border rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium">{supplier.name || 'Unknown Supplier'}</span>
      <span className="text-sm text-gray-500">#{index + 1}</span>
    </div>
    <div className="text-sm text-gray-600 mb-2">
      {supplier.count || 0} transactions
    </div>
    <div className="font-bold text-lg">
      KSh {typeof supplier.total === 'number' ? supplier.total.toFixed(2) : '0.00'}
    </div>
  </div>
))}
            

        </div>
      </div>
    </div>
  );
};

export default Dashboard;