import 'dart:io';
import 'package:camera/camera.dart';
import 'package:geolocator/geolocator.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

class CameraService {
  static CameraService? _instance;
  static CameraService get instance => _instance ??= CameraService._();
  CameraService._();

  List<CameraDescription>? _cameras;
  CameraController? _controller;
  bool _isInitialized = false;

  List<CameraDescription>? get cameras => _cameras;
  CameraController? get controller => _controller;
  bool get isInitialized => _isInitialized;

  Future<void> initialize() async {
    try {
      _cameras = await availableCameras();
      if (_cameras!.isNotEmpty) {
        await _initializeController(_cameras!.first);
      }
    } catch (e) {
      print('Error initializing camera: $e');
      throw Exception('Failed to initialize camera: $e');
    }
  }

  Future<void> _initializeController(CameraDescription camera) async {
    _controller = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    try {
      await _controller!.initialize();
      _isInitialized = true;
    } catch (e) {
      print('Error initializing camera controller: $e');
      throw Exception('Failed to initialize camera controller: $e');
    }
  }

  Future<void> switchCamera() async {
    if (_cameras == null || _cameras!.length < 2) return;

    final currentCamera = _controller?.description;
    final newCamera = _cameras!.firstWhere(
      (camera) => camera != currentCamera,
      orElse: () => _cameras!.first,
    );

    await _controller?.dispose();
    await _initializeController(newCamera);
  }

  Future<String> takePicture() async {
    if (!_isInitialized || _controller == null) {
      throw Exception('Camera not initialized');
    }

    try {
      final directory = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'atm_image_$timestamp.jpg';
      final filePath = path.join(directory.path, 'images', fileName);

      await Directory(path.dirname(filePath)).create(recursive: true);

      final XFile image = await _controller!.takePicture();
      await image.saveTo(filePath);

      return filePath;
    } catch (e) {
      print('Error taking picture: $e');
      throw Exception('Failed to take picture: $e');
    }
  }

  Future<String> startVideoRecording() async {
    if (!_isInitialized || _controller == null) {
      throw Exception('Camera not initialized');
    }

    if (_controller!.value.isRecordingVideo) {
      throw Exception('Already recording video');
    }

    try {
      final directory = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'atm_video_$timestamp.mp4';
      final filePath = path.join(directory.path, 'videos', fileName);

      await Directory(path.dirname(filePath)).create(recursive: true);

      await _controller!.startVideoRecording();
      return filePath;
    } catch (e) {
      print('Error starting video recording: $e');
      throw Exception('Failed to start video recording: $e');
    }
  }

  Future<String> stopVideoRecording() async {
    if (!_isInitialized || _controller == null) {
      throw Exception('Camera not initialized');
    }

    if (!_controller!.value.isRecordingVideo) {
      throw Exception('Not recording video');
    }

    try {
      final XFile video = await _controller!.stopVideoRecording();
      final directory = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'atm_video_$timestamp.mp4';
      final filePath = path.join(directory.path, 'videos', fileName);

      await Directory(path.dirname(filePath)).create(recursive: true);
      await video.saveTo(filePath);

      return filePath;
    } catch (e) {
      print('Error stopping video recording: $e');
      throw Exception('Failed to stop video recording: $e');
    }
  }

  Future<Position> getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied');
    }

    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
      timeLimit: const Duration(seconds: 10),
    );
  }

  void dispose() {
    _controller?.dispose();
    _controller = null;
    _isInitialized = false;
  }
}
