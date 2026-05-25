import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/views/widgets/custom_snackbar.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  // Estado para mostrar/ocultar contraseñas (independientes)
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final auth = context.read<AuthViewModel>();
      await auth.register(
        firstName: _nameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        phone: _phoneController.text.trim(),
        password: _passwordController.text.trim(),
      );
      if (!mounted) return;
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      showCustomSnackBar(
        context: context,
        title: 'Error de Registro',
        message: e.toString().replaceFirst('Exception: ', ''),
        type: CustomSnackBarType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthViewModel>().isLoading;
    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0D1015), Color(0xFF26292E)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                AppBar(
                  backgroundColor: Colors.transparent,
                  title: const Text('Crear Cuenta'),
                  elevation: 0,
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 420),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Text(
                                'Únete a la red de seguridad',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 32),

                              // Nombre y Apellido
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      controller: _nameController,
                                      decoration: const InputDecoration(hintText: 'Nombre'),
                                      validator: (value) => (value ?? '').trim().isEmpty ? 'Requerido' : null,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TextFormField(
                                      controller: _lastNameController,
                                      decoration: const InputDecoration(hintText: 'Apellido'),
                                      validator: (value) => (value ?? '').trim().isEmpty ? 'Requerido' : null,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Teléfono
                              TextFormField(
                                controller: _phoneController,
                                keyboardType: TextInputType.phone,
                                decoration: const InputDecoration(
                                  hintText: 'Número de teléfono',
                                  prefixIcon: Icon(Icons.phone_android_rounded, size: 20),
                                ),
                                validator: (value) {
                                  final v = (value ?? '').trim();
                                  if (v.isEmpty) return 'Requerido';
                                  if (v.length < 7) return 'Número inválido';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              // Contraseña con icono de ojo
                              TextFormField(
                                controller: _passwordController,
                                obscureText: _obscurePassword,
                                decoration: InputDecoration(
                                  hintText: 'Contraseña',
                                  prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _obscurePassword
                                          ? Icons.visibility_off_rounded
                                          : Icons.visibility_rounded,
                                      size: 20,
                                      color: const Color(0xFF94A3B8),
                                    ),
                                    onPressed: () {
                                      setState(() {
                                        _obscurePassword = !_obscurePassword;
                                      });
                                    },
                                    tooltip: _obscurePassword
                                        ? 'Mostrar contraseña'
                                        : 'Ocultar contraseña',
                                  ),
                                ),
                                validator: (value) =>
                                    (value ?? '').trim().length < 6 ? 'Mínimo 6 caracteres' : null,
                              ),
                              const SizedBox(height: 16),

                              // Confirmar contraseña con icono de ojo independiente
                              TextFormField(
                                controller: _confirmPasswordController,
                                obscureText: _obscureConfirmPassword,
                                decoration: InputDecoration(
                                  hintText: 'Confirmar contraseña',
                                  prefixIcon: const Icon(Icons.lock_reset_rounded, size: 20),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _obscureConfirmPassword
                                          ? Icons.visibility_off_rounded
                                          : Icons.visibility_rounded,
                                      size: 20,
                                      color: const Color(0xFF94A3B8),
                                    ),
                                    onPressed: () {
                                      setState(() {
                                        _obscureConfirmPassword = !_obscureConfirmPassword;
                                      });
                                    },
                                    tooltip: _obscureConfirmPassword
                                        ? 'Mostrar contraseña'
                                        : 'Ocultar contraseña',
                                  ),
                                ),
                                validator: (value) =>
                                    (value ?? '').trim() != _passwordController.text.trim()
                                        ? 'No coinciden'
                                        : null,
                              ),
                              const SizedBox(height: 32),

                              ElevatedButton(
                                onPressed: isLoading ? null : _submit,
                                child: isLoading
                                    ? const SizedBox(
                                        height: 24,
                                        width: 24,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      )
                                    : const Text(
                                        'CREAR CUENTA',
                                        style: TextStyle(fontWeight: FontWeight.bold),
                                      ),
                              ),
                              const SizedBox(height: 24),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
