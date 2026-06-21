import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/core/utils/error_handler.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final auth = context.read<AuthViewModel>();
      await auth.changePassword(
        currentPassword: _currentPasswordController.text.trim(),
        newPassword: _newPasswordController.text.trim(),
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Contraseña actualizada correctamente'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 3),
        ),
      );
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(parseError(e)),
          backgroundColor: const Color(0xFFB64D4C),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final onSurface = Theme.of(context).colorScheme.onSurface;
    final isLoading = context.watch<AuthViewModel>().isLoading;

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // App bar
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 2, 24, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.arrow_back, color: onSurface),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "Cambiar contraseña",
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.normal,
                      letterSpacing: -0.3,
                      color: onSurface,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Formulario
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Indicaciones
                      Text(
                        'La contraseña debe tener al menos 6 caracteres y no debe contener espacios.',
                        style: TextStyle(
                          color: onSurface.withValues(alpha: 0.6),
                          fontSize: 13,
                          height: 1.4,
                          fontWeight: FontWeight.normal,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Campo Contraseña actual
                      TextFormField(
                        controller: _currentPasswordController,
                        obscureText: _obscureCurrent,
                        style: const TextStyle(fontWeight: FontWeight.normal, color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Contraseña actual',
                          hintStyle: const TextStyle(fontWeight: FontWeight.normal),
                          prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureCurrent
                                  ? Icons.visibility_off_rounded
                                  : Icons.visibility_rounded,
                              size: 20,
                              color: const Color(0xFF94A3B8),
                            ),
                            onPressed: () {
                              setState(() {
                                _obscureCurrent = !_obscureCurrent;
                              });
                            },
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'La contraseña actual es requerida';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Campo Contraseña nueva
                      TextFormField(
                        controller: _newPasswordController,
                        obscureText: _obscureNew,
                        style: const TextStyle(fontWeight: FontWeight.normal, color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Contraseña nueva',
                          hintStyle: const TextStyle(fontWeight: FontWeight.normal),
                          prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureNew
                                  ? Icons.visibility_off_rounded
                                  : Icons.visibility_rounded,
                              size: 20,
                              color: const Color(0xFF94A3B8),
                            ),
                            onPressed: () {
                              setState(() {
                                _obscureNew = !_obscureNew;
                              });
                            },
                          ),
                        ),
                        validator: (value) {
                          final v = value ?? '';
                          if (v.trim().isEmpty) {
                            return 'La contraseña nueva es requerida';
                          }
                          if (v.length < 6) {
                            return 'Mínimo 6 caracteres';
                          }
                          if (v.contains(' ')) {
                            return 'No debe contener espacios';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Campo Repetir contraseña nueva
                      TextFormField(
                        controller: _confirmPasswordController,
                        obscureText: _obscureConfirm,
                        style: const TextStyle(fontWeight: FontWeight.normal, color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Repetir contraseña nueva',
                          hintStyle: const TextStyle(fontWeight: FontWeight.normal),
                          prefixIcon: const Icon(Icons.lock_reset_rounded, size: 20),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureConfirm
                                  ? Icons.visibility_off_rounded
                                  : Icons.visibility_rounded,
                              size: 20,
                              color: const Color(0xFF94A3B8),
                            ),
                            onPressed: () {
                              setState(() {
                                _obscureConfirm = !_obscureConfirm;
                              });
                            },
                          ),
                        ),
                        validator: (value) {
                          final v = value ?? '';
                          if (v != _newPasswordController.text) {
                            return 'Las contraseñas no coinciden';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Botón Cambiar contraseña
                      ElevatedButton(
                        onPressed: isLoading ? null : _submit,
                        child: isLoading
                            ? const SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'Cambiar contraseña',
                                style: TextStyle(
                                  letterSpacing: 0.5,
                                  fontWeight: FontWeight.normal,
                                ),
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
