import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { InventoryProvider } from "@/components/inventory-provider";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <InventoryProvider>
      <AppShell>{children}</AppShell>
    </InventoryProvider>
  );
}
