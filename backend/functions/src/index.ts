import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as express from 'express';
import { uploadReportHandler } from './handlers/uploadReport';
import { getReportsByUserHandler } from './handlers/getReportsByUser';
import { getInferenceResultHandler } from './handlers/getInferenceResult';

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

app.post('/uploadReport', uploadReportHandler);
app.get('/getReportsByUser', getReportsByUserHandler);
app.get('/getInferenceResult/:id', getInferenceResultHandler);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export const api = functions.https.onRequest(app);

export const processInference = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    const reportData = snap.data();
    const reportId = context.params.reportId;
    
    try {
      console.log(`Processing inference for report ${reportId}`);
      
      const aiResult = {
        anomaly_score: 0.15,
        detected: false,
        model_version: 'v1.0.0-placeholder',
        processed_at: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await snap.ref.update({
        ai_result: aiResult,
        status: 'completed'
      });
      
      await sendNotificationToSubscribers(reportData.atmId, reportId, aiResult);
      
    } catch (error) {
      console.error(`Error processing inference for report ${reportId}:`, error);
      await snap.ref.update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

async function sendNotificationToSubscribers(atmId: string, reportId: string, aiResult: any) {
  try {
    const db = admin.firestore();
    
    const usersSnapshot = await db.collection('users')
      .where('subscribedAtms', 'array-contains', atmId)
      .get();
    
    const tokens: string[] = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }
    });
    
    if (tokens.length === 0) {
      console.log(`No subscribers found for ATM ${atmId}`);
      return;
    }
    
    const message = {
      notification: {
        title: aiResult.detected ? 'Anomaly Detected!' : 'ATM Check Complete',
        body: aiResult.detected 
          ? `Potential tampering detected at ATM ${atmId}. Anomaly score: ${aiResult.anomaly_score}`
          : `ATM ${atmId} appears normal. Anomaly score: ${aiResult.anomaly_score}`
      },
      data: {
        reportId,
        atmId,
        anomalyScore: aiResult.anomaly_score.toString(),
        detected: aiResult.detected.toString()
      },
      tokens
    };
    
    const response = await admin.messaging().sendMulticast(message);
    console.log(`Sent notifications: ${response.successCount} successful, ${response.failureCount} failed`);
    
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}
