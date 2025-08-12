import React from 'react';
import { useQuery } from 'react-query';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { format } from 'date-fns';

interface RecentReportsProps {
  limit?: number;
}

interface Report {
  id: string;
  atmId: string;
  status: 'processing' | 'completed' | 'error';
  ai_result?: {
    detected: boolean;
    anomaly_score: number;
    confidence: number;
  };
  created_at: any;
  mediaType: string;
}

export const RecentReports: React.FC<RecentReportsProps> = ({ limit: reportLimit = 10 }) => {
  const { user } = useAuth();

  const { data: reports, isLoading, error } = useQuery(
    ['recent-reports', user?.orgId, reportLimit],
    async () => {
      if (!user?.orgId) return [];

      const isDevelopment = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key-for-development';
      
      if (isDevelopment) {
        return [
          {
            id: 'report-1',
            atmId: 'ATM-001',
            status: 'completed',
            mediaType: 'image',
            ai_result: { detected: true, anomaly_score: 0.85, confidence: 0.92 },
            created_at: { toDate: () => new Date(Date.now() - 2 * 60 * 60 * 1000) }
          },
          {
            id: 'report-2',
            atmId: 'ATM-002',
            status: 'processing',
            mediaType: 'video',
            created_at: { toDate: () => new Date(Date.now() - 4 * 60 * 60 * 1000) }
          },
          {
            id: 'report-3',
            atmId: 'ATM-003',
            status: 'completed',
            mediaType: 'image',
            ai_result: { detected: false, anomaly_score: 0.15, confidence: 0.88 },
            created_at: { toDate: () => new Date(Date.now() - 6 * 60 * 60 * 1000) }
          },
          {
            id: 'report-4',
            atmId: 'ATM-001',
            status: 'completed',
            mediaType: 'image',
            ai_result: { detected: true, anomaly_score: 0.72, confidence: 0.95 },
            created_at: { toDate: () => new Date(Date.now() - 8 * 60 * 60 * 1000) }
          }
        ] as Report[];
      }

      const reportsRef = collection(db, 'reports');
      let reportsQuery = query(
        reportsRef,
        where('orgId', '==', user.orgId),
        orderBy('created_at', 'desc'),
        limit(reportLimit)
      );

      if (user.role === 'acquirer_agent') {
        reportsQuery = query(
          reportsRef,
          where('orgId', '==', user.orgId),
          where('userId', '==', user.uid),
          orderBy('created_at', 'desc'),
          limit(reportLimit)
        );
      }

      const snapshot = await getDocs(reportsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Report[];
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
        <p className="text-red-600">Error loading reports</p>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No reports found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAnomalyBadge = (aiResult?: Report['ai_result']) => {
    if (!aiResult) return null;
    
    if (aiResult.detected) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Anomaly Detected
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Normal
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h4 className="text-sm font-medium text-gray-900">
                  ATM {report.atmId}
                </h4>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
                {getAnomalyBadge(report.ai_result)}
              </div>
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span>
                  {format(report.created_at?.toDate?.() || new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                </span>
                <span className="capitalize">{report.mediaType}</span>
                {report.ai_result && (
                  <span>
                    Score: {(report.ai_result.anomaly_score * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
