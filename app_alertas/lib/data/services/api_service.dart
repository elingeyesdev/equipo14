import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'package:app_alertas/core/config/api_config.dart';
import 'package:app_alertas/data/models/alert_type.model.dart';
import 'package:app_alertas/data/models/image_model.dart';
import 'package:app_alertas/data/models/report_model.dart';
import 'package:app_alertas/data/models/user_model.dart';

/// Cliente HTTP alineado con los controladores existentes:
/// - `UsersController` → `/users`
/// - `ReportsController` → `/reports`
/// - `ImagesController` → sin rutas REST (las imágenes se crean con el POST de reportes).
class ApiService {
  ApiService({String? baseUrl}) : _base = baseUrl ?? ApiConfig.baseUrl;

  final String _base;
  static const Map<String, String> _tunnelHeaders = {
    // Dev Tunnels: evita la página de advertencia en clientes no-browser.
    'x-tunnel-skip-warning': 'true',
    // Compatibilidad extra (otros túneles tipo ngrok).
    'ngrok-skip-browser-warning': 'true',
  };

  Uri _uri(String path, [String? id]) {
    final p = id == null ? path : '$path/$id';
    return Uri.parse('$_base$p');
  }

  Map<String, String> get tunnelHeaders => _tunnelHeaders;

  // --- Auth ---

  Future<Map<String, dynamic>> login({
    required String phone,
    required String password,
  }) async {
    final response = await http.post(
      _uri('${ApiConfig.authPath}/login'),
      headers: {'Content-Type': 'application/json', ..._tunnelHeaders},
      body: jsonEncode({'phone': phone, 'password': password}),
    );
    _ensureOk(response);
    return _decodeJsonMap(response.body);
  }

  Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
    required int roleId,
  }) async {
    final response = await http.post(
      _uri('${ApiConfig.authPath}/register'),
      headers: {'Content-Type': 'application/json', ..._tunnelHeaders},
      body: jsonEncode({
        'first_name': firstName,
        'last_name': lastName,
        'phone': phone,
        'password': password,
        'roleId': roleId,
      }),
    );
    _ensureOk(response);
    return _decodeJsonMap(response.body);
  }

  Future<List<Map<String, dynamic>>> obtenerRoles() async {
    final response = await http.get(
      _uri(ApiConfig.rolesPath),
      headers: _tunnelHeaders,
    );
    _ensureOk(response);
    final body = jsonDecode(response.body);
    if (body is! List) return [];
    return body.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList();
  }

  // --- Usuarios (GET/POST /users, GET/PATCH/DELETE /users/:id) ---

  Future<List<UserModel>> obtenerUsuarios() async {
    final response = await http.get(
      _uri(ApiConfig.usersPath),
      headers: _tunnelHeaders,
    );
    _ensureOk(response);
    final body = jsonDecode(response.body);
    if (body is! List) return [];
    return body
        .map((e) => UserModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<UserModel> obtenerUsuario(String id) async {
    final response = await http.get(
      _uri(ApiConfig.usersPath, id),
      headers: _tunnelHeaders,
    );
    _ensureOk(response);
    return UserModel.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<UserModel> crearUsuario({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
  }) async {
    final response = await http.post(
      _uri(ApiConfig.usersPath),
      headers: {'Content-Type': 'application/json', ..._tunnelHeaders},
      body: jsonEncode({
        'first_name': firstName,
        'last_name': lastName,
        'phone': phone,
        'password': password,
      }),
    );
    _ensureOk(response);
    return UserModel.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<UserModel> actualizarUsuario(
    String id, {
    String? firstName,
    String? lastName,
  }) async {
    final body = <String, dynamic>{};
    if (firstName != null) body['first_name'] = firstName;
    if (lastName != null) body['last_name'] = lastName;

    final response = await http.patch(
      _uri(ApiConfig.usersPath, id),
      headers: {'Content-Type': 'application/json', ..._tunnelHeaders},
      body: jsonEncode(body),
    );
    _ensureOk(response);
    return UserModel.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<void> actualizarUbicacionUsuario(
    String id, {
    required double latitude,
    required double longitude,
  }) async {
    final response = await http.patch(
      _uri('${ApiConfig.usersPath}/$id/location'),
      headers: {'Content-Type': 'application/json', ..._tunnelHeaders},
      body: jsonEncode({'latitude': latitude, 'longitude': longitude}),
    );
    _ensureOk(response);
  }

  Future<void> actualizarFcmToken(String id, String fcmToken) async {
    final response = await http.patch(
      _uri('${ApiConfig.usersPath}/$id/fcm-token'),
      headers: {'Content-Type': 'application/json', ..._tunnelHeaders},
      body: jsonEncode({'fcm_token': fcmToken}),
    );
    _ensureOk(response);
  }

  Future<void> eliminarUsuario(String id) async {
    final response = await http.delete(
      _uri(ApiConfig.usersPath, id),
      headers: _tunnelHeaders,
    );
    _ensureOk(response);
  }

  // --- Tipos de Reporte (GET /report-types) ---

  Future<List<ReportTypeModel>> obtenerTiposDeAlerta() async {
    final response = await http.get(
      _uri(ApiConfig.reportTypesPath),
      headers: _tunnelHeaders,
    );
    _ensureOk(response);
    final body = jsonDecode(response.body);
    if (body is! List) return [];
    return body
        .map((e) => ReportTypeModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // --- Reportes (GET/POST /reports, GET/DELETE /reports/:id) ---

  Future<List<ReportModel>> obtenerReportes() async {
    final response = await http.get(
      _uri(ApiConfig.reportsPath),
      headers: _tunnelHeaders,
    );
    _ensureOk(response);
    final body = jsonDecode(response.body);
    if (body is! List) return [];
    return body
        .map((e) => ReportModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ReportModel> obtenerReporte(int id) async {
    final response = await http.get(
      _uri(ApiConfig.reportsPath, '$id'),
      headers: _tunnelHeaders,
    );
    _ensureOk(response);
    return ReportModel.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  /// Mismo contrato que `ReportsController.create`: multipart con campos + archivo opcional `image`.
  /// [typeId] es el ID del tipo de alerta devuelto por `/report-types`.
  Future<ReportModel> crearReporte({
    required int typeId,
    required String description,
    required String userId,
    required double latitude,
    required double longitude,
    File? imageFile,
  }) async {
    final request = http.MultipartRequest('POST', _uri(ApiConfig.reportsPath))
      ..fields['type'] = typeId.toString()
      ..fields['description'] = description
      ..fields['userId'] = userId
      ..fields['latitude'] = latitude.toString()
      ..fields['longitude'] = longitude.toString();
    request.headers.addAll(_tunnelHeaders);

    if (imageFile != null) {
      request.files.add(
        await http.MultipartFile.fromPath('image', imageFile.path),
      );
    }

    final streamed = await request.send();
    final responseBody = await streamed.stream.bytesToString();
    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw Exception(
        'Error al crear reporte: ${streamed.statusCode} — $responseBody',
      );
    }
    return ReportModel.fromJson(
      jsonDecode(responseBody) as Map<String, dynamic>,
    );
  }

  Future<void> eliminarReporte(int id) async {
    final response = await http.delete(
      _uri(ApiConfig.reportsPath, '$id'),
      headers: _tunnelHeaders,
    );
    _ensureOk(response);
  }

  Future<List<ReportModel>> buscarReportesSimilares({
    required int typeId,
    required double latitude,
    required double longitude,
  }) async {
    final url = _uri(ApiConfig.reportSimilarsPath).replace(
      queryParameters: {
        'type': typeId.toString(),
        'latitude': longitude.toString(), // Enviando longitud como latitud según el hallazgo
        'longitude': latitude.toString(), // Enviando latitud como longitud según el hallazgo
      },
    );

    final response = await http.get(
      url,
      headers: _tunnelHeaders,
    );

    _ensureOk(response);
    final body = jsonDecode(response.body);
    if (body is! List) return [];
    return body
        .map((e) => ReportModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> adjuntarImagenAReporte(int reportId, File imageFile) async {
    final request = http.MultipartRequest(
      'POST',
      _uri('${ApiConfig.reportsPath}/$reportId/images'),
    );
    request.headers.addAll(_tunnelHeaders);
    request.files.add(
      await http.MultipartFile.fromPath('image', imageFile.path),
    );

    final streamed = await request.send();
    final responseBody = await streamed.stream.bytesToString();
    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw Exception(
        'Error al adjuntar imagen: ${streamed.statusCode} — $responseBody',
      );
    }
  }

  /// No hay GET `/images` en el backend: las imágenes vienen en cada reporte.
  Future<List<ImageModel>> obtenerImagenesPorReporte(int reportId) async {
    final report = await obtenerReporte(reportId);
    return report.images;
  }

  /// Verifica un reporte enviando una foto de confirmación.
  /// El backend comprueba que el usuario esté a ≤50m del incidente.
  Future<ReportModel> verificarReporte({
    required int reportId,
    required double latitude,
    required double longitude,
    required File imageFile,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      _uri('${ApiConfig.reportsPath}/$reportId/verify'),
    );
    request.headers.addAll(_tunnelHeaders);
    request.fields['latitude'] = latitude.toString();
    request.fields['longitude'] = longitude.toString();
    request.files.add(
      await http.MultipartFile.fromPath('image', imageFile.path),
    );

    final streamed = await request.send();
    final responseBody = await streamed.stream.bytesToString();
    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw Exception(
        'Error al verificar reporte: ${streamed.statusCode} — $responseBody',
      );
    }
    return ReportModel.fromJson(
      jsonDecode(responseBody) as Map<String, dynamic>,
    );
  }

  /// Obtiene reportes cercanos dentro de un radio en metros.
  Future<List<ReportModel>> obtenerReportesCercanos({
    required double latitude,
    required double longitude,
    int radius = 150,
  }) async {
    final url = _uri(ApiConfig.reportNearbyPath).replace(
      queryParameters: {
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'radius': radius.toString(),
      },
    );
    final response = await http.get(url, headers: _tunnelHeaders);
    _ensureOk(response);
    final body = jsonDecode(response.body);
    if (body is! List) return [];
    return body
        .map((e) => ReportModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  void _ensureOk(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('HTTP ${response.statusCode}: ${response.body}');
    }
  }

  Map<String, dynamic> _decodeJsonMap(String body) {
    final decoded = jsonDecode(body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Respuesta inesperada del servidor.');
    }
    return decoded;
  }
}
