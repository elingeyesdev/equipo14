import 'package:app_alertas/core/network/dio_client.dart';
import 'package:app_alertas/models/facility_model.dart';

class FacilityService {
  Future<List<FacilityModel>> findAll() async {
    final response = await dioClient.dio.get('/facilities');
    final data = response.data as List<dynamic>;
    return data
        .map((e) => FacilityModel.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<List<FacilityModel>> findNearby({
    required double latitude,
    required double longitude,
    String? profileType,
    int limit = 8,
  }) async {
    final query = <String, dynamic>{
      'latitude': latitude,
      'longitude': longitude,
      'limit': limit,
    };
    if (profileType != null && profileType.isNotEmpty) {
      query['profileType'] = profileType;
    }

    final response = await dioClient.dio.get(
      '/facilities/nearby',
      queryParameters: query,
    );
    final data = response.data as List<dynamic>;
    return data
        .map((e) => FacilityModel.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
}
