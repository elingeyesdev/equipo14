class UserModel {
  final String id;
  final String firstName;
  final String lastName;
  final String phone;
  final int? roleId;
  final String? roleName;

  const UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.phone,
    this.roleId,
    this.roleName,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final role = json['role'];
    int? roleId;
    String? roleName;
    if (role is Map<String, dynamic>) {
      roleId = int.tryParse((role['id'] ?? '').toString());
      final name = (role['name'] ?? '').toString().trim();
      roleName = name.isEmpty ? null : name;
    }
    return UserModel(
      id: (json['id'] ?? '').toString(),
      firstName: (json['first_name'] ?? '').toString(),
      lastName: (json['last_name'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      roleId: roleId,
      roleName: roleName,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'first_name': firstName,
    'last_name': lastName,
    'phone': phone,
    'role': roleId == null && roleName == null
        ? null
        : {'id': roleId, 'name': roleName},
  };
}
