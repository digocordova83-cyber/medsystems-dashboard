import DashboardLayout from "@/components/DashboardLayout";
import { ClientDataGuide } from "@/components/ClientDataGuide";
import { RevenueAnalytics } from "@/components/RevenueAnalytics";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const visibleHashes = ["overview", "google", "meta", "bitrix", "guide"];
  const normalizeHash = () => {
    const requested = window.location.hash.replace("#", "") || "overview";
    return visibleHashes.includes(requested) ? requested : "overview";
  };
  const [activeHash, setActiveHash] = useState(normalizeHash);
  useEffect(() => {
    const syncHash = () => {
      const normalized = normalizeHash();
      if (window.location.hash.replace("#", "") !== normalized) window.location.hash = normalized;
      setActiveHash(normalized);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);
  return <DashboardLayout>
    {activeHash === "guide" ? <ClientDataGuide /> : <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 xl:flex-row xl:items-end">
        <div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgb(103,232,249)]" /><span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-cyan-100/65">Mídia · CRM · Performance</span></div><h1 className="mt-3 text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">Performance <span className="text-cyan-200">Command Center</span></h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Google Ads, Meta Ads e Negócios em uma leitura gerencial única. Métricas comerciais só são atribuídas quando existe evidência verificável.</p></div>
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-emerald-100"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Dados auditáveis</Badge></div>
      </header>
      <RevenueAnalytics />
    </div>}
  </DashboardLayout>;
}
