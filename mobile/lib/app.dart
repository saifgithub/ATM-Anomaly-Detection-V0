import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/capture/capture_screen.dart';
import 'screens/upload/upload_screen.dart';
import 'screens/results/results_screen.dart';
import 'screens/profile/profile_screen.dart';

class ATMApp extends StatelessWidget {
  const ATMApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final router = GoRouter(
          initialLocation: authProvider.isAuthenticated ? '/home' : '/login',
          redirect: (context, state) {
            final isAuthenticated = authProvider.isAuthenticated;
            final isLoggingIn = state.matchedLocation == '/login';
            
            if (!isAuthenticated && !isLoggingIn) {
              return '/login';
            }
            if (isAuthenticated && isLoggingIn) {
              return '/home';
            }
            return null;
          },
          routes: [
            GoRoute(
              path: '/login',
              builder: (context, state) => const LoginScreen(),
            ),
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
            GoRoute(
              path: '/capture',
              builder: (context, state) => const CaptureScreen(),
            ),
            GoRoute(
              path: '/upload',
              builder: (context, state) => const UploadScreen(),
            ),
            GoRoute(
              path: '/results/:reportId',
              builder: (context, state) => ResultsScreen(
                reportId: state.pathParameters['reportId']!,
              ),
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        );

        return MaterialApp.router(
          title: 'ATM Anomaly Detection',
          theme: ThemeData(
            primarySwatch: Colors.blue,
            useMaterial3: true,
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              elevation: 2,
            ),
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            cardTheme: CardTheme(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          routerConfig: router,
          debugShowCheckedModeBanner: false,
        );
      },
    );
  }
}
