import { Request, Response } from 'express';
import * as admin from 'firebase-admin';

export async function getInferenceResultHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { userId, orgId } = req.query;

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

    const reportDoc = await db.collection('reports').doc(id).get();
    if (!reportDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const reportData = reportDoc.data()!;

    if (reportData.orgId !== orgId) {
      return res.status(403).json({
        success: false,
        error: 'Report does not belong to the specified organization'
      });
    }

    if (userData.role === 'acquirer_agent' && reportData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own reports.'
      });
    }

    const response = {
      id: reportDoc.id,
      status: reportData.status,
      ai_result: reportData.ai_result,
      timestamp: reportData.timestamp?.toDate?.()?.toISOString() || reportData.timestamp,
      created_at: reportData.created_at?.toDate?.()?.toISOString() || reportData.created_at,
      atmId: reportData.atmId,
      mediaType: reportData.mediaType
    };

    res.status(200).json({
      success: true,
      report: response
    });

  } catch (error) {
    console.error('Error in getInferenceResult:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
