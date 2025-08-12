import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const mockTimestamp = {
  fromDate: (date: Date) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
  }),
  now: () => mockTimestamp.fromDate(new Date()),
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isDevelopment = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key-for-development';

let app: any;
let auth: any;
let db: any;
let storage: any;

if (isDevelopment) {
  app = { name: '[DEFAULT]', options: firebaseConfig };
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signInWithEmailAndPassword: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
  };

  (global as any).Timestamp = mockTimestamp;
  
  const mockReports = [
    {
      id: 'report-1',
      atmId: 'ATM-001',
      orgId: 'org_123',
      userId: 'mock-user-123',
      status: 'completed',
      mediaType: 'image',
      ai_result: {
        detected: true,
        anomaly_score: 0.85,
        confidence: 0.92
      },
      created_at: { toDate: () => new Date(Date.now() - 2 * 60 * 60 * 1000) }
    },
    {
      id: 'report-2',
      atmId: 'ATM-002',
      orgId: 'org_123',
      userId: 'mock-user-123',
      status: 'processing',
      mediaType: 'video',
      created_at: { toDate: () => new Date(Date.now() - 4 * 60 * 60 * 1000) }
    },
    {
      id: 'report-3',
      atmId: 'ATM-003',
      orgId: 'org_123',
      userId: 'mock-user-123',
      status: 'completed',
      mediaType: 'image',
      ai_result: {
        detected: false,
        anomaly_score: 0.15,
        confidence: 0.88
      },
      created_at: { toDate: () => new Date(Date.now() - 6 * 60 * 60 * 1000) }
    },
    {
      id: 'report-4',
      atmId: 'ATM-001',
      orgId: 'org_123',
      userId: 'mock-user-123',
      status: 'completed',
      mediaType: 'image',
      ai_result: {
        detected: true,
        anomaly_score: 0.72,
        confidence: 0.95
      },
      created_at: { toDate: () => new Date(Date.now() - 8 * 60 * 60 * 1000) }
    }
  ];

  const mockCollection = (collectionName: string) => ({
    doc: (docId?: string) => ({
      get: () => Promise.resolve({ 
        exists: true, 
        data: () => mockReports.find(r => r.id === docId) || {} 
      }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
    }),
    where: (field: string, operator: string, value: any) => ({
      where: (field2: string, operator2: string, value2: any) => ({
        orderBy: (orderField: string, direction: string) => ({
          limit: (limitCount: number) => ({
            get: () => {
              let filteredReports = [...mockReports];
              
              if (field === 'orgId' && operator === '==' && value === 'org_123') {
                filteredReports = filteredReports.filter(r => r.orgId === value);
              }
              
              if (field === 'created_at' && operator === '>=' && value?.toDate) {
                const filterDate = value.toDate();
                filteredReports = filteredReports.filter(r => 
                  r.created_at.toDate().getTime() >= filterDate.getTime()
                );
              }
              
              if (field2 === 'created_at' && operator2 === '<' && value2?.toDate) {
                const filterDate = value2.toDate();
                filteredReports = filteredReports.filter(r => 
                  r.created_at.toDate().getTime() < filterDate.getTime()
                );
              }
              
              if (field2 === 'ai_result.detected' && operator2 === '==' && value2 === true) {
                filteredReports = filteredReports.filter(r => r.ai_result?.detected === true);
              }
              
              if (field === 'status' && operator === '==' && value === 'processing') {
                filteredReports = filteredReports.filter(r => r.status === 'processing');
              }
              
              filteredReports.sort((a, b) => 
                b.created_at.toDate().getTime() - a.created_at.toDate().getTime()
              );
              
              filteredReports = filteredReports.slice(0, limitCount);
              
              return Promise.resolve({
                docs: filteredReports.map(report => ({
                  id: report.id,
                  data: () => report
                }))
              });
            }
          })
        })
      }),
      orderBy: (orderField: string, direction: string) => ({
        limit: (limitCount: number) => ({
          get: () => {
            let filteredReports = [...mockReports];
            
            if (field === 'orgId' && operator === '==' && value === 'org_123') {
              filteredReports = filteredReports.filter(r => r.orgId === value);
            }
            
            if (field === 'userId' && operator === '==' && value === 'mock-user-123') {
              filteredReports = filteredReports.filter(r => r.userId === value);
            }
            
            if (field === 'created_at' && operator === '>=' && value?.toDate) {
              const filterDate = value.toDate();
              filteredReports = filteredReports.filter(r => 
                r.created_at.toDate().getTime() >= filterDate.getTime()
              );
            }
            
            if (field === 'status' && operator === '==' && value === 'processing') {
              filteredReports = filteredReports.filter(r => r.status === 'processing');
            }
            
            if (field === 'ai_result.detected' && operator === '==' && value === true) {
              filteredReports = filteredReports.filter(r => r.ai_result?.detected === true);
            }
            
            filteredReports.sort((a, b) => 
              b.created_at.toDate().getTime() - a.created_at.toDate().getTime()
            );
            
            filteredReports = filteredReports.slice(0, limitCount);
            
            return Promise.resolve({
              docs: filteredReports.map(report => ({
                id: report.id,
                data: () => report
              }))
            });
          }
        })
      })
    })
  });

  db = {
    collection: mockCollection,
  };
  storage = {
    ref: () => ({
      put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('mock-url') } }),
    }),
  };
} else {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export const collection = isDevelopment ? 
  (db: any, collectionName: string) => db.collection(collectionName) :
  require('firebase/firestore').collection;

export const query = isDevelopment ?
  (...args: any[]) => args[0] :
  require('firebase/firestore').query;

export const where = isDevelopment ?
  (field: string, operator: string, value: any) => ({ field, operator, value }) :
  require('firebase/firestore').where;

export const orderBy = isDevelopment ?
  (field: string, direction: string) => ({ field, direction }) :
  require('firebase/firestore').orderBy;

export const limit = isDevelopment ?
  (limitCount: number) => ({ limitCount }) :
  require('firebase/firestore').limit;

export const getDocs = isDevelopment ?
  (queryObj: any) => {
    if (queryObj && queryObj.get) {
      return queryObj.get();
    }
    return Promise.resolve({ docs: [] });
  } :
  require('firebase/firestore').getDocs;

export const Timestamp = isDevelopment ? mockTimestamp : require('firebase/firestore').Timestamp;

export { auth, db, storage };
export default app;
