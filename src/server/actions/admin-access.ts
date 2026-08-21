"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/admin-auth";
import {
  ADMIN_PERMISSIONS,
  ADMIN_PRESET_LABELS,
  hasAdminPermission,
  inferAdminPreset,
  permissionsForPreset,
  uniqueAdminPermissions,
  type AdminPreset,
} from "@/lib/admin-permissions";

export async function saveUserAdminAccess(formData: FormData) {
  const actor = await requirePermission("ADMIN_MANAGE");
  const userId = text(formData, "userId");
  if (!userId) throw new Error("Utilisateur introuvable.");

  const preset = normalizePreset(text(formData, "preset"));
  const permissions =
    preset === "custom"
      ? uniqueAdminPermissions(formData.getAll("adminPermissions"))
      : permissionsForPreset(preset);

  if (
    actor.id === userId &&
    !hasAdminPermission(permissions, "ADMIN_MANAGE")
  ) {
    throw new Error("Vous ne pouvez pas retirer votre propre permission d’accès administrateur.");
  }

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { adminPermissions: true, isAdmin: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      adminPermissions: permissions,
      isAdmin: permissions.length > 0,
      canManageFinance:
        permissions.includes("FINANCE_VIEW") ||
        permissions.includes("FINANCE_MANAGE"),
    },
  });

  await recordAuditLog({
    action: "admin.access_update",
    entityType: "User",
    entityId: userId,
    metadata: {
      beforePreset: before
        ? inferAdminPreset(
            uniqueAdminPermissions(
              before.adminPermissions.length > 0
                ? before.adminPermissions
                : before.isAdmin
                  ? ADMIN_PERMISSIONS
                  : [],
            ),
          )
        : null,
      afterPreset: ADMIN_PRESET_LABELS[inferAdminPreset(permissions)],
      permissions,
    },
  });

  revalidatePath("/portal/admin");
  revalidatePath("/portal/admin/users");
  revalidatePath(`/portal/admin/users/${userId}`);
}

function normalizePreset(value: string): Exclude<AdminPreset, "custom"> | "custom" {
  if (
    value === "none" ||
    value === "project" ||
    value === "finance" ||
    value === "user_ops" ||
    value === "super" ||
    value === "custom"
  ) {
    return value;
  }
  return "custom";
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
