import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/report_model.dart';

class FirebaseService {
  static const String baseUrl = 'https://your-project.cloudfunctions.net/api';
  
  Future<String> uploadReport({
    required String userId,
    required String orgId,
    required double latitude,
    required double longitude,
    required double accuracy,
    required List<String> imagePaths,
    String? videoPath,
    String? atmId,
  }) async {
    try {
      final requestBody = {
        'userId': userId,
        'orgId': orgId,
        'gps': {
          'latitude': latitude,
          'longitude': longitude,
          'accuracy': accuracy,
        },
        'timestamp': DateTime.now().toIso8601String(),
        'media': {
          'imagePaths': imagePaths,
          if (videoPath != null) 'videoPath': videoPath,
        },
        if (atmId != null) 'atmId': atmId,
      };

      final response = await http.post(
        Uri.parse('$baseUrl/uploadReport'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestBody),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        return data['reportId'];
      } else {
        throw Exception('Upload failed: ${response.body}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<ReportModel>> getReportsByUser(String userId, String orgId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/getReportsByUser?userId=$userId&orgId=$orgId'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> reportsData = data['reports'];
        return reportsData.map((report) => ReportModel.fromMap(report, report['id'])).toList();
      } else {
        throw Exception('Failed to load reports: ${response.body}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<ReportModel?> getInferenceResult(String reportId, String userId, String orgId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/getInferenceResult/$reportId?userId=$userId&orgId=$orgId'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ReportModel.fromMap(data['report'], reportId);
      } else {
        throw Exception('Failed to get report: ${response.body}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
