import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:flutter_map/flutter_map.dart';

import 'package:app_alertas/models/alert_type_model.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/views/widgets/custom_snackbar.dart';
import 'package:app_alertas/viewmodels/alert_type_viewmodel.dart';
import 'package:app_alertas/views/widgets/location_picker_map.dart';

class CreateAlertScreen extends StatefulWidget {
  const CreateAlertScreen({super.key, this.onCreated, this.onShowMap});

  final VoidCallback? onCreated;
  final Function(AlertModel)? onShowMap;

  @override
  State<CreateAlertScreen> createState() => CreateAlertScreenState();
}

class CreateAlertScreenState extends State<CreateAlertScreen> {
  // --- Tipo de alerta (cargado desde el backend) ---
  AlertTypeModel? _selectedType;

  File? image;

  /// URL devuelta por el backend (Cloudinary) tras crear el reporte con foto.
  String? _lastUploadedImageUrl;
  final picker = ImagePicker();
  final _descriptionController = TextEditingController();

  bool _isLoadingLocation = true;
  bool _isSubmitting = false;
  String _locationTitle = 'Detectando ubicación...';
  String _locationSubtitle = 'Esperando permisos';
  Position? _position;

  /// Coordenadas seleccionadas por el usuario en el mapa (puede diferir de _position).
  LatLng? _selectedAlertLocation;
  /// Indica si la ubicación seleccionada está dentro del radio permitido.
  bool _alertLocationInsideRadius = true;

  void resetFields() {
    _descriptionController.clear();
    setState(() {
      _selectedType = null;
      image = null;
      _lastUploadedImageUrl = null;
      _isSubmitting = false;
      _isLoadingLocation = true;
      _locationTitle = 'Detectando ubicación...';
      _locationSubtitle = 'Esperando permisos';
      _position = null;
      _selectedAlertLocation = null;
      _alertLocationInsideRadius = true;
    });
    _loadCurrentLocation();
  }

  // ---------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------

  @override
  void initState() {
    super.initState();
    _loadCurrentLocation();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
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
      // Inicializar la ubicación seleccionada con la posición actual del usuario
      if (!mounted) return;
      setState(() {
        _selectedAlertLocation = LatLng(position.latitude, position.longitude);
        _alertLocationInsideRadius = true;
      });
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

  // ---------------------------------------------------------------
  // Envío del reporte
  // ---------------------------------------------------------------

  Future<String> _resolveReportUserId() async {
    final user = context.read<AuthViewModel>().user;
    if (user != null && user.id.isNotEmpty) {
      return user.id;
    }
    throw Exception('Debes iniciar sesión para crear un reporte.');
  }

  Future<void> _submitAlert() async {
    final description = _descriptionController.text.trim();
    if (description.isEmpty) {
      showCustomSnackBar(
        context: context,
        title: 'Falta información',
        message: 'Ingresa una descripción',
        type: CustomSnackBarType.warning,
      );
      return;
    }

    if (image == null) {
      showCustomSnackBar(
        context: context,
        title: 'Falta imagen',
        message: 'Debes adjuntar una imagen del incidente',
        type: CustomSnackBarType.warning,
      );
      return;
    }

    if (_position == null) {
      showCustomSnackBar(
        context: context,
        title: 'Error de Ubicación',
        message: 'No se pudo obtener tu ubicación',
        type: CustomSnackBarType.error,
      );
      return;
    }

    if (_selectedType == null) {
      showCustomSnackBar(
        context: context,
        title: 'Falta información',
        message: 'Selecciona un tipo de alerta',
        type: CustomSnackBarType.warning,
      );
      return;
    }

    // Validar que la ubicación seleccionada esté dentro del radio permitido
    if (!_alertLocationInsideRadius) {
      showCustomSnackBar(
        context: context,
        title: 'Ubicación fuera de rango',
        message:
            'La ubicación de la alerta debe encontrarse dentro de un radio máximo de 100 metros de su posición actual.',
        type: CustomSnackBarType.warning,
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final alertVM = context.read<AlertViewModel>();
      // Usar la ubicación seleccionada por el usuario en el mapa
      final alertLat = _selectedAlertLocation?.latitude ?? _position!.latitude;
      final alertLon = _selectedAlertLocation?.longitude ?? _position!.longitude;
      final similars = await alertVM.findSimilarAlerts(
        typeId: _selectedType!.id,
        latitude: alertLat,
        longitude: alertLon,
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
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error al verificar alertas: $e')));
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _createActualAlert() async {
    setState(() => _isSubmitting = true);
    try {
      final alertVM = context.read<AlertViewModel>();
      final userId = await _resolveReportUserId();
      // Usar las coordenadas seleccionadas por el usuario en el mapa
      final alertLat = _selectedAlertLocation?.latitude ?? _position!.latitude;
      final alertLon = _selectedAlertLocation?.longitude ?? _position!.longitude;
      final report = await alertVM.createAlert(
        typeId: _selectedType!.id,
        description: _descriptionController.text.trim(),
        userId: userId,
        latitude: alertLat,
        longitude: alertLon,
        zone: _locationTitle,
        imageFile: image,
      );

      final url = report.images.isNotEmpty ? report.images.first : null;

      _descriptionController.clear();
      setState(() {
        image = null;
        _lastUploadedImageUrl = url;
      });
      widget.onCreated?.call();
      if (!mounted) return;
      showCustomSnackBar(
        context: context,
        title: 'Éxito',
        message: url != null
            ? 'Alerta creada. Imagen en Cloudinary.'
            : 'Alerta creada (sin foto: no hay URL remota).',
        type: CustomSnackBarType.success,
      );
    } catch (e) {
      if (!mounted) return;
      showCustomSnackBar(
        context: context,
        title: 'Error al Reportar',
        message: 'No se pudo crear la alerta: $e',
        type: CustomSnackBarType.error,
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _showSimilarsDialog(List<AlertModel> similars) {
    int? expandedAlertId;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF0D1015),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Icon(
                Icons.warning_amber_rounded,
                color: Colors.orange,
                size: 48,
              ),
              const SizedBox(height: 16),
              const Text(
                '¿Es el mismo incidente?',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Se encontraron reportes recientes muy cerca de tu ubicación. Puedes sumarte a uno existente o crear uno nuevo.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 14),
              ),
              const SizedBox(height: 24),
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.6,
                ),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: similars.length,
                  itemBuilder: (context, index) {
                    final alert = similars[index];
                    final isExpanded = expandedAlertId == alert.id;
                    return Column(
                      children: [
                        Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF26292E),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.05),
                            ),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(12),
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.orange.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.emergency_share_rounded,
                                color: Colors.orange,
                                size: 20,
                              ),
                            ),
                            title: Text(
                              alert.description,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            subtitle: Text(
                              alert.zone ?? 'Zona cercana',
                              style: const TextStyle(
                                color: Colors.grey,
                                fontSize: 12,
                              ),
                            ),
                            trailing: IconButton(
                              icon: Icon(
                                isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                color: Colors.blueAccent,
                              ),
                              onPressed: () {
                                setModalState(() {
                                  if (isExpanded) {
                                    expandedAlertId = null;
                                  } else {
                                    expandedAlertId = alert.id;
                                  }
                                });
                              },
                            ),
                            onTap: () {
                              Navigator.pop(ctx);
                              _attachToExistingAlert(alert.id);
                            },
                          ),
                        ),
                        if (isExpanded)
                          Container(
                            height: 160,
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            clipBehavior: Clip.hardEdge,
                            child: _buildMiniMap(alert),
                          ),
                      ],
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _createActualAlert();
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white70,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('No es ninguno de estos, crear nuevo'),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
          },
        );
      },
    );
  }

  Widget _buildMiniMap(AlertModel alert) {
    if (_position == null || alert.coordinates.length < 2) {
      return const Center(child: Text('Ubicación no disponible', style: TextStyle(color: Colors.white)));
    }
    
    final userLocation = LatLng(_position!.latitude, _position!.longitude);
    final alertLocation = LatLng(alert.coordinates[1], alert.coordinates[0]);

    return FlutterMap(
      options: MapOptions(
        initialCenter: alertLocation,
        initialZoom: 16.0,
        interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}'
              '?access_token=pk.eyJ1IjoiZWxvam9zZGVhcnJveiIsImEiOiJjbW5lbjNoZm4wMTRoMnNxM2RuZG1jdm9uIn0.nErIU6_OLUsQyg77y6geKA',
          userAgentPackageName: 'com.tuempresa.appalertas.app_alertas',
        ),
        MarkerLayer(
          markers: [
            Marker(
              point: userLocation,
              width: 30,
              height: 30,
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: const Icon(Icons.my_location_rounded, color: Colors.white, size: 14),
              ),
            ),
            Marker(
              point: alertLocation,
              width: 30,
              height: 30,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.orange,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: const Icon(Icons.warning_rounded, color: Colors.white, size: 14),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _attachToExistingAlert(int reportId) async {
    if (image == null) {
      showCustomSnackBar(
        context: context,
        title: 'Reporte Existente',
        message: 'Te has sumado a la alerta existente.',
        type: CustomSnackBarType.info,
      );
      _descriptionController.clear();
      widget.onCreated?.call();
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final alertVM = context.read<AlertViewModel>();
      final userId = await _resolveReportUserId();
      await alertVM.attachImageToReport(
        reportId: reportId,
        userId: userId,
        imageFile: image!,
      );
      _descriptionController.clear();
      setState(() {
        image = null;
        _lastUploadedImageUrl = null;
      });
      widget.onCreated?.call();
      if (!mounted) return;
      showCustomSnackBar(
        context: context,
        title: 'Éxito',
        message: 'Has aportado una imagen a la alerta existente exitosamente.',
        type: CustomSnackBarType.success,
      );
    } catch (e) {
      if (!mounted) return;
      showCustomSnackBar(
        context: context,
        title: 'Error de Aportación',
        message: 'Error al verificar: $e',
        type: CustomSnackBarType.error,
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
    final alertTypeVM = context.watch<AlertTypeViewModel>();
    final alertTypes = alertTypeVM.alertTypes;
    final isLoadingTypes = alertTypeVM.isLoading;
    final typesError = alertTypeVM.error;

    if (_selectedType == null && alertTypes.isNotEmpty) {
      _selectedType = alertTypes.first;
    }

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),

              const Text(
                'Crear Alerta',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.normal,
                  letterSpacing: -0.3,
                  color: Colors.white,
                ),
              ),

              const SizedBox(height: 12),

              const Text(
                'Tipo de alerta',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),

              const SizedBox(height: 10),

              if (isLoadingTypes)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              else if (typesError != null)
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
                        typesError,
                        style: const TextStyle(color: Colors.red, fontSize: 12),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        alertTypeVM.fetchAlertTypes();
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
                    color: const Color(0xFF26292E),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<AlertTypeModel>(
                      isExpanded: true,
                      dropdownColor: const Color(0xFF26292E),
                      value: _selectedType,
                      hint: const Text(
                        'Selecciona un tipo',
                        style: TextStyle(color: Colors.grey),
                      ),
                      icon: const Icon(
                        Icons.keyboard_arrow_down,
                        color: Colors.grey,
                      ),
                      items: alertTypes.map((type) {
                        return DropdownMenuItem<AlertTypeModel>(
                          value: type,
                          child: Text(
                            type.name,
                            style: const TextStyle(color: Colors.white),
                          ),
                        );
                      }).toList(),
                      onChanged: (AlertTypeModel? value) {
                        setState(() => _selectedType = value);
                      },
                    ),
                  ),
                ),

              const SizedBox(height: 20),

              const Text(
                'Descripción',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),

              const SizedBox(height: 10),

              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF26292E),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: TextField(
                  controller: _descriptionController,
                  maxLines: 4,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Describe lo que está pasando...',
                    hintStyle: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3),
                    ),
                    border: InputBorder.none,
                  ),
                ),
              ),

              const SizedBox(height: 20),

              const Text(
                'Ubicación del incidente',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),

              const SizedBox(height: 6),

              // Dirección detectada del usuario
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF26292E),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.my_location_rounded, color: Color(0xFF3B82F6), size: 20),
                    const SizedBox(width: 10),

                    if (_isLoadingLocation)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),

                    if (_isLoadingLocation) const SizedBox(width: 8),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _locationTitle,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            _locationSubtitle,
                            style: const TextStyle(color: Colors.grey, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 10),

              // Mapa interactivo de selección de ubicación
              if (_position != null && _selectedAlertLocation != null)
                LocationPickerMap(
                  userLocation: LatLng(_position!.latitude, _position!.longitude),
                  onLocationChanged: (selected, isInside) {
                    setState(() {
                      _selectedAlertLocation = selected;
                      _alertLocationInsideRadius = isInside;
                    });
                  },
                )
              else if (_isLoadingLocation)
                Container(
                  height: 240,
                  decoration: BoxDecoration(
                    color: const Color(0xFF26292E),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(strokeWidth: 2),
                        SizedBox(height: 12),
                        Text(
                          'Obteniendo ubicación...',
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Container(
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFF26292E),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.location_off_rounded, color: Colors.orangeAccent, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'No se pudo obtener la ubicación GPS',
                          style: TextStyle(color: Colors.orangeAccent, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),

              // Advertencia cuando el punto seleccionado está fuera del radio
              if (!_alertLocationInsideRadius) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: Colors.redAccent.withValues(alpha: 0.4),
                    ),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.warning_rounded, color: Colors.redAccent, size: 18),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'La ubicación de la alerta debe encontrarse dentro de un radio máximo de 100 metros de su posición actual.',
                          style: TextStyle(
                            color: Colors.redAccent,
                            fontSize: 12.5,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 15),

              GestureDetector(
                onTap: pickImage,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF26292E),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.add_a_photo, color: Colors.white),
                      SizedBox(width: 10),
                      Text(
                        'Foto o galería',
                        style: TextStyle(color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),

              if (image != null)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: GestureDetector(
                    onTap: pickImage,
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
                  'Última imagen en el servidor',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
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
                    foregroundColor: Colors.white,
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

              Center(
                child: Text(
                  'Tu alerta será enviada a las autoridades locales',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.4),
                  ),
                ),
              ),

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}



