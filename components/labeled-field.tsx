import type { ReactNode } from "react";

type LabeledFieldProps = {
  label: string;
  children: ReactNode;
};

export function LabeledField({ label, children }: LabeledFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
