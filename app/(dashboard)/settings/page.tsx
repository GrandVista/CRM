import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanyProfile } from "@/lib/actions/settings";
import { updateCompanyProfile } from "@/lib/actions/settings";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";

export default async function SettingsPage() {
  const companyProfile = await getCompanyProfile();

  return (
    <div className="flex flex-col">
      <Header title="Settings" description="系统设置" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>公司信息 Company Profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              用于合同、PI 等单据的卖方抬头与银行信息。
            </p>
          </CardHeader>
          <CardContent>
            <CompanyProfileForm initial={companyProfile} onUpdate={updateCompanyProfile} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>条款模板库</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                维护付款、装运、单证等条款模板，编辑合同时可快速选择带入。
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/settings/templates">管理模板</Link>
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
