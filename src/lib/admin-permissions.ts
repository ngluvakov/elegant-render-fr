export const ADMIN_PERMISSIONS = [
  "PROJECTS_VIEW",
  "PROJECTS_MANAGE",
  "INQUIRIES_MANAGE",
  "FINANCE_VIEW",
  "FINANCE_MANAGE",
  "USERS_VIEW",
  "USERS_MANAGE",
  "AI_CREDITS_MANAGE",
  "USAGE_VIEW",
  "ANALYTICS_VIEW",
  "AUDIT_VIEW",
  "SYSTEM_MANAGE",
  "ADMIN_MANAGE",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminPreset =
  | "none"
  | "project"
  | "finance"
  | "user_ops"
  | "super"
  | "custom";

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  PROJECTS_VIEW: "Consultation des projets",
  PROJECTS_MANAGE: "Gestion des projets",
  INQUIRIES_MANAGE: "Gestion des demandes",
  FINANCE_VIEW: "Consultation des finances",
  FINANCE_MANAGE: "Gestion des finances",
  USERS_VIEW: "Consultation des utilisateurs",
  USERS_MANAGE: "Gestion des utilisateurs",
  AI_CREDITS_MANAGE: "Crédits IA",
  USAGE_VIEW: "Suivi de l’utilisation",
  ANALYTICS_VIEW: "Statistiques",
  AUDIT_VIEW: "Journal d’audit",
  SYSTEM_MANAGE: "Système",
  ADMIN_MANAGE: "Accès administrateurs",
};

export const ADMIN_PRESET_LABELS: Record<AdminPreset, string> = {
  none: "Sans accès admin",
  project: "Admin projets",
  finance: "Admin finances",
  user_ops: "Admin utilisateurs",
  super: "Super admin",
  custom: "Personnalisé",
};

export const ADMIN_PRESET_PERMISSIONS: Record<
  Exclude<AdminPreset, "custom">,
  AdminPermission[]
> = {
  none: [],
  project: ["PROJECTS_VIEW", "PROJECTS_MANAGE", "INQUIRIES_MANAGE"],
  finance: ["PROJECTS_VIEW", "FINANCE_VIEW", "FINANCE_MANAGE"],
  user_ops: [
    "USERS_VIEW",
    "USERS_MANAGE",
    "AI_CREDITS_MANAGE",
    "USAGE_VIEW",
  ],
  super: [...ADMIN_PERMISSIONS],
};

const ADMIN_PERMISSION_SET = new Set<string>(ADMIN_PERMISSIONS);

export function isAdminPermission(value: unknown): value is AdminPermission {
  return typeof value === "string" && ADMIN_PERMISSION_SET.has(value);
}

export function uniqueAdminPermissions(
  permissions: readonly unknown[],
): AdminPermission[] {
  return ADMIN_PERMISSIONS.filter((permission) =>
    permissions.includes(permission),
  );
}

export function normalizeAdminPermissions(
  permissions: readonly unknown[] | null | undefined,
  legacy?: { isAdmin?: boolean | null },
): AdminPermission[] {
  const normalized = uniqueAdminPermissions(permissions ?? []);
  if (normalized.length > 0) return normalized;
  return legacy?.isAdmin ? ADMIN_PRESET_PERMISSIONS.super : [];
}

export function hasAdminPermission(
  permissions: readonly AdminPermission[],
  permission: AdminPermission,
): boolean {
  return permissions.includes(permission);
}

export function hasAnyAdminPermission(
  permissions: readonly AdminPermission[],
  required: readonly AdminPermission[] = ADMIN_PERMISSIONS,
): boolean {
  return required.some((permission) => permissions.includes(permission));
}

export function permissionsForPreset(preset: AdminPreset): AdminPermission[] {
  if (preset === "custom") return [];
  return [...ADMIN_PRESET_PERMISSIONS[preset]];
}

export function inferAdminPreset(
  permissions: readonly AdminPermission[],
): AdminPreset {
  if (permissions.length === 0) return "none";
  for (const preset of ["super", "project", "finance", "user_ops"] as const) {
    if (samePermissionSet(permissions, ADMIN_PRESET_PERMISSIONS[preset])) {
      return preset;
    }
  }
  return "custom";
}

function samePermissionSet(
  a: readonly AdminPermission[],
  b: readonly AdminPermission[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((permission) => b.includes(permission));
}
