"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyProfile } from "@prisma/client";
import type { CompanyProfileInput } from "@/lib/actions/settings";

type Props = {
  initial: CompanyProfile | null;
  onUpdate: (data: CompanyProfileInput) => Promise<unknown>;
};

export function CompanyProfileForm({ initial, onUpdate }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    startTransition(() => {
      void onUpdate({
        companyName: (form.elements.namedItem("companyName") as HTMLInputElement).value || null,
        companyAddress: (form.elements.namedItem("companyAddress") as HTMLInputElement).value || null,
        companyTel: (form.elements.namedItem("companyTel") as HTMLInputElement).value || null,
        companyEmail: (form.elements.namedItem("companyEmail") as HTMLInputElement).value || null,
        companyFax: (form.elements.namedItem("companyFax") as HTMLInputElement).value || null,
        companyBank: (form.elements.namedItem("companyBank") as HTMLInputElement).value || null,
        companyAccount: (form.elements.namedItem("companyAccount") as HTMLInputElement).value || null,
        companySwift: (form.elements.namedItem("companySwift") as HTMLInputElement).value || null,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyName">公司名称 Company Name</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={initial?.companyName ?? ""}
            placeholder="Xiamen Grandvista Trading Limited"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyAddress">地址 Address</Label>
          <Input
            id="companyAddress"
            name="companyAddress"
            defaultValue={initial?.companyAddress ?? ""}
            placeholder="Rm 2903-1, No.2 Anling Road, Huli District, Xiamen, China"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyTel">电话 Tel</Label>
          <Input
            id="companyTel"
            name="companyTel"
            defaultValue={initial?.companyTel ?? ""}
            placeholder="+86 592 5717277"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyEmail">Email</Label>
          <Input
            id="companyEmail"
            name="companyEmail"
            type="email"
            defaultValue={initial?.companyEmail ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyFax">Fax</Label>
          <Input id="companyFax" name="companyFax" defaultValue={initial?.companyFax ?? ""} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyBank">银行 Bank</Label>
          <Input id="companyBank" name="companyBank" defaultValue={initial?.companyBank ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyAccount">账号 Account</Label>
          <Input id="companyAccount" name="companyAccount" defaultValue={initial?.companyAccount ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companySwift">SWIFT</Label>
          <Input id="companySwift" name="companySwift" defaultValue={initial?.companySwift ?? ""} />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : "保存"}
      </Button>
    </form>
  );
}
