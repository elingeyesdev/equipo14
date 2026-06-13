/// Roles con acceso tipo staff (autoridad / admin).
bool isStaffRole(int? roleId, String? roleName) {
  final name = roleName?.toLowerCase() ?? '';
  return roleId == 2 ||
      roleId == 3 ||
      name.contains('autoridad') ||
      name.contains('admin');
}
