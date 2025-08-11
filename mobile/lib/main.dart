import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:workmanager/workmanager.dart';

import 'app.dart';
import 'services/firebase_service.dart';
import 'services/auth_service.dart';
import 'services/upload_queue_service.dart';
import 'services/notification_service.dart';
import 'providers/auth_provider.dart';
import 'providers/report_provider.dart';
import 'providers/upload_provider.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      await Hive.initFlutter();
      final uploadService = UploadQueueService();
      await uploadService.processOfflineUploads();
      return Future.value(true);
    } catch (e) {
      print('Background task failed: $e');
      return Future.value(false);
    }
  });
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize Hive for offline storage
  await Hive.initFlutter();
  
  // Initialize background work manager
  await Workmanager().initialize(
    callbackDispatcher,
    isInDebugMode: false,
  );
  
  // Register periodic background sync
  await Workmanager().registerPeriodicTask(
    "upload-sync",
    "uploadSync",
    frequency: const Duration(minutes: 15),
    constraints: Constraints(
      networkType: NetworkType.connected,
    ),
  );
  
  // Initialize notification service
  final notificationService = NotificationService();
  await notificationService.initialize();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ReportProvider()),
        ChangeNotifierProvider(create: (_) => UploadProvider()),
      ],
      child: const ATMApp(),
    ),
  );
}
