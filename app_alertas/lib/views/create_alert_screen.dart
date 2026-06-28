import 'package:flutter/material.dart';
import 'package:app_alertas/core/utils/error_handler.dart';
import 'package:app_alertas/views/main_navigation_screen.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'dart:async';
import 'dart:convert';
import 'package:skeletonizer/skeletonizer.dart';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:app_alertas/core/config/mapbox_config.dart';
import 'package:app_alertas/models/alert_type_model.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';

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
  double _aspectRatio = 1.0;

  final picker = ImagePicker();
  final _descriptionController = TextEditingController();

  bool _isLoadingLocation = true;
  bool _isSubmitting = false;
  String _locationTitle = 'Detectando ubicación...';
  String _locationSubtitle = 'Esperando permisos';
  Position? _position;

  // --- Cámara ---
  /// Coordenadas seleccionadas por el usuario en el mapa (puede diferir de _position).
  LatLng? _selectedAlertLocation;

  /// Indica si la ubicación seleccionada está dentro del radio permitido.
  bool _alertLocationInsideRadius = true;

  void resetFields() {
    _descriptionController.clear();
    setState(() {
      _selectedType = null;
      image = null;
      _aspectRatio = 1.0;
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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (image == null) {
        pickImage();
      }
    });
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

  Future<void> pickImage([ImageSource? source]) async {
    source ??= await showModalBottomSheet<ImageSource>(
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

    final pickedFile = await picker.pickImage(
      source: source,
      imageQuality: 85,
      maxWidth: 1280,
      maxHeight: 1280,);

    if (pickedFile != null) {
      final file = File(pickedFile.path);
      _calculateAspectRatio(file);
      setState(() {
        image = file;
      });
    }
  }

  void _calculateAspectRatio(File file) {
    final imageProvider = FileImage(file);
    imageProvider.resolve(const ImageConfiguration()).addListener(
      ImageStreamListener(
        (info, _) {
          if (mounted) {
            setState(() {
              double ratio = info.image.width / info.image.height;
              if (ratio < 0.8) ratio = 0.8; // 4:5 vertical
              if (ratio > 1.91) ratio = 1.91; // 1.91:1 horizontal
              _aspectRatio = ratio;
            });
          }
        },
        onError: (exception, stackTrace) {
          // Fallback remains 1.0
        },
      ),
    );
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ingresa una descripción'),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }

    if (image == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debes adjuntar una imagen del incidente'),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }

    if (_position == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No se pudo obtener tu ubicación'),
          backgroundColor: Color(0xFFB64D4C),
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }

    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Selecciona un tipo de alerta'),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }

    // Validar que la ubicación seleccionada esté dentro del radio permitido
    if (!_alertLocationInsideRadius) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('La ubicación de la alerta debe encontrarse dentro de un radio máximo de 100 metros de su posición actual.'),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final alertVM = context.read<AlertViewModel>();
      // Usar la ubicación seleccionada por el usuario en el mapa
      final alertLat = _selectedAlertLocation?.latitude ?? _position!.latitude;
      final alertLon =
          _selectedAlertLocation?.longitude ?? _position!.longitude;
      final userId = context.read<AuthViewModel>().user!.id;
      
      final similars = await alertVM.findSimilarAlerts(
        typeId: _selectedType!.id,
        latitude: alertLat,
        longitude: alertLon,
        userId: userId,
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
        SnackBar(
          content: Text('Error al verificar alertas: ${parseError(e)}'),
          backgroundColor: const Color(0xFFB64D4C),
          duration: const Duration(seconds: 4),
        ),
      );
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _createActualAlert() async {
    final navigator = Navigator.of(context);
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    setState(() => _isSubmitting = true);
    try {
      final alertVM = context.read<AlertViewModel>();
      final userId = await _resolveReportUserId();
      // Usar las coordenadas seleccionadas por el usuario en el mapa
      final alertLat = _selectedAlertLocation?.latitude ?? _position!.latitude;
      final alertLon =
          _selectedAlertLocation?.longitude ?? _position!.longitude;
      
      final report = await alertVM.createAlert(
        typeId: _selectedType!.id,
        description: _descriptionController.text.trim(),
        userId: userId,
        latitude: alertLat,
        longitude: alertLon,
        zone: _locationTitle,
        imageFile: image,
      ).timeout(const Duration(seconds: 15));

      final url = report.images.isNotEmpty ? report.images.first : null;

      _descriptionController.clear();
      setState(() {
        image = null;
      });
      
      widget.onCreated?.call();
      
      final navContext = MainNavigationScreen.navigationKey.currentContext;
      if (navContext != null && navContext.mounted) {
        ScaffoldMessenger.of(navContext).showSnackBar(
          SnackBar(
            content: Text(url != null
                ? '¡Reporte creado con éxito! Imagen subida.'
                : '¡Reporte creado con éxito!'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 4),
          ),
        );
      }

      MainNavigationScreen.navigationKey.currentState?.selectTab(3);

    } on TimeoutException catch (_) {
      if (navigator.canPop()) {
        navigator.pop();
      }

      final navContext = MainNavigationScreen.navigationKey.currentContext;
      if (navContext != null && navContext.mounted) {
        ScaffoldMessenger.of(navContext).showSnackBar(
          const SnackBar(
            content: Text('La petición está tardando demasiado. El servidor podría estar procesándolo en segundo plano.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 5),
          ),
        );
      }

      MainNavigationScreen.navigationKey.currentState?.selectTab(3);

    } catch (e) {
      if (!mounted) return;
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('Error al crear la alerta: ${parseError(e)}'),
          backgroundColor: const Color(0xFFB64D4C),
          duration: const Duration(seconds: 4),
        ),
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
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
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
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.white24
                          : Colors.black26,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const Icon(
                    Icons.warning_amber_rounded,
                    color: Colors.orange,
                    size: 48,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '¿Es el mismo incidente?',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.onSurface,
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
                                color: Theme.of(context).cardTheme.color,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: Theme.of(context).brightness == Brightness.dark
                                      ? Colors.white.withValues(alpha: 0.05)
                                      : Colors.black.withValues(alpha: 0.05),
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
                                  style: TextStyle(
                                    color: Theme.of(context).colorScheme.onSurface,
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
                                    isExpanded
                                        ? Icons.keyboard_arrow_up
                                        : Icons.keyboard_arrow_down,
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
                            if (isExpanded) ...[
                              Container(
                                height: 160,
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                clipBehavior: Clip.hardEdge,
                                child: _buildMiniMap(alert),
                              ),
                              if (alert.images.isNotEmpty)
                                Container(
                                  height: 100,
                                  margin: const EdgeInsets.only(bottom: 12),
                                  child: ListView.builder(
                                    scrollDirection: Axis.horizontal,
                                    itemCount: alert.images.length,
                                    itemBuilder: (context, imgIndex) {
                                      return Container(
                                        width: 100,
                                        margin: const EdgeInsets.only(right: 8),
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: Theme.of(context).brightness == Brightness.dark
                                                ? Colors.white.withValues(alpha: 0.1)
                                                : Colors.black.withValues(alpha: 0.1),
                                          ),
                                        ),
                                        clipBehavior: Clip.hardEdge,
                                        child: Image.network(
                                          alert.images[imgIndex],
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) => Container(
                                            color: Colors.white.withValues(alpha: 0.05),
                                            child: const Icon(Icons.broken_image, color: Colors.grey),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                            ],
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
                        foregroundColor: Theme.of(context).brightness == Brightness.dark
                            ? Colors.white70
                            : Colors.black87,
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
      return Center(
        child: Text(
          'Ubicación no disponible',
          style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
        ),
      );
    }

    final userLocation = LatLng(_position!.latitude, _position!.longitude);
    final alertLocation = LatLng(alert.coordinates[1], alert.coordinates[0]);

    return FlutterMap(
      options: MapOptions(
        initialCenter: alertLocation,
        initialZoom: 16.0,
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.none,
        ),
      ),
      children: [
        MapboxConfig.tileLayer(context),
        MarkerLayer(
          markers: [
            Marker(
              point: userLocation,
              width: 30,
              height: 30,
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFAF6D58),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: const Icon(
                  Icons.my_location_rounded,
                  color: Colors.white,
                  size: 14,
                ),
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
                child: const Icon(
                  Icons.warning_rounded,
                  color: Colors.white,
                  size: 14,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _attachToExistingAlert(int reportId) async {
    final navigator = Navigator.of(context);
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    if (image == null) {
      scaffoldMessenger.showSnackBar(
        const SnackBar(
          content: Text('Te has sumado a la alerta existente.'),
          backgroundColor: Color(0xFF506E96),
          duration: Duration(seconds: 4),
        ),
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
      ).timeout(const Duration(seconds: 15));
      _descriptionController.clear();
      setState(() {
        image = null;
      });
      widget.onCreated?.call();
      
      final navContext = MainNavigationScreen.navigationKey.currentContext;
      if (navContext != null && navContext.mounted) {
        ScaffoldMessenger.of(navContext).showSnackBar(
          const SnackBar(
            content: Text('Has aportado una imagen a la alerta existente exitosamente.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 4),
          ),
        );
      }
    } on TimeoutException catch (_) {
      if (navigator.canPop()) {
        navigator.pop();
      }
      final navContext = MainNavigationScreen.navigationKey.currentContext;
      if (navContext != null && navContext.mounted) {
        ScaffoldMessenger.of(navContext).showSnackBar(
          const SnackBar(
            content: Text('La petición está tardando demasiado. El servidor podría estar procesándolo en segundo plano.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 5),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('Error al verificar: ${parseError(e)}'),
          backgroundColor: const Color(0xFFB64D4C),
          duration: const Duration(seconds: 4),
        ),
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
    return _buildFormView(context);
  }

  Widget _buildFormView(BuildContext context) {
    final alertTypeVM = context.watch<AlertTypeViewModel>();
    final alertTypes = alertTypeVM.alertTypes;
    final isLoadingTypes = alertTypeVM.isLoading;
    final typesError = alertTypeVM.error;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 2, 24, 0),
                child: Row(
                  children: [
                    IconButton(
                      icon: Icon(Icons.arrow_back, color: Theme.of(context).colorScheme.onSurface),
                      onPressed: () {
                        if (Navigator.of(context).canPop()) {
                          Navigator.of(context).pop();
                        }
                      },
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "Nueva alerta",
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.normal,
                        letterSpacing: -0.3,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              if (image != null)
                GestureDetector(
                  onTap: pickImage,
                  child: AspectRatio(
                    aspectRatio: _aspectRatio,
                    child: Container(
                      width: double.infinity,
                      color: Colors.black, // Fondo negro para bordes vacíos
                      child: Image.file(
                        image!,
                        width: double.infinity,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                )
              else
                GestureDetector(
                  onTap: pickImage,
                  child: Container(
                    width: double.infinity,
                    height: MediaQuery.of(context).size.width,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFF2C2C2A)
                        : const Color(0xFFEEEEEE),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.photo_library,
                          size: 40,
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.white54
                              : Colors.black54,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Cargar imagen',
                          style: TextStyle(
                            color: Theme.of(context).brightness == Brightness.dark
                                ? Colors.white54
                                : Colors.black54,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),

                    TextField(
                      controller: _descriptionController,
                      maxLines: null,
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 16),
                      decoration: InputDecoration(
                        hintText: 'Agregar una descripcion...',
                        filled: false,
                        fillColor: Colors.transparent,
                        hintStyle: TextStyle(
                          fontSize: 16,
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                        border: InputBorder.none,
                      ),
                    ),

                    if (typesError != null)
                      Text(
                        typesError,
                        style: const TextStyle(color: Colors.red),
                      )
                    else
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16.0),
                        child: Skeletonizer(
                          enabled: isLoadingTypes,
                          effect: ShimmerEffect(
                            baseColor: Theme.of(context).brightness == Brightness.dark
                                ? const Color(0xFF2C2C2A)
                                : const Color(0xFFE0E0E0),
                            highlightColor: Theme.of(context).brightness == Brightness.dark
                                ? const Color(0xFF30302E)
                                : const Color(0xFFF5F5F5),
                          ),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            decoration: BoxDecoration(
                              border: Border.all(color: const Color(0xFFAF6D58)),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<AlertTypeModel>(
                                isExpanded: true,
                                hint: Text(
                                  isLoadingTypes ? 'Cargando tipos...' : 'Tipo de incidente',
                                  style: TextStyle(color: Theme.of(context).hintColor),
                                ),
                                dropdownColor: Theme.of(context).cardTheme.color,
                                value: _selectedType,
                                icon: const Icon(
                                  Icons.keyboard_arrow_down,
                                  color: Colors.grey,
                                ),
                                items: alertTypes.isEmpty
                                    ? [
                                        DropdownMenuItem<AlertTypeModel>(
                                          value: null,
                                          child: Text(
                                            'Cargando...',
                                            style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                                          ),
                                        )
                                      ]
                                    : alertTypes.map((type) {
                                        return DropdownMenuItem<AlertTypeModel>(
                                          value: type,
                                          child: Text(
                                            type.name,
                                            style: TextStyle(
                                              color: Theme.of(context).colorScheme.onSurface,
                                              fontSize: 16,
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                onChanged: (AlertTypeModel? value) {
                                  setState(() => _selectedType = value);
                                },
                              ),
                            ),
                          ),
                        ),
                      ),

                    Skeletonizer(
                      enabled: _isLoadingLocation,
                      effect: ShimmerEffect(
                        baseColor: Theme.of(context).brightness == Brightness.dark
                            ? const Color(0xFF2C2C2A)
                            : const Color(0xFFE0E0E0),
                        highlightColor: Theme.of(context).brightness == Brightness.dark
                            ? const Color(0xFF30302E)
                            : const Color(0xFFF5F5F5),
                      ),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF30302E)
                              : const Color(0xFFF1F1F1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.my_location_rounded,
                              color: Color(0xFFAF6D58),
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _isLoadingLocation ? 'Obteniendo ubicación...' : _locationTitle,
                                    style: TextStyle(
                                      color: Theme.of(context).colorScheme.onSurface,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  Text(
                                    _isLoadingLocation ? 'Por favor espere...' : _locationSubtitle,
                                    style: TextStyle(
                                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),

                    if (_position != null && _selectedAlertLocation != null)
                      LocationPickerMap(
                        userLocation: LatLng(
                          _position!.latitude,
                          _position!.longitude,
                        ),
                        alertType: _selectedType?.name,
                        onLocationChanged: (selected, isInside) async {
                          setState(() {
                            _selectedAlertLocation = selected;
                            _alertLocationInsideRadius = isInside;
                          });

                          try {
                            final precise = await _reverseGeocodePrecise(
                              selected.latitude,
                              selected.longitude,
                            );
                            if (precise != null) {
                              if (!mounted) return;
                              setState(() {
                                _locationTitle = precise.$1;
                                _locationSubtitle = precise.$2;
                              });
                              return;
                            }

                            final placemarks = await placemarkFromCoordinates(
                              selected.latitude,
                              selected.longitude,
                            );
                            if (placemarks.isNotEmpty && mounted) {
                              final place = _selectMostUsefulPlacemark(placemarks);
                              final streetPart = [place.name, place.street, place.subLocality]
                                  .where((v) => v != null && v.trim().isNotEmpty)
                                  .map((v) => v!.trim())
                                  .toSet()
                                  .join(', ');
                              final cityPart = [
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
                                _locationTitle = streetPart.isNotEmpty
                                    ? streetPart
                                    : 'Ubicación seleccionada';
                                _locationSubtitle = cityPart.isNotEmpty
                                    ? cityPart
                                    : '${selected.latitude.toStringAsFixed(5)}, ${selected.longitude.toStringAsFixed(5)}';
                              });
                            }
                          } catch (_) {
                            if (mounted) {
                              setState(() {
                                _locationTitle = 'Ubicación seleccionada';
                                _locationSubtitle =
                                    '${selected.latitude.toStringAsFixed(5)}, ${selected.longitude.toStringAsFixed(5)}';
                              });
                            }
                          }
                        },
                      )
                    else if (_isLoadingLocation)
                      Skeletonizer(
                        enabled: true,
                        effect: ShimmerEffect(
                          baseColor: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF2C2C2A)
                              : const Color(0xFFE0E0E0),
                          highlightColor: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF30302E)
                              : const Color(0xFFF5F5F5),
                        ),
                        child: Container(
                          height: 240,
                          decoration: BoxDecoration(
                            color: Theme.of(context).brightness == Brightness.dark
                                ? const Color(0xFF30302E)
                                : const Color(0xFFF1F1F1),
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      )
                    else
                      Container(
                        height: 80,
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF30302E)
                              : const Color(0xFFF1F1F1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Center(
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.location_off_rounded,
                                color: Colors.orangeAccent,
                                size: 20,
                              ),
                              SizedBox(width: 8),
                              Text(
                                'No se pudo obtener la ubicación GPS',
                                style: TextStyle(
                                  color: Colors.orangeAccent,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                    if (!_alertLocationInsideRadius) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Color(0xFFB64D4C),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.warning_rounded,
                              color: Color.fromARGB(255, 255, 255, 255),
                              size: 18,
                            ),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'La ubicación de la alerta debe encontrarse dentro de un radio máximo de 100 metros de su posición actual.',
                                style: TextStyle(
                                  color: Color.fromARGB(255, 255, 255, 255),
                                  fontSize: 12.5,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFAF6D58),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                        onPressed: _isSubmitting ? null : _submitAlert,
                        child: Text(
                          _isSubmitting ? 'ENVIANDO...' : 'Enviar alerta',
                          style: const TextStyle(
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
