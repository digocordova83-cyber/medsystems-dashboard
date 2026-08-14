import DashboardLayout from "@/components/DashboardLayout";
import { RevenueAnalytics } from "@/components/RevenueAnalytics";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export default function Home() {
  return <DashboardLayout>
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 xl:flex-row xl:items-end">
        <div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgb(103,232,249)]" /><span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-cyan-100/65">Mídia · CRM · Receita</span></div><h1 className="mt-3 text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">Revenue <span className="text-cyan-200">Command Center</span></h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Google Ads, Meta Ads, RD Station e Bitrix24 em uma camada analítica única. Métricas comerciais só são atribuídas quando existe evidência verificável.</p></div>
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-emerald-100"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Dados auditáveis</Badge></div>
      </header>
      <RevenueAnalytics />
    </div>
  </DashboardLayout>;
}
