import 'package:app_alertas/data/models/user_model.dart';
import 'package:app_alertas/data/repositories/auth_repository.dart';
import 'package:flutter/foundation.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider({AuthRepository? repository})
    : _repository = repository ?? AuthRepository();

  final AuthRepository _repository;

  UserModel? _user;
  String? _accessToken;
  String? _refreshToken;
  bool _isLoading = false;
  bool _isInitialized = false;

  UserModel? get user => _user;
  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  bool get isAuthenticated =>
      _user != null && (_accessToken?.isNotEmpty ?? false);

  Future<void> initializeSession() async {
    if (_isInitialized) return;
    _isLoading = true;
    notifyListeners();
    try {
      final session = await _repository.loadSession();
      if (session != null) {
        _user = session.user;
        _accessToken = session.accessToken;
        _refreshToken = session.refreshToken;
      }
    } finally {
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> loginUser({
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      final user = await _repository.loginUser(
        phone: phone,
        password: password,
      );
      _user = user;
      final session = await _repository.loadSession();
      _accessToken = session?.accessToken;
      _refreshToken = session?.refreshToken;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> registerUser({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      final user = await _repository.registerUser(
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        password: password,
      );
      _user = user;
      final session = await _repository.loadSession();
      _accessToken = session?.accessToken;
      _refreshToken = session?.refreshToken;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    try {
      await _repository.clearSession();
      _user = null;
      _accessToken = null;
      _refreshToken = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
