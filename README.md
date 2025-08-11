# ATM Anomaly Detection System

A real-time, AI-powered system for detecting ATM tampering through image and video analysis using Flutter mobile app, Firebase backend, and Convolutional Autoencoders.

## Project Overview

This system uses unsupervised machine learning to detect anomalies in ATM fascia by learning the "normal" visual signature of specific ATM types. The core components include:

- **Mobile App (Flutter + Firebase)**: Captures 5-second videos and photos with GPS coordinates
- **Cloud Backend (Firebase + Google Cloud)**: Serverless platform for secure data handling and AI inference
- **AI Component (Vertex AI + Cloud Run)**: Specialized Convolutional Autoencoders for each ATM fascia type
- **Multi-tenant Architecture**: Secure data separation for different ATM operators

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Flutter App   │───▶│  Cloud Functions │───▶│   Vertex AI     │
│   (Mobile)      │    │   (Backend API)  │    │  (ML Models)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Firebase Auth   │    │    Firestore     │    │   Cloud Run     │
│ (Authentication)│    │   (Database)     │    │  (Inference)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Project Structure

```
atm-anomaly-detection/
├── backend/                 # Cloud Functions and backend services
│   ├── functions/          # Firebase Cloud Functions
│   ├── firestore-rules/    # Firestore security rules
│   └── schemas/            # Database schemas
├── mobile/                 # Flutter mobile application
│   ├── lib/               # Flutter source code
│   ├── android/           # Android-specific configuration
│   └── ios/               # iOS-specific configuration
├── ml-models/             # AI/ML model training and deployment
│   ├── training/          # Model training scripts
│   └── inference/         # Cloud Run inference services
└── docs/                  # Documentation and specifications
```

## Development Phases

### Phase 1: Foundation (Current)
- ✅ Backend API development and deployment
- ✅ Database schema and security rules
- ✅ Basic mobile app with core functionality
- ✅ CI/CD pipeline setup

### Phase 2: AI Integration (Next)
- 🔄 Model architecture implementation
- 🔄 Training pipeline development
- 🔄 Inference service deployment

### Phase 3: Advanced Features
- ⏳ Web dashboard development
- ⏳ Advanced mobile app features
- ⏳ Multi-tenant user management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Flutter SDK 3.0+
- Firebase CLI
- Google Cloud SDK
- Python 3.9+ (for ML components)

### Backend Setup

```bash
cd backend
npm install -g firebase-tools
firebase login
firebase init
```

### Mobile App Setup

```bash
cd mobile
flutter pub get
flutter run
```

## Security & Multi-tenancy

The system implements a strict user hierarchy with role-based access control:

- **Service Provider Admin**: Full system access and approval authority
- **Service Provider Analyst**: Read-only access across all tenants, can propose changes
- **ATM Acquirer Admin**: Full control over their organization's data
- **ATM Acquirer Agent**: Limited access for field operations

All data is isolated by `orgId` to ensure complete tenant separation.

## API Endpoints

- `POST /uploadReport` - Upload media and metadata, trigger AI inference
- `GET /getReportsByUser` - Fetch user's previous reports
- `GET /getInferenceResult/{id}` - Poll for AI detection results

## Contributing

This project follows secure development practices with:
- Multi-factor authentication required
- Code review mandatory for all changes
- Automated security scanning
- Encrypted data storage and transmission

## License

Private and confidential. All rights reserved.

---

**Link to Devin run**: https://app.devin.ai/sessions/0c2b7b87aac54225bf3471edbc3a3593
**Requested by**: @saifgithub
