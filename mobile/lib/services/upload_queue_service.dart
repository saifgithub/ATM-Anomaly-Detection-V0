import 'package:hive/hive.dart';

class UploadQueueService {
  static const String _boxName = 'upload_queue';
  
  Future<Box> _getBox() async {
    return await Hive.openBox(_boxName);
  }

  Future<void> queueUpload(Map<String, dynamic> uploadData) async {
    final box = await _getBox();
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    await box.put(id, uploadData);
  }

  Future<List<Map<String, dynamic>>> getPendingUploads() async {
    final box = await _getBox();
    return box.values.cast<Map<String, dynamic>>().toList();
  }

  Future<void> removeUpload(String id) async {
    final box = await _getBox();
    await box.delete(id);
  }

  Future<void> processOfflineUploads() async {
    print('Processing offline uploads...');
  }
}
