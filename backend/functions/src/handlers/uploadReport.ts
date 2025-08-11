import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import * as Joi from 'joi';

const uploadReportSchema = Joi.object({
  userId: Joi.string().required(),
  gps: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    accuracy: Joi.number().min(0).required()
  }).required(),
  timestamp: Joi.string().isoDate().required(),
  orgId: Joi.string().required(),
  media: Joi.object({
    videoPath: Joi.string().uri().optional(),
    imagePaths: Joi.array().items(Joi.string().uri()).min(1).required()
  }).required(),
  atmId: Joi.string().optional()
});

export async function uploadReportHandler(req: Request, res: Response) {
  try {
    const { error, value } = uploadReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.details
      });
    }

    const { userId, gps, timestamp, orgId, media, atmId } = value;
    const db = admin.firestore();

    const userDoc = await db.collection('users').doc(userId).get();
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

    let identifiedAtmId = atmId;

    if (!identifiedAtmId) {
      const searchRadius = gps.accuracy * 1.2; // Search Radius Multiplier = 1.2
      
      const atmsSnapshot = await db.collection('atms')
        .where('orgId', '==', orgId)
        .get();

      const nearbyAtms: any[] = [];
      
      atmsSnapshot.forEach(doc => {
        const atmData = doc.data();
        if (atmData.location && atmData.location._latitude && atmData.location._longitude) {
          const distance = calculateDistance(
            gps.latitude,
            gps.longitude,
            atmData.location._latitude,
            atmData.location._longitude
          );
          
          if (distance <= searchRadius) {
            nearbyAtms.push({
              id: doc.id,
              distance,
              ...atmData
            });
          }
        }
      });

      if (nearbyAtms.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No ATM found within search radius',
          searchRadius,
          requiresManualSelection: true
        });
      } else if (nearbyAtms.length > 1) {
        return res.status(409).json({
          success: false,
          error: 'Multiple ATMs found within search radius',
          searchRadius,
          nearbyAtms: nearbyAtms.map(atm => ({
            id: atm.id,
            model: atm.model,
            distance: atm.distance
          })),
          requiresManualSelection: true
        });
      } else {
        identifiedAtmId = nearbyAtms[0].id;
      }
    }

    const atmDoc = await db.collection('atms').doc(identifiedAtmId).get();
    if (!atmDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'ATM not found'
      });
    }

    const atmData = atmDoc.data()!;
    if (atmData.orgId !== orgId) {
      return res.status(403).json({
        success: false,
        error: 'ATM does not belong to the specified organization'
      });
    }

    const reportData = {
      userId,
      atmId: identifiedAtmId,
      gps,
      timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
      status: 'processing',
      mediaType: media.videoPath ? 'video_and_images' : 'images_only',
      orgId,
      media,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      ai_result: null
    };

    const reportRef = await db.collection('reports').add(reportData);

    res.status(201).json({
      success: true,
      reportId: reportRef.id,
      atmId: identifiedAtmId,
      status: 'processing',
      message: 'Report uploaded successfully. AI processing initiated.'
    });

  } catch (error) {
    console.error('Error in uploadReport:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
