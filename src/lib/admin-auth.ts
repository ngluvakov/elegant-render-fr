import "server-only";

import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
  hasAnyAdminPermission,
  normalizeAdminPermissions,
  type AdminPermission,
} from "@/lib/admin-permissions";

export type AdminContext = {
  id: string;
  email: string | null;
  permissions: AdminPermission[];
};

// cache(): the admin layout + requirePermission + the page call this in the
// same render — without the cache that is 3× auth() + 3 user queries per
// admin navigation.
export const getAdminContext = cache(
  async (): Promise<AdminContext | null> => {
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        adminPermissions: true,
      },
    });
    if (!user) return null;

    const permissions = normalizeAdminPermissions(user.adminPermissions, {
      isAdmin: user.isAdmin,
    });
    if (permissions.length === 0) return null;

    return {
      id: user.id,
      email: user.email,
      permissions,
    };
  },
);

export async function requireAnyAdminPermission(
  permissions: readonly AdminPermission[] = ADMIN_PERMISSIONS,
): Promise<AdminContext> {
  const admin = await getAdminContext();
  if (!admin || !hasAnyAdminPermission(admin.permissions, permissions)) {
    throw new Error("Admin permission required");
  }
  return admin;
}

export async function requirePermission(
  permission: AdminPermission,
): Promise<AdminContext> {
  const admin = await getAdminContext();
  if (!admin || !hasAdminPermission(admin.permissions, permission)) {
    throw new Error(`Admin permission required: ${permission}`);
  }
  return admin;
}

export function adminHas(
  admin: AdminContext | null,
  permission: AdminPermission,
): boolean {
  return Boolean(admin && hasAdminPermission(admin.permissions, permission));
}

export function adminHasAny(
  admin: AdminContext | null,
  permissions: readonly AdminPermission[],
): boolean {
  return Boolean(admin && hasAnyAdminPermission(admin.permissions, permissions));
}
