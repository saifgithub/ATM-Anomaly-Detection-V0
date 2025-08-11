# ATM Anomaly Detection System - Setup Guide

## Prerequisites

### Backend Requirements
- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK
- TypeScript (`npm install -g typescript`)

### Mobile App Requirements
- Flutter SDK 3.10+
- Android Studio / Xcode
- Firebase project configuration files

### Development Tools
- Git
- VS Code or preferred IDE
- Postman (for API testing)

## Backend Setup

### 1. Firebase Project Configuration

```bash
cd backend
firebase login
firebase init
```

Select the following options:
- Functions: Configure and deploy Cloud Functions
- Firestore: Configure security rules and indexes
- Storage: Configure Firebase Storage

### 2. Install Dependencies

```bash
cd functions
npm install
```

### 3. Environment Configuration

Create `.env` file in `backend/functions/`:
```env
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PROJECT=your-project-id
```

### 4. Deploy Backend Services

```bash
# Deploy functions
npm run deploy

# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy storage rules
firebase deploy --only storage
```

## Mobile App Setup

### 1. Flutter Dependencies

```bash
cd mobile
flutter pub get
```

### 2. Firebase Configuration

1. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
2. Place files in respective platform directories
3. Update Firebase configuration in `lib/main.dart`

### 3. Platform-specific Setup

#### Android
- Update `android/app/build.gradle` with Firebase configuration
- Set minimum SDK version to 21+

#### iOS
- Update `ios/Runner/Info.plist` with Firebase configuration
- Set minimum iOS version to 11.0+

### 4. Run the App

```bash
flutter run
```

## Database Schema Setup

### 1. Create Initial Collections

Use Firebase Console or run the setup script:

```bash
# Create sample data
node backend/scripts/setup-database.js
```

### 2. Configure Security Rules

The Firestore rules are automatically deployed with the backend setup.

## Testing

### Backend API Testing

```bash
# Start local emulators
cd backend
npm run serve

# Test endpoints
curl http://localhost:5001/your-project/us-central1/api/health
```

### Mobile App Testing

```bash
# Run tests
cd mobile
flutter test

# Run on device
flutter run --debug
```

## Production Deployment

### 1. Backend Production

```bash
# Deploy to production
firebase use production
firebase deploy
```

### 2. Mobile App Release

```bash
# Build release APK
flutter build apk --release

# Build iOS release
flutter build ios --release
```

## Monitoring and Logging

- Firebase Console: Monitor functions and database
- Google Cloud Console: View logs and metrics
- Firebase Crashlytics: Track mobile app crashes

## Security Checklist

- [ ] Firestore security rules deployed
- [ ] Storage security rules configured
- [ ] API endpoints secured with authentication
- [ ] Mobile app uses secure communication (HTTPS)
- [ ] Sensitive data encrypted at rest
- [ ] User permissions properly configured

## Troubleshooting

### Common Issues

1. **Firebase initialization error**
   - Verify configuration files are in correct locations
   - Check project ID matches in all configuration files

2. **Function deployment fails**
   - Ensure Node.js version is 18+
   - Check for TypeScript compilation errors

3. **Mobile app build errors**
   - Run `flutter clean && flutter pub get`
   - Verify platform-specific configurations

### Support

For technical issues:
1. Check Firebase Console logs
2. Review Cloud Function logs in Google Cloud Console
3. Use Flutter doctor for mobile app issues

## Next Steps

After successful setup:
1. Configure user authentication
2. Set up ATM data and organizations
3. Test end-to-end workflow
4. Proceed to Phase 2 (AI integration)
