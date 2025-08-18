'use client'

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { useState } from "react";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    await signOut();
    setIsLoading(false);
  }

  return (
    <form action={handleSignOut}>
      <Button variant="outline" size="sm" type="submit" disabled={isLoading}>
        {isLoading ? 'Signing out...' : 'Sign Out'}
      </Button>
    </form>
  );
}

