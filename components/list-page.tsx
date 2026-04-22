import { Search } from "lucide-react";
import type {
  ChangeEventHandler,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ListPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function ListPageHeader({
  title,
  description,
  action,
}: ListPageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
    </div>
  );
}

export function ListStatsGrid({ children }: { children: ReactNode }) {
  return <section className="grid gap-4 lg:grid-cols-3">{children}</section>;
}

type ListStatCardProps = {
  label: string;
  value: string;
  detail?: string;
  valueClassName?: string;
};

export function ListStatCard({
  label,
  value,
  detail,
  valueClassName,
}: ListStatCardProps) {
  return (
    <Card className="rounded-[28px] border border-border/80 bg-white shadow-soft">
      <CardContent className="p-7">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={cn("mt-7 text-5xl font-semibold tracking-tight text-foreground", valueClassName)}>
          {value}
        </p>
        {detail ? <p className="mt-3 text-sm text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

export function ListToolbar({ children }: { children: ReactNode }) {
  return (
    <Card className="rounded-[28px] border border-border/80 bg-white shadow-soft">
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

type ListToolbarRowProps = {
  children: ReactNode;
  className?: string;
};

export function ListToolbarRow({ children, className }: ListToolbarRowProps) {
  return (
    <div
      className={cn(
        "grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] lg:items-stretch",
        className
      )}
    >
      {children}
    </div>
  );
}

type ListTableCardProps = {
  children: ReactNode;
  className?: string;
};

export function ListTableCard({ children, className }: ListTableCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[30px] border border-border/80 bg-white shadow-soft",
        className
      )}
    >
      {children}
    </Card>
  );
}

type ListSearchBarProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  className?: string;
  inputClassName?: string;
};

export function ListSearchBar({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: ListSearchBarProps) {
  return (
    <div className={cn("relative w-full min-w-0 lg:flex-[2.2]", className)}>
      <Search className="pointer-events-none absolute left-4 top-5 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn("h-14 min-w-0 w-full rounded-[20px] pl-10", inputClassName)}
      />
    </div>
  );
}

export function ListTable({ children }: { children: ReactNode }) {
  return (
    <ListTableCard>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">{children}</table>
      </div>
    </ListTableCard>
  );
}

export function ListTableHeadCell({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-6 py-5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function ListTableCell({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("border-t border-border px-6 py-5 align-top", className)} {...props}>
      {children}
    </td>
  );
}

type ListFeedbackBannerProps = {
  kind: "success" | "error";
  text: string;
};

export function ListFeedbackBanner({ kind, text }: ListFeedbackBannerProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border px-5 py-4 text-sm",
        kind === "success"
          ? "border-primary/25 bg-primary/10 text-foreground"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {text}
    </div>
  );
}
