import 'package:flutter/foundation.dart';

class UploadProvider with ChangeNotifier {
  bool _isUploading = false;
  double _uploadProgress = 0.0;
  String? _error;
  int _queuedUploads = 0;

  bool get isUploading => _isUploading;
  double get uploadProgress => _uploadProgress;
  String? get error => _error;
  int get queuedUploads => _queuedUploads;

  void setUploading(bool uploading) {
    _isUploading = uploading;
    notifyListeners();
  }

  void setUploadProgress(double progress) {
    _uploadProgress = progress;
    notifyListeners();
  }

  void setError(String? error) {
    _error = error;
    notifyListeners();
  }

  void setQueuedUploads(int count) {
    _queuedUploads = count;
    notifyListeners();
  }
}
