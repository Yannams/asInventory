import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { InventoryProvider } from "@/components/inventory-provider";
import { ProtectedRoute } from "@/components/protected-route";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <InventoryProvider>
        <AppShell>{children}</AppShell>
      </InventoryProvider>
    </ProtectedRoute>
  );
}
