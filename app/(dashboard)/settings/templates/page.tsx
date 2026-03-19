import { Header } from "@/components/layout/header";
import { getTemplatesGroupedByType } from "@/lib/actions/templates";
import { TemplatesPageClient } from "@/components/settings/templates-page-client";

export default async function SettingsTemplatesPage() {
  const grouped = await getTemplatesGroupedByType();

  return (
    <div className="flex flex-col">
      <Header title="条款模板库" description="合同条款模板，编辑合同时可快速选择带入" />
      <div className="p-6">
        <TemplatesPageClient initialGrouped={grouped} />
      </div>
    </div>
  );
}
