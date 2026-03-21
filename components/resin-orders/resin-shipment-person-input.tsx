"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldKey = "shipper" | "reviewer" | "invoicer";

export function ResinShipmentPersonInput({
  label,
  options,
  value,
  onChange,
  fieldKey,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  fieldKey: FieldKey;
}) {
  const uid = useId();
  const listId = `${uid}-${fieldKey}`;

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        placeholder="可选下拉或手输"
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </div>
  );
}
