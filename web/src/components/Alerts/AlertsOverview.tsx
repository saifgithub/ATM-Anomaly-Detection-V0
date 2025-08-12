import React from 'react';
import { useQuery } from 'react-query';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface AlertsOverviewProps {
  limit?: number;
}

interface Alert {
  id: string;
  reportId: string;
  atmId: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  created_at: any;
  resolved: boolean;
}

export const AlertsOverview: React.FC<AlertsOverviewProps> = ({ limit: alertLimit = 5 }) => {
  const { user } = useAuth();

  const { data: alerts, isLoading, error } = useQuery(
    ['alerts-overview', user?.orgId, alertLimit],
    async () => {
      if (!user?.orgId) return [];

      const isDevelopment = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key-for-development';
      
      if (isDevelopment) {
        return [
          {
            id: 'alert-1',
            reportId: 'report-1',
            atmId: 'ATM-001',
            severity: 'high',
            message: 'Anomaly detected with 92.0% confidence',
            created_at: { toDate: () => new Date(Date.now() - 1 * 60 * 60 * 1000) },
            resolved: false,
          },
          {
            id: 'alert-2',
            reportId: 'report-4',
            atmId: 'ATM-004',
            severity: 'medium',
            message: 'Anomaly detected with 75.0% confidence',
            created_at: { toDate: () => new Date(Date.now() - 3 * 60 * 60 * 1000) },
            resolved: false,
          },
          {
            id: 'alert-3',
            reportId: 'report-5',
            atmId: 'ATM-001',
            severity: 'high',
            message: 'Anomaly detected with 95.0% confidence',
            created_at: { toDate: () => new Date(Date.now() - 8 * 60 * 60 * 1000) },
            resolved: false,
          }
        ] as Alert[];
      }

      const reportsRef = collection(db, 'reports');
      const reportsQuery = query(
        reportsRef,
        where('orgId', '==', user.orgId),
        where('ai_result.detected', '==', true),
        orderBy('created_at', 'desc'),
        limit(alertLimit)
      );

      const snapshot = await getDocs(reportsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          reportId: doc.id,
          atmId: data.atmId,
          severity: data.ai_result?.anomaly_score > 0.8 ? 'high' : 
                   data.ai_result?.anomaly_score > 0.6 ? 'medium' : 'low',
          message: `Anomaly detected with ${(data.ai_result?.confidence * 100).toFixed(1)}% confidence`,
          created_at: data.created_at,
          resolved: false,
        };
      }) as Alert[];
    },
    {
      enabled: !!user?.orgId,
      refetchInterval: 30000,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading alerts</p>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>No active alerts</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getSeverityIcon(alert.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  ATM {alert.atmId}
                </h4>
                <span className="text-xs font-medium uppercase">
                  {alert.severity}
                </span>
              </div>
              <p className="text-sm mt-1">
                {alert.message}
              </p>
              <p className="text-xs mt-2 opacity-75">
                {format(alert.created_at?.toDate?.() || new Date(alert.created_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
