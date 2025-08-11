import { logger } from 'firebase-functions';
import { Storage } from '@google-cloud/storage';
import { PredictionServiceClient } from '@google-cloud/aiplatform';

interface InferenceRequest {
  imagePaths: string[];
  videoPath?: string;
  atmModel: string;
  orgId: string;
}

interface InferenceResult {
  anomalyScore: number;
  detected: boolean;
  confidence: number;
  modelVersion: string;
  heatmapUrl?: string;
  processedAt: Date;
}

export class AIInferenceService {
  private storage: Storage;
  private predictionClient: PredictionServiceClient;
  private projectId: string;
  private location: string;

  constructor() {
    this.storage = new Storage();
    this.predictionClient = new PredictionServiceClient();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || '';
    this.location = process.env.VERTEX_AI_LOCATION || 'us-central1';
  }

  async processInference(request: InferenceRequest): Promise<InferenceResult> {
    try {
      logger.info('Starting AI inference', { 
        orgId: request.orgId, 
        atmModel: request.atmModel,
        imageCount: request.imagePaths.length,
        hasVideo: !!request.videoPath
      });

      const processedImages = await this.preprocessImages(request.imagePaths);
      
      const modelEndpoint = await this.getModelEndpoint(request.atmModel, request.orgId);
      
      const inferenceResult = await this.runInference(modelEndpoint, processedImages);
      
      let heatmapUrl: string | undefined;
      if (inferenceResult.detected) {
        heatmapUrl = await this.generateHeatmap(
          processedImages[0], // Use first image for heatmap
          inferenceResult.anomalyScore,
          request.orgId
        );
      }

      const result: InferenceResult = {
        anomalyScore: inferenceResult.anomalyScore,
        detected: inferenceResult.detected,
        confidence: inferenceResult.confidence,
        modelVersion: inferenceResult.modelVersion,
        heatmapUrl,
        processedAt: new Date(),
      };

      logger.info('AI inference completed', { 
        result: {
          ...result,
          heatmapUrl: heatmapUrl ? '[GENERATED]' : undefined
        }
      });

      return result;
    } catch (error) {
      logger.error('AI inference failed', { error, request });
      throw new Error(`AI inference failed: ${error}`);
    }
  }

  private async preprocessImages(imagePaths: string[]): Promise<Buffer[]> {
    const processedImages: Buffer[] = [];
    
    for (const imagePath of imagePaths) {
      try {
        const file = this.storage.bucket().file(imagePath);
        const [imageBuffer] = await file.download();
        
        processedImages.push(imageBuffer);
        
        logger.debug('Image preprocessed', { imagePath, size: imageBuffer.length });
      } catch (error) {
        logger.error('Failed to preprocess image', { imagePath, error });
        throw error;
      }
    }
    
    return processedImages;
  }

  private async getModelEndpoint(atmModel: string, orgId: string): Promise<string> {
    const modelName = `atm-anomaly-${atmModel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const endpoint = `projects/${this.projectId}/locations/${this.location}/endpoints/${modelName}`;
    
    logger.debug('Using model endpoint', { atmModel, orgId, endpoint });
    return endpoint;
  }

  private async runInference(endpoint: string, images: Buffer[]): Promise<{
    anomalyScore: number;
    detected: boolean;
    confidence: number;
    modelVersion: string;
  }> {
    try {
      const mockAnomalyScore = Math.random() * 10; // 0-10 scale
      const threshold = 6.5; // μ + 3σ threshold
      
      const result = {
        anomalyScore: mockAnomalyScore,
        detected: mockAnomalyScore > threshold,
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 confidence
        modelVersion: 'v1.0.0-dev',
      };

      logger.info('Mock inference result', result);
      return result;

      /*
      const instances = images.map(image => ({
        image: {
          bytesBase64Encoded: image.toString('base64')
        }
      }));

      const request = {
        endpoint,
        instances,
      };

      const [response] = await this.predictionClient.predict(request);
      
      const predictions = response.predictions;
      */
      
    } catch (error) {
      logger.error('Vertex AI prediction failed', { endpoint, error });
      throw error;
    }
  }

  private async generateHeatmap(
    originalImage: Buffer, 
    anomalyScore: number, 
    orgId: string
  ): Promise<string> {
    try {
      
      const timestamp = Date.now();
      const heatmapPath = `heatmaps/${orgId}/${timestamp}_heatmap.jpg`;
      
      const bucket = this.storage.bucket();
      const file = bucket.file(heatmapPath);
      
      await file.save(originalImage, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            anomalyScore: anomalyScore.toString(),
            generatedAt: new Date().toISOString(),
          },
        },
      });

      await file.makePublic();
      
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${heatmapPath}`;
      
      logger.info('Heatmap generated', { heatmapPath, publicUrl });
      return publicUrl;
      
    } catch (error) {
      logger.error('Heatmap generation failed', { error });
      return '';
    }
  }

  async getAvailableModels(orgId: string): Promise<string[]> {
    const availableModels = [
      'NCR-SelfServ-80',
      'Diebold-Nixdorf-DN-Series',
      'Wincor-Nixdorf-ProCash',
      'Hyosung-NH-2700CE',
      'Generic-ATM-Model'
    ];
    
    logger.debug('Available models', { orgId, models: availableModels });
    return availableModels;
  }
}
