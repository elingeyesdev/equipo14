import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:app_alertas/core/config/api_config.dart';
import 'package:app_alertas/data/models/alert_type.model.dart';
import 'package:app_alertas/data/services/api_service.dart';
import 'package:app_alertas/data/services/alerts_api_service.dart';
import 'package:app_alertas/data/models/alert_model.dart';

class CreateAlertScreen extends StatefulWidget {
  const CreateAlertScreen({super.key, this.onCreated});

  final VoidCallback? onCreated;

  @override
  State<CreateAlertScreen> createState() => _CreateAlertScreenState();
}

class _CreateAlertScreenState extends State<CreateAlertScreen> {
  // --- Tipo de alerta (cargado desde el backend) ---
  List<ReportTypeModel> _alertTypes = [];
  ReportTypeModel? _selectedType;
  bool _isLoadingTypes = true;
  String? _typesError;

  File? image;

  /// URL devuelta por el backend (Cloudinary) tras crear el reporte con foto.
  String? _lastUploadedImageUrl;
  final picker = ImagePicker();
  final _descriptionController = TextEditingController();
  final _service = AlertsApiService();
  final _apiService = ApiService();
  final _random = Random();
  bool _isLoadingLocation = true;
  bool _isSubmitting = false;
  String _locationTitle = 'Detectando ubicación...';
  String _locationSubtitle = 'Esperando permisos';
  Position? _position;

  // ---------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------

  @override
  void initState() {
    super.initState();
    _loadCurrentLocation();
    _loadAlertTypes();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------
  // Carga de tipos de alerta
  // ---------------------------------------------------------------

  Future<void> _loadAlertTypes() async {
    try {
      final types = await _service.getAlertTypes();
      if (!mounted) return;
      setState(() {
        _alertTypes = types;
        _selectedType = types.isNotEmpty ? types.first : null;
        _isLoadingTypes = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingTypes = false;
        _typesError = 'No se pudieron cargar los tipos: $e';
      });
    }
  }

  // ---------------------------------------------------------------
  // Geolocalización
  // ---------------------------------------------------------------

  Future<void> _loadCurrentLocation() async {
    try {
      final hasPermission = await _ensureLocationPermission();
      if (!hasPermission) {
        if (!mounted) return;
        setState(() {
          _isLoadingLocation = false;
          _locationTitle = 'No se pudo detectar ubicación';
          _locationSubtitle = 'Permiso de ubicación denegado';
        });
        return;
      }

      final position = await _getBestPosition();
      _position = position;
      final precise = await _reverseGeocodePrecise(
        position.latitude,
        position.longitude,
      );
      if (precise != null) {
        if (!mounted) return;
        setState(() {
          _isLoadingLocation = false;
          _locationTitle = precise.$1;
          _locationSubtitle = precise.$2;
        });
        return;
      }

      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (!mounted) return;
      if (placemarks.isEmpty) {
        setState(() {
          _isLoadingLocation = false;
          _locationTitle = 'Ubicación actual detectada';
          _locationSubtitle =
              '${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}';
        });
        return;
      }

      final place = _selectMostUsefulPlacemark(placemarks);
      final streetPart = [place.name, place.street, place.subLocality]
          .where((v) => v != null && v.trim().isNotEmpty)
          .map((v) => v!.trim())
          .toSet()
          .join(', ');
      final cityPart =
          [
                place.locality,
                place.subAdministrativeArea,
                place.administrativeArea,
                place.country,
              ]
              .where((v) => v != null && v.trim().isNotEmpty)
              .map((v) => v!.trim())
              .toSet()
              .join(', ');

      setState(() {
        _isLoadingLocation = false;
        _locationTitle = streetPart.isNotEmpty
            ? streetPart
            : 'Ubicación actual detectada';
        _locationSubtitle = cityPart.isNotEmpty
            ? cityPart
            : '${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoadingLocation = false;
        _locationTitle = 'No se pudo detectar ubicación';
        _locationSubtitle = 'Activa GPS e inténtalo de nuevo';
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

  Future<Position> _getBestPosition() async {
    final settings = const LocationSettings(
      accuracy: LocationAccuracy.bestForNavigation,
      distanceFilter: 0,
    );

    final samples = <Position>[];

    // Primera lectura rápida
    try {
      samples.add(
        await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.bestForNavigation,
          timeLimit: const Duration(seconds: 8),
        ),
      );
    } catch (_) {}

    // Recoger más muestras para escoger la de menor error (metros)
    StreamSubscription<Position>? sub;
    try {
      sub = Geolocator.getPositionStream(locationSettings: settings).listen((
        p,
      ) {
        samples.add(p);
        if (samples.length >= 4) {
          sub?.cancel();
        }
      });
      await Future<void>.delayed(const Duration(seconds: 3));
    } finally {
      await sub?.cancel();
    }

    if (samples.isEmpty) {
      return Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
    }

    samples.sort((a, b) => a.accuracy.compareTo(b.accuracy));
    return samples.first;
  }

  Placemark _selectMostUsefulPlacemark(List<Placemark> placemarks) {
    if (placemarks.isEmpty) {
      throw StateError('No hay placemarks');
    }
    placemarks.sort((a, b) {
      final aScore = _placemarkScore(a);
      final bScore = _placemarkScore(b);
      return bScore.compareTo(aScore);
    });
    return placemarks.first;
  }

  int _placemarkScore(Placemark p) {
    var score = 0;
    if ((p.name ?? '').trim().isNotEmpty) score += 3;
    if ((p.street ?? '').trim().isNotEmpty) score += 2;
    if ((p.subLocality ?? '').trim().isNotEmpty) score += 2;
    if ((p.locality ?? '').trim().isNotEmpty) score += 1;
    return score;
  }

  Future<(String, String)?> _reverseGeocodePrecise(
    double lat,
    double lon,
  ) async {
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse'
        '?format=jsonv2&lat=$lat&lon=$lon&zoom=18&addressdetails=1',
      );
      final response = await http.get(
        uri,
        headers: {
          'User-Agent': 'app_alertas/1.0 (mobile reverse geocoding)',
          'Accept': 'application/json',
        },
      );
      if (response.statusCode < 200 || response.statusCode >= 300) return null;
      final data = jsonDecode(response.body);
      if (data is! Map<String, dynamic>) return null;

      final address = data['address'];
      if (address is! Map<String, dynamic>) return null;

      String? pick(List<String> keys) {
        for (final k in keys) {
          final v = address[k];
          if (v != null && '$v'.trim().isNotEmpty) return '$v'.trim();
        }
        return null;
      }

      // Priorizar vía/zona para evitar POIs "famosos" lejanos.
      final title =
          pick([
            'road',
            'pedestrian',
            'residential',
            'neighbourhood',
            'suburb',
            'city_district',
            'quarter',
          ]) ??
          pick([
            'amenity',
            'building',
            'university',
            'college',
            'school',
            'hospital',
          ]) ??
          'Ubicación actual';

      final subtitle = [
        pick(['road']),
        pick(['neighbourhood', 'suburb']),
        pick(['city', 'town', 'village', 'state']),
        pick(['country']),
      ].whereType<String>().where((e) => e.isNotEmpty).toSet().join(', ');

      if (subtitle.isEmpty) {
        return (title, '${lat.toStringAsFixed(5)}, ${lon.toStringAsFixed(5)}');
      }
      return (title, subtitle);
    } catch (_) {
      return null;
    }
  }

  // ---------------------------------------------------------------
  // Imagen
  // ---------------------------------------------------------------

  Future<void> pickImage() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Cámara'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Galería'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;

    final pickedFile = await picker.pickImage(source: source, imageQuality: 85);

    if (pickedFile != null) {
      setState(() {
        image = File(pickedFile.path);
        _lastUploadedImageUrl = null;
      });
    }
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

  // ---------------------------------------------------------------
  // Envío del reporte
  // ---------------------------------------------------------------

  Future<String> _resolveReportUserId() async {
    // 1) Intentar el UUID fijo de configuración.
    try {
      final user = await _apiService.obtenerUsuario(ApiConfig.defaultUserId);
      if (user.id.isNotEmpty) return user.id;
    } catch (_) {}

    // 2) Si ya hay usuarios en backend, reutilizar el primero.
    try {
      final users = await _apiService.obtenerUsuarios();
      if (users.isNotEmpty && users.first.id.isNotEmpty) {
        return users.first.id;
      }
    } catch (_) {}

    // 3) Crear uno nuevo para poder reportar.
    for (var i = 0; i < 10; i++) {
      try {
        final phone = (10000000 + _random.nextInt(90000000)).toString();
        final created = await _apiService.crearUsuario(
          firstName: 'app',
          lastName: 'alertas',
          phone: phone,
          password: 'App2024!',
        );
        if (created.id.isNotEmpty) return created.id;
      } catch (_) {}
    }

    throw Exception('No se pudo resolver/crear un usuario para el reporte.');
  }

  Future<void> _submitAlert() async {
    final description = _descriptionController.text.trim();
    if (description.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Ingresa una descripción')));
      return;
    }

    if (_position == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo obtener tu ubicación')),
      );
      return;
    }

    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona un tipo de alerta')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final similars = await _service.findSimilarAlerts(
        typeId: _selectedType!.id,
        latitude: _position!.latitude,
        longitude: _position!.longitude,
      );

      if (similars.isNotEmpty) {
        if (!mounted) return;
        setState(() => _isSubmitting = false);
        _showSimilarsDialog(similars);
        return;
      }

      await _createActualAlert();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al verificar alertas: $e')),
      );
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _createActualAlert() async {
    setState(() => _isSubmitting = true);
    try {
      final userId = await _resolveReportUserId();
      final report = await _service.createAlert(
        typeId: _selectedType!.id,
        description: _descriptionController.text.trim(),
        user: userId,
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

  void _showSimilarsDialog(List<AlertModel> similars) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          maxChildSize: 0.9,
          minChildSize: 0.4,
          expand: false,
          builder: (_, scrollController) {
            return Column(
              children: [
                const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    'Se encontraron reportes similares',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    itemCount: similars.length,
                    itemBuilder: (context, index) {
                      final alert = similars[index];
                      final coords = alert.coordinates;
                      final lat = coords.length > 1 ? coords[0] : 0;
                      final lon = coords.length > 1 ? coords[1] : 0;
                      final timeStr = alert.createdAt != null 
                          ? '${alert.createdAt!.day}/${alert.createdAt!.month} ${alert.createdAt!.hour}:${alert.createdAt!.minute.toString().padLeft(2, '0')}'
                          : 'Desconocida';

                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        color: const Color(0xFF1E293B),
                        child: ListTile(
                          title: Text(
                            alert.description, 
                            maxLines: 2, 
                            overflow: TextOverflow.ellipsis, 
                            style: const TextStyle(color: Colors.white)
                          ),
                          subtitle: Text(
                            'Hace poco ($timeStr)\nUbicación: ${lat.toStringAsFixed(4)}, ${lon.toStringAsFixed(4)}', 
                            style: const TextStyle(color: Colors.grey)
                          ),
                          trailing: const Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 16),
                          onTap: () {
                            Navigator.pop(ctx);
                            _attachToExistingAlert(alert.id);
                          },
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.red),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        _createActualAlert();
                      },
                      child: const Text('Crear mi propio reporte'),
                    ),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _attachToExistingAlert(int reportId) async {
    if (image == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Te has sumado a la alerta existente.')),
      );
      _descriptionController.clear();
      widget.onCreated?.call();
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await _service.attachImageToReport(reportId, image!);
      _descriptionController.clear();
      setState(() {
        image = null;
        _lastUploadedImageUrl = null;
      });
      widget.onCreated?.call();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Imagen adjuntada al reporte existente exitosamente.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al adjuntar imagen: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  // ---------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Crear alerta',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 5),
            const Text(
              'Reporta una emergencia en tu zona',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 20),
            const Text(
              'Tipo de alerta',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 10),
            // ------ Dropdown de tipos desde el backend ------
            if (_isLoadingTypes)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            else if (_typesError != null)
              Row(
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: Colors.red,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _typesError!,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _isLoadingTypes = true;
                        _typesError = null;
                      });
                      _loadAlertTypes();
                    },
                    child: const Text('Reintentar'),
                  ),
                ],
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<ReportTypeModel>(
                    isExpanded: true,
                    dropdownColor: const Color(0xFF1E293B),
                    value: _selectedType,
                    hint: const Text(
                      'Selecciona un tipo',
                      style: TextStyle(color: Colors.grey),
                    ),
                    icon: const Icon(
                      Icons.keyboard_arrow_down,
                      color: Colors.grey,
                    ),
                    items: _alertTypes.map((type) {
                      return DropdownMenuItem<ReportTypeModel>(
                        value: type,
                        child: Text(
                          type.name,
                          style: const TextStyle(color: Colors.white),
                        ),
                      );
                    }).toList(),
                    onChanged: (ReportTypeModel? value) {
                      setState(() => _selectedType = value);
                    },
                  ),
                ),
              ),

            const SizedBox(height: 20),
            const Text('Descripción'),
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
                  hintText: 'Describe lo que está pasando...',
                  border: InputBorder.none,
                ),
              ),
            ),

            const SizedBox(height: 20),
            const Text('Ubicación'),
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
                    Text('Foto o galería'),
                  ],
                ),
              ),
            ),

            if (image != null)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: GestureDetector(
                  onTap: pickImage, // Permitir cambiar la imagen
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(15),
                    child: Image.file(
                      image!,
                      height: 150,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),

            if (_lastUploadedImageUrl != null) ...[
              const SizedBox(height: 16),
              const Text(
                'Última imagen en el servidor (Cloudinary)',
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
                ),
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
                  _isSubmitting ? 'ENVIANDO...' : 'ENVIAR ALERTA',
                  style: const TextStyle(fontSize: 16),
                ),
              ),
            ),

            const SizedBox(height: 10),
            const Center(
              child: Text(
                'Tu alerta será enviada a las autoridades locales',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
