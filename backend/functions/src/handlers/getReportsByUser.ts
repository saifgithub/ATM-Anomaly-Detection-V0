import { Request, Response } from 'express';
import * as admin from 'firebase-admin';

export async function getReportsByUserHandler(req: Request, res: Response) {
  try {
    const { userId, orgId, limit = 50, offset = 0 } = req.query;

    if (!userId || !orgId) {
      return res.status(400).json({
        success: false,
        error: 'userId and orgId are required'
      });
    }

    const db = admin.firestore();

    const userDoc = await db.collection('users').doc(userId as string).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data()!;
    if (userData.orgId !== orgId) {
      return res.status(403).json({
        success: false,
        error: 'User does not belong to the specified organization'
      });
    }

    let query = db.collection('reports')
      .where('orgId', '==', orgId)
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit as string));

    if (userData.role === 'acquirer_agent') {
      query = query.where('userId', '==', userId);
    }

    if (parseInt(offset as string) > 0) {
      const offsetSnapshot = await db.collection('reports')
        .where('orgId', '==', orgId)
        .orderBy('created_at', 'desc')
        .limit(parseInt(offset as string))
        .get();
      
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    const reportsSnapshot = await query.get();
    const reports: any[] = [];

    reportsSnapshot.forEach(doc => {
      const reportData = doc.data();
      reports.push({
        id: doc.id,
        ...reportData,
        timestamp: reportData.timestamp?.toDate?.()?.toISOString() || reportData.timestamp,
        created_at: reportData.created_at?.toDate?.()?.toISOString() || reportData.created_at
      });
    });

    res.status(200).json({
      success: true,
      reports,
      count: reports.length,
      hasMore: reports.length === parseInt(limit as string)
    });

  } catch (error) {
    console.error('Error in getReportsByUser:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
