import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon: Icon,
  backHref,
  backLabel = "Retour",
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 rounded-[32px] border border-border bg-white/90 p-6 shadow-soft sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow ? (
            <Badge variant="neutral" className="w-fit">
              {eyebrow}
            </Badge>
          ) : null}
          <div className="flex items-start gap-4">
            {backHref ? (
              <Link
                href={backHref}
                aria-label={backLabel}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted/35 text-foreground transition hover:border-primary hover:text-primary"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            ) : Icon ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
          </div>
        </div>
        {actions ? <div className={cn("flex flex-wrap gap-3", backHref && "lg:pl-16")}>{actions}</div> : null}
      </div>
    </div>
  );
}
