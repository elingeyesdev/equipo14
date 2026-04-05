import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'dart:io';
import 'package:app_alertas/core/config/api_config.dart';
import 'package:app_alertas/data/services/alerts_api_service.dart';

class CreateAlertScreen extends StatefulWidget {
  const CreateAlertScreen({super.key, this.onCreated});

  final VoidCallback? onCreated;

  @override
  State<CreateAlertScreen> createState() => _CreateAlertScreenState();
}

class _CreateAlertScreenState extends State<CreateAlertScreen> {
  String selectedType = "Robo";

  File? image;
  /// URL devuelta por el backend (Cloudinary) tras crear el reporte con foto.
  String? _lastUploadedImageUrl;
  final picker = ImagePicker();
  final _descriptionController = TextEditingController();
  final _service = AlertsApiService();
  bool _isLoadingLocation = true;
  bool _isSubmitting = false;
  String _locationTitle = "Detectando ubicaci?n...";
  String _locationSubtitle = "Esperando permisos";
  Position? _position;

  Future<void> pickImage() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('C?mara'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Galer?a'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;

    final pickedFile = await picker.pickImage(
      source: source,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      setState(() {
        image = File(pickedFile.path);
        _lastUploadedImageUrl = null;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _loadCurrentLocation();
  }

  Future<void> _loadCurrentLocation() async {
    try {
      final hasPermission = await _ensureLocationPermission();
      if (!hasPermission) {
        if (!mounted) return;
        setState(() {
          _isLoadingLocation = false;
          _locationTitle = "No se pudo detectar ubicaci?n";
          _locationSubtitle = "Permiso de ubicaci?n denegado";
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition();
      _position = position;
      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (!mounted) return;
      if (placemarks.isEmpty) {
        setState(() {
          _isLoadingLocation = false;
          _locationTitle = "Ubicaci?n actual detectada";
          _locationSubtitle =
              "${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}";
        });
        return;
      }

      final place = placemarks.first;
      final streetPart = [place.street, place.subLocality]
          .where((v) => v != null && v.trim().isNotEmpty)
          .map((v) => v!.trim())
          .join(", ");
      final cityPart = [place.locality, place.administrativeArea, place.country]
          .where((v) => v != null && v.trim().isNotEmpty)
          .map((v) => v!.trim())
          .join(", ");

      setState(() {
        _isLoadingLocation = false;
        _locationTitle = streetPart.isNotEmpty
            ? streetPart
            : "Ubicaci?n actual detectada";
        _locationSubtitle = cityPart.isNotEmpty
            ? cityPart
            : "${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}";
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoadingLocation = false;
        _locationTitle = "No se pudo detectar ubicaci?n";
        _locationSubtitle = "Activa GPS e int?ntalo de nuevo";
      });
    }
  }

  Future<bool> _ensureLocationPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  void _openImageFullscreen(File file) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (ctx) => Scaffold(
          backgroundColor: Colors.black,
          body: Stack(
            fit: StackFit.expand,
            children: [
              Center(
                child: InteractiveViewer(
                  minScale: 0.5,
                  maxScale: 4,
                  child: Image.file(file, fit: BoxFit.contain),
                ),
              ),
              SafeArea(
                child: Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    icon: const Icon(
                      Icons.close,
                      color: Colors.white,
                      size: 28,
                    ),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submitAlert() async {
    final description = _descriptionController.text.trim();
    if (description.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Ingresa una descripci?n')));
      return;
    }

    if (_position == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo obtener tu ubicaci?n')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final report = await _service.createAlert(
        type: _mapTypeToBackend(selectedType),
        description: description,
        user: ApiConfig.defaultUserId,
        latitude: _position!.latitude,
        longitude: _position!.longitude,
        imageFile: image,
      );

      final url = report.images.isNotEmpty ? report.images.first.url : null;

      _descriptionController.clear();
      setState(() {
        image = null;
        _lastUploadedImageUrl = url;
      });
      widget.onCreated?.call();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            url != null
                ? 'Alerta creada. Imagen en Cloudinary.'
                : 'Alerta creada (sin foto: no hay URL remota).',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('No se pudo crear la alerta: $e')));
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String _mapTypeToBackend(String type) {
    switch (type) {
      case "Robo":
        return "robo";
      case "Incendio":
        return "incendio";
      case "Accidente":
        return "accidente";
      default:
        return "robo";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Crear alerta",
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
                ),

                const SizedBox(height: 5),

                const Text(
                  "Reporta una emergencia en tu zona",
                  style: TextStyle(color: Colors.grey),
                ),

                const SizedBox(height: 20),

                const Text("Tipo de alerta"),

                const SizedBox(height: 10),

                Row(
                  children: [
                    buildTypeButton("Robo", Colors.red),
                    const SizedBox(width: 10),
                    buildTypeButton("Incendio", Colors.orange),
                    const SizedBox(width: 10),
                    buildTypeButton("Accidente", Colors.blue),
                  ],
                ),

                const SizedBox(height: 20),

                const Text("Descripci?n"),

                const SizedBox(height: 10),

                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: TextField(
                    controller: _descriptionController,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      hintText: "Describe lo que est? pasando...",
                      border: InputBorder.none,
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                const Text("Ubicaci?n"),

                const SizedBox(height: 10),

                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.red),
                      const SizedBox(width: 10),
                      if (_isLoadingLocation)
                        const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      if (_isLoadingLocation) const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_locationTitle),
                            Text(
                              _locationSubtitle,
                              style: const TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 15),

                GestureDetector(
                  onTap: pickImage,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.add_a_photo),
                        SizedBox(width: 10),
                        Text("Foto o galer?a"),
                      ],
                    ),
                  ),
                ),

                if (image != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: GestureDetector(
                      onTap: () => _openImageFullscreen(image!),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(15),
                        child: Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            Image.file(
                              image!,
                              height: 150,
                              width: double.infinity,
                              fit: BoxFit.cover,
                            ),
                            Padding(
                              padding: const EdgeInsets.all(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.black54,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.fullscreen,
                                      color: Colors.white,
                                      size: 16,
                                    ),
                                    SizedBox(width: 4),
                                    Text(
                                      'Ver',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                if (_lastUploadedImageUrl != null) ...[
                  const SizedBox(height: 16),
                  const Text(
                    '?ltima imagen en el servidor (Cloudinary)',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      _lastUploadedImageUrl!,
                      height: 160,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      loadingBuilder: (context, child, progress) {
                        if (progress == null) return child;
                        return const SizedBox(
                          height: 160,
                          child: Center(child: CircularProgressIndicator()),
                        );
                      },
                      errorBuilder: (context, error, stackTrace) => const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('No se pudo cargar la imagen desde la URL'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SelectableText(
                    _lastUploadedImageUrl!,
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],

                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                    onPressed: _isSubmitting ? null : _submitAlert,
                    child: Text(
                      _isSubmitting ? "ENVIANDO..." : "ENVIAR ALERTA",
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                const Center(
                  child: Text(
                    "Tu alerta ser? enviada a las autoridades locales",
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget buildTypeButton(String text, Color color) {
    bool isSelected = selectedType == text;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            selectedType = text;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? color : const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              text,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
