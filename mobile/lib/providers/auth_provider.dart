import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/auth_service.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  
  User? _firebaseUser;
  UserModel? _userModel;
  bool _isLoading = false;
  String? _error;

  User? get firebaseUser => _firebaseUser;
  UserModel? get userModel => _userModel;
  bool get isAuthenticated => _firebaseUser != null && _userModel != null;
  bool get isLoading => _isLoading;
  String? get error => _error;

  AuthProvider() {
    _initializeAuth();
  }

  void _initializeAuth() {
    FirebaseAuth.instance.authStateChanges().listen((User? user) async {
      _firebaseUser = user;
      if (user != null) {
        await _loadUserModel();
      } else {
        _userModel = null;
      }
      notifyListeners();
    });
  }

  Future<void> _loadUserModel() async {
    if (_firebaseUser == null) return;
    
    try {
      _userModel = await _authService.getUserModel(_firebaseUser!.uid);
    } catch (e) {
      _error = 'Failed to load user data: $e';
      print('Error loading user model: $e');
    }
  }

  Future<bool> signInWithPhoneNumber(String phoneNumber) async {
    _setLoading(true);
    _clearError();
    
    try {
      final success = await _authService.signInWithPhoneNumber(phoneNumber);
      return success;
    } catch (e) {
      _setError('Sign in failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> verifyOTP(String verificationId, String otp) async {
    _setLoading(true);
    _clearError();
    
    try {
      final success = await _authService.verifyOTP(verificationId, otp);
      if (success) {
        await _loadUserModel();
      }
      return success;
    } catch (e) {
      _setError('OTP verification failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signOut() async {
    _setLoading(true);
    try {
      await _authService.signOut();
      _firebaseUser = null;
      _userModel = null;
    } catch (e) {
      _setError('Sign out failed: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateFCMToken(String token) async {
    if (_firebaseUser == null) return;
    
    try {
      await _authService.updateFCMToken(_firebaseUser!.uid, token);
      if (_userModel != null) {
        _userModel = _userModel!.copyWith(fcmToken: token);
        notifyListeners();
      }
    } catch (e) {
      print('Failed to update FCM token: $e');
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }
}
