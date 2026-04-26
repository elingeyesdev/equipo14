import 'package:app_alertas/data/models/user_model.dart';
import 'package:app_alertas/data/services/auth_service.dart';
import 'package:flutter/material.dart';

class AuthorityRegisterScreen extends StatefulWidget {
  const AuthorityRegisterScreen({
    super.key,
    required this.onRegisterSuccess,
    this.authService,
  });

  final ValueChanged<UserModel> onRegisterSuccess;
  final AuthService? authService;

  @override
  State<AuthorityRegisterScreen> createState() =>
      _AuthorityRegisterScreenState();
}

class _AuthorityRegisterScreenState extends State<AuthorityRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailOrPhoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  late final AuthService _authService;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _authService = widget.authService ?? AuthService();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailOrPhoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final fullName = _nameController.text.trim();
      final parts = fullName.split(' ').where((p) => p.isNotEmpty).toList();
      final firstName = parts.isEmpty ? fullName : parts.first;
      final lastName = parts.length > 1
          ? parts.sublist(1).join(' ')
          : 'autoridad';

      // Si luego se habilita endpoint dedicado (ej. /auth/authority/register),
      // actualiza AuthService.registerAuthority para apuntar a esa URL.
      final user = await _authService.registerAuthority(
        firstName: firstName,
        lastName: lastName,
        phone: _emailOrPhoneController.text.trim(),
        password: _passwordController.text.trim(),
      );
      if (!mounted) return;
      widget.onRegisterSuccess(user);
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registro de Autoridades')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Crear cuenta de autoridad',
                      style: Theme.of(context).textTheme.headlineSmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 18),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Nombre completo',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if ((value ?? '').trim().isEmpty) {
                          return 'Ingresa el nombre.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _emailOrPhoneController,
                      decoration: const InputDecoration(
                        labelText: 'Correo o telefono',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if ((value ?? '').trim().isEmpty) {
                          return 'Ingresa correo o telefono.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Contrasena',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        final v = (value ?? '').trim();
                        if (v.isEmpty) return 'Ingresa una contrasena.';
                        if (v.length < 6) return 'Minimo 6 caracteres.';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Confirmar contrasena',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if ((value ?? '').trim() !=
                            _passwordController.text.trim()) {
                          return 'Las contrasenas no coinciden.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 18),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _submit,
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Registrar autoridad'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
