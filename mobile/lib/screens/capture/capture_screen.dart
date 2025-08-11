import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';

import '../../services/camera_service.dart';
import '../../providers/upload_provider.dart';
import '../../models/report_model.dart';

class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> with WidgetsBindingObserver {
  final CameraService _cameraService = CameraService.instance;
  bool _isInitializing = true;
  String? _error;
  bool _isRecording = false;
  List<String> _capturedImages = [];
  String? _recordedVideo;
  Position? _currentLocation;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
    _getCurrentLocation();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!_cameraService.isInitialized) return;

    if (state == AppLifecycleState.inactive) {
      _cameraService.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
    }
  }

  Future<void> _initializeCamera() async {
    try {
      await _cameraService.initialize();
      setState(() {
        _isInitializing = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _isInitializing = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      final position = await _cameraService.getCurrentLocation();
      setState(() {
        _currentLocation = position;
      });
    } catch (e) {
      print('Error getting location: $e');
    }
  }

  Future<void> _takePicture() async {
    try {
      final imagePath = await _cameraService.takePicture();
      setState(() {
        _capturedImages.add(imagePath);
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Picture captured (${_capturedImages.length}/5)'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error taking picture: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _toggleVideoRecording() async {
    try {
      if (_isRecording) {
        final videoPath = await _cameraService.stopVideoRecording();
        setState(() {
          _isRecording = false;
          _recordedVideo = videoPath;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video recording stopped'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        await _cameraService.startVideoRecording();
        setState(() {
          _isRecording = true;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video recording started'),
            backgroundColor: Colors.blue,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error with video recording: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _switchCamera() async {
    try {
      await _cameraService.switchCamera();
      setState(() {});
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error switching camera: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _clearCaptures() {
    setState(() {
      _capturedImages.clear();
      _recordedVideo = null;
    });
  }

  Future<void> _uploadCaptures() async {
    if (_capturedImages.isEmpty && _recordedVideo == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No media captured to upload'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_currentLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Location not available. Please enable GPS.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    try {
      final uploadProvider = Provider.of<UploadProvider>(context, listen: false);
      
      final gpsData = GPSData(
        latitude: _currentLocation!.latitude,
        longitude: _currentLocation!.longitude,
        accuracy: _currentLocation!.accuracy,
      );

      final mediaData = MediaData(
        imagePaths: _capturedImages,
        videoPath: _recordedVideo,
      );

      await uploadProvider.queueUpload(
        gps: gpsData,
        media: mediaData,
        mediaType: _recordedVideo != null ? 'images_and_video' : 'images_only',
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Media queued for upload'),
          backgroundColor: Colors.green,
        ),
      );

      context.go('/upload');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error uploading: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Capture ATM'),
        actions: [
          if (_cameraService.cameras != null && _cameraService.cameras!.length > 1)
            IconButton(
              icon: const Icon(Icons.flip_camera_ios),
              onPressed: _switchCamera,
            ),
          IconButton(
            icon: const Icon(Icons.clear_all),
            onPressed: _capturedImages.isNotEmpty || _recordedVideo != null
                ? _clearCaptures
                : null,
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildBody() {
    if (_isInitializing) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Initializing camera...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Camera Error',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.red),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _initializeCamera,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Expanded(
          flex: 3,
          child: Container(
            width: double.infinity,
            child: _cameraService.controller != null
                ? CameraPreview(_cameraService.controller!)
                : const Center(child: Text('Camera not available')),
          ),
        ),
        Expanded(
          flex: 1,
          child: Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Column(
                      children: [
                        const Icon(Icons.photo_camera, color: Colors.blue),
                        Text('${_capturedImages.length}/5'),
                      ],
                    ),
                    Column(
                      children: [
                        Icon(
                          Icons.videocam,
                          color: _recordedVideo != null ? Colors.green : Colors.grey,
                        ),
                        Text(_recordedVideo != null ? 'Recorded' : 'No video'),
                      ],
                    ),
                    Column(
                      children: [
                        Icon(
                          Icons.location_on,
                          color: _currentLocation != null ? Colors.green : Colors.red,
                        ),
                        Text(_currentLocation != null ? 'GPS OK' : 'No GPS'),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_capturedImages.isNotEmpty || _recordedVideo != null)
                  ElevatedButton.icon(
                    onPressed: _uploadCaptures,
                    icon: const Icon(Icons.upload),
                    label: const Text('Upload & Analyze'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      minimumSize: const Size(double.infinity, 48),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          FloatingActionButton(
            heroTag: "photo",
            onPressed: _capturedImages.length < 5 ? _takePicture : null,
            backgroundColor: _capturedImages.length < 5 ? Colors.blue : Colors.grey,
            child: const Icon(Icons.camera_alt),
          ),
          FloatingActionButton(
            heroTag: "video",
            onPressed: _toggleVideoRecording,
            backgroundColor: _isRecording ? Colors.red : Colors.orange,
            child: Icon(_isRecording ? Icons.stop : Icons.videocam),
          ),
        ],
      ),
    );
  }
}
