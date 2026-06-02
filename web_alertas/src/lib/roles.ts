import type { Role } from "@/domain/types";

export const ROLE_IDS = {
  USUARIO: 1,
  AUTORIDAD: 2,
  ADMIN: 3,
} as const;

export type CreatableRoleId =
  | typeof ROLE_IDS.USUARIO
  | typeof ROLE_IDS.AUTORIDAD
  | typeof ROLE_IDS.ADMIN;

export function roleLabel(name?: string): string {
  const n = (name ?? "").toLowerCase();
  if (n === "usuario") return "Usuario normal";
  if (n === "autoridad") return "Autoridad";
  if (n === "admin") return "Administrador";
  return name || "Sin rol";
}

export function roleBadgeClass(role?: Role): string {
  const id = role?.id;
  if (id === ROLE_IDS.ADMIN) {
    return "bg-violet-500/15 text-violet-300 border border-violet-500/30";
  }
  if (id === ROLE_IDS.AUTORIDAD) {
    return "bg-primary/20 text-primary border border-primary/30";
  }
  return "bg-muted text-muted-foreground border border-border";
}

/** Roles que el panel puede asignar al crear usuario */
export function creatableRolesFor(current?: Role): { id: CreatableRoleId; label: string; hint: string }[] {
  const options: { id: CreatableRoleId; label: string; hint: string }[] = [
    {
      id: ROLE_IDS.USUARIO,
      label: "Usuario normal",
      hint: "Ciudadano — app móvil",
    },
    {
      id: ROLE_IDS.AUTORIDAD,
      label: "Administrativo (autoridad)",
      hint: "Acceso al panel web",
    },
  ];

  if (current?.id === ROLE_IDS.ADMIN || current?.name?.toLowerCase() === "admin") {
    options.push({
      id: ROLE_IDS.ADMIN,
      label: "Administrador",
      hint: "Control total del sistema",
    });
  }

  return options;
}

export function canAccessAdminPanel(role?: Role): boolean {
  const id = role?.id;
  const name = (role?.name ?? "").toLowerCase();
  return (
    id === ROLE_IDS.AUTORIDAD ||
    id === ROLE_IDS.ADMIN ||
    name.includes("autoridad") ||
    name.includes("admin")
  );
}
