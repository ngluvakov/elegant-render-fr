"use client";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/actions/sign-out";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">
        Se déconnecter
      </Button>
    </form>
  );
}
