import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-[290px] shrink-0 lg:block">
          <div className="sticky top-4">
            <AppSidebar />
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="lg:hidden">
            <AppSidebar compact />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
