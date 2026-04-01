import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'dart:io';

class CreateAlertScreen extends StatefulWidget {
  const CreateAlertScreen({super.key});

  @override
  State<CreateAlertScreen> createState() => _CreateAlertScreenState();
}

class _CreateAlertScreenState extends State<CreateAlertScreen> {
  String selectedType = "Robo";

  File? image;
  final picker = ImagePicker();
  bool _isLoadingLocation = true;
  String _locationTitle = "Detectando ubicación...";
  String _locationSubtitle = "Esperando permisos";

  Future pickImage() async {
    final pickedFile = await picker.pickImage(source: ImageSource.camera);

    if (pickedFile != null) {
      setState(() {
        image = File(pickedFile.path);
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
          _locationTitle = "No se pudo detectar ubicación";
          _locationSubtitle = "Permiso de ubicación denegado";
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition();
      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (!mounted) return;
      if (placemarks.isEmpty) {
        setState(() {
          _isLoadingLocation = false;
          _locationTitle = "Ubicación actual detectada";
          _locationSubtitle =
              "${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}";
        });
        return;
      }

      final place = placemarks.first;
      final streetPart = [
        place.street,
        place.subLocality,
      ].where((v) => v != null && v.trim().isNotEmpty).map((v) => v!.trim()).join(", ");
      final cityPart = [
        place.locality,
        place.administrativeArea,
        place.country,
      ].where((v) => v != null && v.trim().isNotEmpty).map((v) => v!.trim()).join(", ");

      setState(() {
        _isLoadingLocation = false;
        _locationTitle =
            streetPart.isNotEmpty ? streetPart : "Ubicación actual detectada";
        _locationSubtitle = cityPart.isNotEmpty
            ? cityPart
            : "${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}";
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoadingLocation = false;
        _locationTitle = "No se pudo detectar ubicación";
        _locationSubtitle = "Activa GPS e inténtalo de nuevo";
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
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                ),
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
                  buildTypeButton("Médica", Colors.blue),
                ],
              ),

              const SizedBox(height: 20),

              const Text("Descripción"),

              const SizedBox(height: 10),

              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: const TextField(
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: "Describe lo que está pasando...",
                    border: InputBorder.none,
                  ),
                ),
              ),

              const SizedBox(height: 20),

              const Text("Ubicación"),

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
                      Icon(Icons.camera_alt),
                      SizedBox(width: 10),
                      Text("Tomar foto"),
                    ],
                  ),
                ),
              ),

              if (image != null)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
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
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text("Alerta creada (modo MVP)"),
                      ),
                    );
                  },
                  child: const Text(
                    "ENVIAR ALERTA",
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ),

              const SizedBox(height: 10),

              const Center(
                child: Text(
                  "Tu alerta será enviada a las autoridades locales",
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