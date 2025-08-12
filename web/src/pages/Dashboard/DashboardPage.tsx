import React from 'react';
import { useQuery } from 'react-query';
import { StatsCard } from '../../components/Dashboard/StatsCard';
import { RecentReports } from '../../components/Reports/RecentReports';
import { AlertsOverview } from '../../components/Alerts/AlertsOverview';
import { MapOverview } from '../../components/Map/MapOverview';
import { getDashboardStats } from '../../services/dashboardService';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery(
    ['dashboard-stats', user?.orgId],
    () => getDashboardStats(user?.orgId || ''),
    {
      enabled: !!user?.orgId,
      refetchInterval: 60000,
    }
  );

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.displayName || user?.email}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your ATM monitoring system today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Reports"
          value={stats?.totalReports || 0}
          change={stats?.reportsChange || 0}
          changeType={(stats?.reportsChange || 0) >= 0 ? 'increase' : 'decrease'}
          icon="document"
        />
        <StatsCard
          title="Anomalies Detected"
          value={stats?.anomaliesDetected || 0}
          change={stats?.anomaliesChange || 0}
          changeType={(stats?.anomaliesChange || 0) >= 0 ? 'increase' : 'decrease'}
          icon="exclamation"
        />
        <StatsCard
          title="Active ATMs"
          value={stats?.activeAtms || 0}
          change={stats?.atmsChange || 0}
          changeType={(stats?.atmsChange || 0) >= 0 ? 'increase' : 'decrease'}
          icon="map"
        />
        <StatsCard
          title="Avg Response Time"
          value={stats?.avgResponseTime || 0}
          change={stats?.responseTimeChange || 0}
          changeType={(stats?.responseTimeChange || 0) <= 0 ? 'increase' : 'decrease'}
          icon="clock"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Reports and Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Reports */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Reports
              </h3>
              <RecentReports limit={10} />
            </div>
          </div>

          {/* Map Overview */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                ATM Locations
              </h3>
              <div className="h-96">
                <MapOverview />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Alerts */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Active Alerts
              </h3>
              <AlertsOverview limit={8} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <div className="text-sm font-medium text-gray-900">
                    Download Reports
                  </div>
                  <div className="text-xs text-gray-500">
                    Export recent anomaly reports
                  </div>
                </button>
                <button className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <div className="text-sm font-medium text-gray-900">
                    System Health
                  </div>
                  <div className="text-xs text-gray-500">
                    Check AI model performance
                  </div>
                </button>
                <button className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <div className="text-sm font-medium text-gray-900">
                    Manage ATMs
                  </div>
                  <div className="text-xs text-gray-500">
                    Add or configure ATM locations
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
