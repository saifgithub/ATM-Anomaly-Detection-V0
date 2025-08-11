# Firestore Database Schema

## Collections Overview

### users/{userId}
```json
{
  "profile": {
    "name": "string",
    "email": "string", 
    "role": "service_provider_admin | service_provider_analyst | acquirer_admin | acquirer_agent",
    "orgId": "string",
    "fcmToken": "string",
    "subscribedAtms": ["atmId1", "atmId2"],
    "created_at": "timestamp",
    "last_login": "timestamp"
  }
}
```

### reports/{reportId}
```json
{
  "metadata": {
    "userId": "string",
    "atmId": "string", 
    "gps": {
      "latitude": "number",
      "longitude": "number", 
      "accuracy": "number"
    },
    "timestamp": "timestamp",
    "status": "processing | completed | error",
    "mediaType": "video_and_images | images_only",
    "orgId": "string"
  },
  "media": {
    "imagePaths": ["gs://bucket/path1.jpg", "gs://bucket/path2.jpg"],
    "videoPath": "gs://bucket/video.mp4"
  },
  "ai_result": {
    "anomaly_score": "number",
    "detected": "boolean",
    "model_version": "string",
    "processed_at": "timestamp",
    "confidence": "number",
    "heatmap_url": "string"
  },
  "created_at": "timestamp"
}
```

### organizations/{orgId}
```json
{
  "details": {
    "name": "string",
    "contact": {
      "email": "string",
      "phone": "string",
      "address": "string"
    },
    "atmList": ["atmId1", "atmId2"],
    "subscription_tier": "basic | premium | enterprise",
    "created_at": "timestamp"
  }
}
```

### atms/{atmId}
```json
{
  "details": {
    "model": "string", // e.g., 'NCR-Series5', maps to specific trained model
    "location": "geopoint", // GPS coordinates for lookup
    "status": "active | maintenance | offline",
    "orgId": "string",
    "address": "string",
    "installation_date": "timestamp",
    "last_inspection": "timestamp"
  }
}
```

### pending_changes/{changeId}
```json
{
  "change_type": "threshold_update | user_role_change | system_config",
  "proposed_by": "userId",
  "proposed_at": "timestamp", 
  "data": {
    "field": "value",
    "old_value": "previous_value",
    "new_value": "proposed_value"
  },
  "status": "pending | approved | rejected",
  "approved_by": "userId",
  "approved_at": "timestamp",
  "reason": "string"
}
```

## Security Rules Summary

- **Multi-tenant isolation**: All data scoped by `orgId`
- **Role-based access**: 4-tier hierarchy with specific permissions
- **Maker-checker workflow**: Critical changes require approval
- **Model data protection**: ML models and training data completely isolated
- **User data privacy**: Users can only access their own data unless admin

## Indexes Required

```javascript
// Composite indexes for efficient queries
reports: [
  ['orgId', 'created_at'],
  ['userId', 'created_at'], 
  ['atmId', 'timestamp'],
  ['status', 'created_at']
]

users: [
  ['orgId', 'role'],
  ['subscribedAtms', 'orgId']
]

atms: [
  ['orgId', 'status'],
  ['location', 'orgId'] // For geo queries
]
```

## Data Retention Policy

- **Reports**: 2 years for compliance
- **Media files**: 6 months in hot storage, then archive
- **User activity logs**: 1 year
- **AI model results**: Permanent for training improvement
