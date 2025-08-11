import 'package:flutter/foundation.dart';
import '../models/report_model.dart';
import '../services/firebase_service.dart';

class ReportProvider with ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();
  
  List<ReportModel> _reports = [];
  bool _isLoading = false;
  String? _error;

  List<ReportModel> get reports => _reports;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadReports(String userId, String orgId) async {
    _setLoading(true);
    _clearError();
    
    try {
      _reports = await _firebaseService.getReportsByUser(userId, orgId);
      notifyListeners();
    } catch (e) {
      _setError('Failed to load reports: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<ReportModel?> getReport(String reportId, String userId, String orgId) async {
    try {
      return await _firebaseService.getInferenceResult(reportId, userId, orgId);
    } catch (e) {
      _setError('Failed to get report: $e');
      return null;
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
