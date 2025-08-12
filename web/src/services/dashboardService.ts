import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface DashboardStats {
  totalReports: number;
  anomaliesDetected: number;
  activeAtms: number;
  avgResponseTime: number;
  reportsChange: number;
  anomaliesChange: number;
  atmsChange: number;
  responseTimeChange: number;
}

export const getDashboardStats = async (orgId: string): Promise<DashboardStats> => {
  try {
    const isDevelopment = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key-for-development';
    
    if (isDevelopment) {
      return {
        totalReports: 24,
        anomaliesDetected: 3,
        activeAtms: 8,
        avgResponseTime: 2.5,
        reportsChange: 5,
        anomaliesChange: 1,
        atmsChange: 2,
        responseTimeChange: -0.2,
      };
    }

    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const reportsRef = collection(db, 'reports');
    
    const currentWeekQuery = query(
      reportsRef,
      where('created_at', '>=', Timestamp.fromDate(lastWeek)),
      orderBy('created_at', 'desc')
    );
    
    const previousWeekQuery = query(
      reportsRef,
      where('created_at', '>=', Timestamp.fromDate(twoWeeksAgo)),
      where('created_at', '<', Timestamp.fromDate(lastWeek)),
      orderBy('created_at', 'desc')
    );

    const processingQuery = query(
      reportsRef,
      where('status', '==', 'processing'),
      orderBy('created_at', 'desc')
    );

    const [currentWeekDocs, previousWeekDocs, processingDocs] = await Promise.all([
      getDocs(currentWeekQuery),
      getDocs(previousWeekQuery),
      getDocs(processingQuery),
    ]);

    const currentReports = currentWeekDocs.docs;
    const previousReports = previousWeekDocs.docs;
    const processingReports = processingDocs.docs;

    const currentAnomalies = currentReports.filter(doc => 
      doc.data().ai_result?.detected === true
    );
    const previousAnomalies = previousReports.filter(doc => 
      doc.data().ai_result?.detected === true
    );

    const uniqueAtms = new Set(currentReports.map(doc => doc.data().atmId));
    const previousUniqueAtms = new Set(previousReports.map(doc => doc.data().atmId));

    return {
      totalReports: currentReports.length,
      anomaliesDetected: currentAnomalies.length,
      activeAtms: uniqueAtms.size,
      avgResponseTime: 2.5,
      reportsChange: currentReports.length - previousReports.length,
      anomaliesChange: currentAnomalies.length - previousAnomalies.length,
      atmsChange: uniqueAtms.size - previousUniqueAtms.size,
      responseTimeChange: -0.2,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
