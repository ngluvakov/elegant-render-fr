/**
 * sync-contact.ts — Creates or finds a Bitrix24 Contact from a platform User.
 *
 * Exports syncContact() which checks for a cached bitrixContactId before
 * calling crm.contact.add. Caches the ID on the User record.
 *
 * Used by: server/bitrix/sync-deal (called during deal creation)
 */
import { prisma } from "@/lib/db";
import { bitrixCall } from "@/lib/bitrix24/client";

export async function syncContact(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Return cached ID
  if (user.bitrixContactId) return user.bitrixContactId;

  const nameParts = (user.name ?? "Klijent").split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const contactId = await bitrixCall<number>("crm.contact.add", {
    fields: {
      NAME: firstName,
      LAST_NAME: lastName,
      EMAIL: user.email ? [{ VALUE: user.email, VALUE_TYPE: "WORK" }] : [],
      PHONE: user.phone ? [{ VALUE: user.phone, VALUE_TYPE: "WORK" }] : [],
    },
  }, { entityType: "contact", entityId: userId, direction: "outbound" });

  await prisma.user.update({
    where: { id: userId },
    data: { bitrixContactId: String(contactId) },
  });

  return String(contactId);
}
