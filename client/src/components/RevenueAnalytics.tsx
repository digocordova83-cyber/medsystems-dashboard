import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronRight, CircleAlert, DollarSign, Filter, Layers3, MousePointerClick, Target, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Brand = "all" | "medsystems" | "beautysystems";
type Channel = "all" | "google_ads" | "meta_ads";
type Tab = "overview" | "google" | "meta" | "revenue";
type RevenueView = "pipeline" | "origin" | "sales" | "lost" | "discard";
type DealStatus = "all" | "open" | "won" | "lost";
type ReportingPeriod = "2026-07";
type DealAnalytics = {
  total: number;
  open: number;
  closed: number;
  won: number;
  lost: number;
  totalValue: number;
  wonValue: number;
  lostValue: number;
  wonRateOfClosed: number;
  averageWonTicket: number;
  sources: { label: string; count: number; value: number }[];
  utmSources: { label: string; count: number; value: number }[];
  losses: { label: string; count: number; value: number; withObservation: number }[];
  discards: { label: string; count: number; value: number }[];
  financialStatuses: { label: string; count: number; value: number }[];
};
type CampaignRow = { platform: "google_ads" | "meta_ads"; campaignId: string; campaignName: string; brand: "medsystems" | "beautysystems"; spend: number; impressions: number; clicks: number; leads: number };
type AdRow = CampaignRow & { adGroupId: string; adGroupName: string; adId: string; adName: string };
type AttributionRow = { matchStatus: "not_identified" | "channel_signal" | "identified"; matchMethod: "none" | "utm_source" | "utm_campaign" | "identifier"; mediaPlatform: "google_ads" | "meta_ads" | null; count: number; revenueValue: number };

export const DASHBOARD_TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "google", label: "Google Ads" },
  { id: "meta", label: "Meta Ads" },
  { id: "revenue", label: "Revenue" },
];

const BRAND_LABEL: Record<Brand, string> = { all: "Todas as marcas", medsystems: "Medsystems", beautysystems: "BeautySystems" };
const PLATFORM_LABEL = { google_ads: "Google Ads", meta_ads: "Meta Ads" } as const;

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);
}

function integer(value: number) {
  return Math.round(value || 0).toLocaleString("pt-BR");
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export const dashboardMath = { ratio };

function StatusPill({ available, children }: { available: boolean; children: React.ReactNode }) {
  return <Badge variant="outline" className={available ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-amber-200/20 bg-amber-200/10 text-amber-100"}>{children}</Badge>;
}

function KpiCard({ label, value, helper, icon: Icon, accent = "cyan" }: { label: string; value: string; helper: string; icon: typeof DollarSign; accent?: "cyan" | "green" | "orange" }) {
  const colors = { cyan: "text-cyan-200 bg-cyan-200/10", green: "text-emerald-200 bg-emerald-200/10", orange: "text-orange-200 bg-orange-200/10" };
  const displayValue = value === "—" ? "Indisponível" : value;
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{displayValue}</p></div><span className={`grid h-9 w-9 place-items-center rounded-xl ${colors[accent]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-xs text-muted-foreground">{helper}</p></div>;
}

export function RevenueAnalytics() {
  const [brand, setBrand] = useState<Brand>("all");
  const [channel, setChannel] = useState<Channel>("all");
  const [dealStatus, setDealStatus] = useState<DealStatus>("all");
  const [period, setPeriod] = useState<ReportingPeriod>("2026-07");
  const [tab, setTab] = useState<Tab>("overview");
  const [revenueView, setRevenueView] = useState<RevenueView>("pipeline");
  useEffect(() => {
    const updateFromHash = () => {
      const requested = window.location.hash.replace("#", "") as Tab;
      if (DASHBOARD_TABS.some(item => item.id === requested)) setTab(requested);
    };
    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);
    return () => window.removeEventListener("hashchange", updateFromHash);
  }, []);
  const dashboard = trpc.analytics.dashboard.useQuery({ brand, period }, { refetchInterval: 60_000 });
  const bitrixDeals = trpc.bitrix24.medsystemsJulyDealAnalytics.useQuery({ status: dealStatus, brand }, { refetchInterval: 60_000 });

  const model = useMemo(() => {
    const data = dashboard.data;
    if (!data) return null;
    const platforms = data.platforms.filter(row => channel === "all" || row.platform === channel);
    const spend = platforms.reduce((sum, row) => sum + row.spend, 0);
    const impressions = platforms.reduce((sum, row) => sum + row.impressions, 0);
    const clicks = platforms.reduce((sum, row) => sum + row.clicks, 0);
    const platformLeads = platforms.reduce((sum, row) => sum + row.leads, 0);
    const campaigns = data.campaigns.filter(row => channel === "all" || row.platform === channel);
    const ads = data.ads.filter(row => channel === "all" || row.platform === channel);
    const attribution = data.attribution as AttributionRow[];
    const qualifiedLeads = Object.values(data.rdLeads).reduce((sum, value) => sum + value, 0);
    const commercialRows = data.brandPlatforms.filter(row => (brand === "all" || row.brand === brand) && (channel === "all" || row.platform === channel));
    const commercialSpend = commercialRows.reduce((sum, row) => sum + row.spend, 0);
    const commercialPlatformLeads = commercialRows.reduce((sum, row) => sum + row.leads, 0);
    const commercialQualifiedLeads = brand === "all" ? Object.values(data.rdLeads).reduce((sum, value) => sum + Number(value), 0) : Number(data.rdLeads[brand] ?? 0);
    return { platforms, spend, impressions, clicks, platformLeads, campaigns, ads, attribution, qualifiedLeads, commercialSpend, commercialPlatformLeads, commercialQualifiedLeads };
  }, [brand, channel, dashboard.data]);

  const commercialAvailable = Boolean(bitrixDeals.data);
  const dealData: DealAnalytics | null = commercialAvailable ? ((bitrixDeals.data as DealAnalytics | undefined) ?? null) : null;
  const maxCampaignSpend = Math.max(1, ...(model?.campaigns.map(item => item.spend) ?? [1]));

  return <section className="overflow-hidden rounded-3xl border border-cyan-100/10 bg-[linear-gradient(135deg,rgba(12,35,55,.92),rgba(12,20,35,.88))] shadow-[0_30px_90px_rgba(0,0,0,.22)]">
    <div className="border-b border-white/10 px-5 py-6 lg:px-7">
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgb(103,232,249)]" /><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-cyan-100/65">Mídia → Receita · dados auditáveis</p></div><h2 className="mt-3 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-3xl">Performance de aquisição <span className="text-cyan-200">e receita</span></h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Métricas reais de Google Ads e Meta Ads em julho de 2026, conectadas às camadas de leads e negócios sem forçar atribuições não comprovadas.</p></div>
        <div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-2"><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-cyan-100/65">Período</span><select aria-label="Período do relatório" value={period} onChange={event => setPeriod(event.target.value as ReportingPeriod)} className="h-8 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 text-xs text-emerald-100 outline-none"><option value="2026-07">Julho 2026</option></select></label><StatusPill available>Bitrix24 comercial conectado</StatusPill></div>
      </div>

      <div className="mt-6 flex flex-col gap-3"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-2">{(["all", "medsystems", "beautysystems"] as Brand[]).map(option => <Button key={option} size="sm" variant={brand === option ? "default" : "outline"} className={brand === option ? "bg-cyan-200 text-slate-950 hover:bg-cyan-100" : "border-white/10 bg-black/10 text-muted-foreground hover:bg-white/10 hover:text-white"} onClick={() => setBrand(option)}>{BRAND_LABEL[option]}</Button>)}</div><div className="flex flex-wrap gap-2">{(["all", "google_ads", "meta_ads"] as Channel[]).map(option => <Button key={option} size="sm" variant={channel === option ? "secondary" : "outline"} className={channel === option ? "bg-white/10 text-white" : "border-white/10 bg-black/10 text-muted-foreground hover:bg-white/10 hover:text-white"} onClick={() => setChannel(option)}>{option === "all" ? "Todos os canais" : PLATFORM_LABEL[option]}</Button>)}</div></div><div className="flex flex-wrap items-center gap-2"><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">Status comercial · {BRAND_LABEL[brand]}</span>{(["all", "open", "won", "lost"] as DealStatus[]).map(option => <Button key={option} size="sm" variant={dealStatus === option ? "secondary" : "outline"} className={dealStatus === option ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-black/10 text-muted-foreground"} onClick={() => setDealStatus(option)}>{({ all: "Todos", open: "Em aberto", won: "Ganhos", lost: "Perdidos" } as Record<DealStatus, string>)[option]}</Button>)}</div></div>
    </div>

    {dashboard.isLoading ? <div className="grid min-h-80 place-items-center"><div className="text-center"><BarChart3 className="mx-auto h-6 w-6 animate-pulse text-cyan-200" /><p className="mt-3 text-sm text-muted-foreground">Carregando métricas de mídia…</p></div></div> : dashboard.isError ? <DataState title="Não foi possível carregar as métricas" detail={dashboard.error.message || "Tente atualizar a página. Os dados de origem não foram alterados."} /> : !model || model.platforms.length === 0 ? <DataState title="Não há mídia para este recorte" detail="Não foram encontrados registros de Google Ads ou Meta Ads para a marca e canal selecionados." /> : <div className="p-5 lg:p-7">
      {tab === "overview" ? <Overview brand={brand} model={model} dealData={dealData} maxCampaignSpend={maxCampaignSpend} attribution={model.attribution} /> : null}
      {tab === "google" || tab === "meta" ? <CampaignView title={tab === "google" ? "Google Ads" : "Meta Ads"} campaigns={model.campaigns.filter(item => item.platform === (tab === "google" ? "google_ads" : "meta_ads"))} ads={model.ads.filter(item => item.platform === (tab === "google" ? "google_ads" : "meta_ads"))} maxSpend={maxCampaignSpend} /> : null}
      {tab === "revenue" ? <BusinessHub brand={brand} dealData={dealData} model={model} view={revenueView} setView={setRevenueView} /> : null}
    </div>}
  </section>;
}

function Overview({ brand, model, dealData, maxCampaignSpend, attribution }: { brand: Brand; model: { spend: number; impressions: number; clicks: number; platformLeads: number; qualifiedLeads: number; commercialSpend: number; commercialPlatformLeads: number; commercialQualifiedLeads: number; platforms: { platform: "google_ads" | "meta_ads"; spend: number; impressions: number; clicks: number; leads: number }[]; campaigns: { platform: "google_ads" | "meta_ads"; campaignId: string; campaignName: string; brand: "medsystems" | "beautysystems"; spend: number; impressions: number; clicks: number; leads: number }[] }; dealData: DealAnalytics | null; maxCampaignSpend: number; attribution: AttributionRow[] }) {
  const revenue = dealData?.wonValue ?? 0;
  const commercialLabel = brand === "all" ? "Medsystems + BeautySystems" : BRAND_LABEL[brand];
  return <div className="space-y-6"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><KpiCard label="Investimento" value={brl(model.spend)} helper={`${integer(model.impressions)} impressões`} icon={DollarSign} /><KpiCard label="Leads de plataforma" value={integer(model.platformLeads)} helper={`CPL ${brl(ratio(model.spend, model.platformLeads))}`} icon={Target} /><KpiCard label="Leads qualificados RD" value={integer(model.qualifiedLeads)} helper="Sem atribuição forçada por campanha" icon={Filter} accent="green" /><KpiCard label="Negócios" value={dealData ? integer(dealData.total) : "—"} helper={dealData ? `Bitrix24 · ${commercialLabel}` : "CRM indisponível"} icon={Layers3} /><KpiCard label="Vendas" value={dealData ? integer(dealData.won) : "—"} helper={dealData ? `${dealData.wonRateOfClosed.toFixed(1)}% dos fechados` : "CRM indisponível"} icon={TrendingUp} accent="green" /><KpiCard label="Receita ganha" value={dealData ? brl(revenue) : "—"} helper={dealData ? `Bitrix24 · ${commercialLabel}; sem atribuição por canal` : "CRM indisponível"} icon={DollarSign} accent="green" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">Comparativo de canais</p><h3 className="mt-1 font-semibold">Google Ads × Meta Ads</h3></div><Badge variant="outline" className="border-white/10 text-muted-foreground">Julho/2026</Badge></div><div className="mt-5 space-y-4">{model.platforms.map(item => <div key={item.platform}><div className="mb-2 flex items-center justify-between text-sm"><span>{PLATFORM_LABEL[item.platform]}</span><span className="font-mono-ui text-cyan-100">{brl(item.spend)}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${item.platform === "google_ads" ? "bg-cyan-300" : "bg-violet-300"}`} style={{ width: `${Math.max(2, (item.spend / Math.max(...model.platforms.map(row => row.spend), 1)) * 100)}%` }} /></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{integer(item.leads)} leads</span><span>{integer(item.clicks)} cliques · CPL {brl(ratio(item.spend, item.leads))}</span></div></div>)}</div></div>
      <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">Funil mensurável</p><h3 className="mt-1 font-semibold">Do investimento à receita</h3><div className="mt-5 grid grid-cols-2 gap-3"><FunnelStep label={`Investimento · ${commercialLabel}`} value={dealData ? brl(model.commercialSpend) : brl(model.spend)} /><FunnelStep label={`Leads · ${commercialLabel}`} value={dealData ? integer(model.commercialPlatformLeads) : integer(model.platformLeads)} /><FunnelStep label="Negócios" value={dealData ? integer(dealData.total) : "—"} /><FunnelStep label="Vendas" value={dealData ? integer(dealData.won) : "—"} /><FunnelStep label="Receita" value={dealData ? brl(dealData.wonValue) : "—"} /><FunnelStep label="ROAS atribuído" value="—" /></div><p className="mt-4 text-xs leading-5 text-muted-foreground">Negócios e receita refletem {commercialLabel}. ROAS só será exibido após o vínculo auditável entre mídia, lead, negócio e venda por UTM ou identificador.</p></div></div>
    <CampaignTable campaigns={model.campaigns.slice(0, 8)} maxSpend={maxCampaignSpend} />
    <AttributionAudit rows={attribution} />
  </div>;
}

function CampaignView({ title, campaigns, ads, maxSpend }: { title: string; campaigns: CampaignRow[]; ads: AdRow[]; maxSpend: number }) {
  return <div className="space-y-5"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">Drill-down disponível</p><h3 className="mt-1 text-xl font-bold">{title} · Campanhas</h3><p className="mt-1 text-sm text-muted-foreground">Dados de julho de 2026 por marca, campanha, conjunto/grupo e anúncio. A base executiva continua ancorada no total consolidado por campanha.</p></div><CampaignTable campaigns={campaigns} maxSpend={maxSpend} /><AdDrilldownTable ads={ads} campaignSpend={campaigns.reduce((sum, row) => sum + row.spend, 0)} /></div>;
}

function RevenueViewPanel({ view, setView, dealData, model }: { view: RevenueView; setView: (view: RevenueView) => void; dealData: DealAnalytics | null; model: { spend: number; platformLeads: number; qualifiedLeads: number; commercialSpend: number; commercialPlatformLeads: number; commercialQualifiedLeads: number } }) {
  const views: { id: RevenueView; label: string }[] = [{ id: "pipeline", label: "Pipeline" }, { id: "origin", label: "Origem" }, { id: "sales", label: "Vendas" }, { id: "lost", label: "Perdidos" }, { id: "discard", label: "Descartes" }];
  const discardRows = dealData?.discards.map(item => ({ label: item.label, primary: `${integer(item.count)} descartes`, secondary: brl(item.value) })) ?? [];
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">Revenue</p><h3 className="mt-1 text-xl font-bold">Pipeline comercial por marca</h3></div><div className="flex flex-wrap gap-1">{views.map(item => <Button key={item.id} size="sm" variant={item.id === view ? "secondary" : "outline"} className={item.id === view ? "bg-cyan-200/10 text-cyan-100" : "border-white/10 bg-black/10 text-muted-foreground"} onClick={() => setView(item.id)}>{item.label}</Button>)}</div></div>{!dealData ? <UnavailableCommercial /> : <>{view === "pipeline" ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><FunnelStep label="Leads mídia" value={integer(model.commercialPlatformLeads)} /><FunnelStep label="Qualificados RD" value={integer(model.commercialQualifiedLeads)} /><FunnelStep label="Negócios" value={integer(dealData.total)} /><FunnelStep label="Ganhos" value={integer(dealData.won)} /><FunnelStep label="Receita" value={brl(dealData.wonValue)} /></div> : null}{view === "origin" ? <div className="grid gap-5 xl:grid-cols-2"><Breakdown title="Negócios por origem" rows={dealData.sources.map(item => ({ label: item.label, primary: `${integer(item.count)} negócios`, secondary: brl(item.value) }))} /><div className="space-y-3"><Breakdown title="Sinal UTM por canal" rows={dealData.utmSources.map(item => ({ label: item.label, primary: `${integer(item.count)} negócios`, secondary: brl(item.value) }))} /><p className="rounded-xl border border-amber-200/15 bg-amber-100/5 p-3 text-xs leading-5 text-amber-50/70">UTM identifica somente o canal informado no negócio. Receita atribuída, ROAS e custo por venda continuam bloqueados até o vínculo verificável entre mídia, lead, negócio e venda.</p></div></div> : null}{view === "sales" ? <div className="grid gap-4 sm:grid-cols-3"><KpiCard label="Vendas" value={integer(dealData.won)} helper={`${dealData.wonRateOfClosed.toFixed(1)}% dos fechados`} icon={TrendingUp} accent="green" /><KpiCard label="Receita" value={brl(dealData.wonValue)} helper="Negócios ganhos em julho" icon={DollarSign} accent="green" /><KpiCard label="Custo por venda atribuído" value="—" helper="Matching UTM mídia → venda pendente" icon={MousePointerClick} /></div> : null}{view === "lost" ? <Breakdown title="Negócios perdidos por pipeline" rows={dealData.losses.map(item => ({ label: item.label, primary: `${integer(item.count)} perdas`, secondary: brl(item.value) }))} /> : null}{view === "discard" ? discardRows.length ? <Breakdown title="Descartes por motivo" rows={discardRows} /> : <DataState title="Não há motivos de descarte preenchidos" detail="O campo de motivo de descarte existe no Bitrix24, mas não há valores para a marca e o status selecionados." /> : null}</>}</div>;
}

function BusinessHub({ brand, model, dealData, view, setView }: { brand: Brand; model: { spend: number; platformLeads: number; qualifiedLeads: number; commercialSpend: number; commercialPlatformLeads: number; commercialQualifiedLeads: number }; dealData: DealAnalytics | null; view: RevenueView; setView: (view: RevenueView) => void }) {
  const revenue = dealData?.wonValue ?? 0;
  return <div className="space-y-6"><section className="rounded-2xl border border-cyan-200/15 bg-cyan-300/[.035] p-5"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-cyan-100/70">Visão única de negócio</p><h3 className="mt-1 text-xl font-bold">Do investimento ao resultado comercial</h3><p className="mt-1 text-sm text-muted-foreground">Pipeline, origem, funil, vendas, perdas e descartes no mesmo contexto.</p></div><Badge variant="outline" className="w-fit border-amber-200/20 text-amber-100">ROAS por canal bloqueado</Badge></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><FunnelStep label="Investimento" value={brl(model.commercialSpend)} /><FunnelStep label="Leads" value={integer(model.commercialPlatformLeads)} /><FunnelStep label="Qualificados" value={integer(model.commercialQualifiedLeads)} /><FunnelStep label="Negócios" value={dealData ? integer(dealData.total) : "Indisponível"} /><FunnelStep label="Vendas" value={dealData ? integer(dealData.won) : "Indisponível"} /><FunnelStep label="Receita" value={dealData ? brl(revenue) : "Indisponível"} /></div></section><RevenueViewPanel view={view} setView={setView} dealData={dealData} model={model} /></div>;
}

function OriginFunnel({ brand, model, dealData }: { brand: Brand; model: { spend: number; platformLeads: number; qualifiedLeads: number; commercialSpend: number; commercialPlatformLeads: number; commercialQualifiedLeads: number }; dealData: DealAnalytics | null }) {
  const mediaLeads = dealData ? model.commercialPlatformLeads : model.platformLeads;
  const qualifiedLeads = dealData ? model.commercialQualifiedLeads : model.qualifiedLeads;
  const label = brand === "all" ? "Todas as marcas" : BRAND_LABEL[brand];
  return <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><div className="rounded-2xl border border-white/10 bg-black/15 p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">Funil de qualidade</p><div className="mt-5 space-y-3"><FunnelBar label={`Leads de plataforma · ${label}`} value={mediaLeads} max={mediaLeads} color="bg-cyan-300" /><FunnelBar label={`Leads qualificados RD · ${label}`} value={qualifiedLeads} max={mediaLeads} color="bg-emerald-300" /><FunnelBar label="Negócios Bitrix" value={dealData?.total ?? 0} max={mediaLeads} color="bg-violet-300" /><FunnelBar label="Vendas ganhas" value={dealData?.won ?? 0} max={mediaLeads} color="bg-orange-300" /></div></div>{dealData ? <Breakdown title="Origem × valor de negócio" rows={dealData.sources.map(item => ({ label: item.label, primary: `${integer(item.count)} negócios`, secondary: brl(item.value) }))} /> : <UnavailableCommercial />}</div>;
}

function LossView({ dealData }: { dealData: DealAnalytics | null }) {
  const discardRows = dealData?.discards.map(item => ({ label: item.label, primary: `${integer(item.count)} descartes`, secondary: brl(item.value) })) ?? [];
  const financialRows = dealData?.financialStatuses.map(item => ({ label: item.label, primary: `${integer(item.count)} negócios`, secondary: brl(item.value) })) ?? [];
  return <div className="grid gap-5 2xl:grid-cols-3">{dealData ? <Breakdown title="Perdidos por pipeline" rows={dealData.losses.map(item => ({ label: item.label, primary: `${integer(item.count)} negócios`, secondary: `${integer(item.withObservation)} com observação` }))} /> : <UnavailableCommercial />}{dealData ? discardRows.length ? <Breakdown title="Descartes por motivo" rows={discardRows} /> : <DataState title="Não há motivos de descarte preenchidos" detail="O campo de descarte existe, mas não há valores para este recorte." /> : <UnavailableCommercial />}{dealData ? financialRows.length ? <Breakdown title="Status financeiro" rows={financialRows} /> : <DataState title="Status financeiro indisponível" detail="O campo existe no Bitrix24, mas não há valores para este recorte." /> : <UnavailableCommercial />}</div>;
}

function CampaignTable({ campaigns, maxSpend }: { campaigns: CampaignRow[]; maxSpend: number }) {
  return <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">Campanhas</p><h3 className="mt-1 font-semibold">Eficiência por investimento</h3></div><Layers3 className="h-5 w-5 text-cyan-200" /></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-white/[.03] text-[10px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Campanha</th><th className="px-4 py-3 font-medium">Canal</th><th className="px-4 py-3 font-medium">Investimento</th><th className="px-4 py-3 font-medium">Leads</th><th className="px-4 py-3 font-medium">CPL</th><th className="px-4 py-3 font-medium">Escala</th></tr></thead><tbody>{campaigns.map(item => <tr key={`${item.platform}-${item.campaignId}-${item.brand}`} className="border-t border-white/5"><td className="max-w-72 px-5 py-4"><p className="truncate font-medium text-foreground">{item.campaignName}</p><p className="mt-1 font-mono-ui text-[10px] text-muted-foreground">{item.brand}</p></td><td className="px-4 py-4"><Badge variant="outline" className="border-white/10 text-muted-foreground">{PLATFORM_LABEL[item.platform]}</Badge></td><td className="px-4 py-4 text-cyan-100">{brl(item.spend)}</td><td className="px-4 py-4">{integer(item.leads)}</td><td className="px-4 py-4">{brl(ratio(item.spend, item.leads))}</td><td className="px-4 py-4"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.max(3, (item.spend / maxSpend) * 100)}%` }} /></div></td></tr>)}</tbody></table></div></div>;
}

function AdDrilldownTable({ ads, campaignSpend }: { ads: AdRow[]; campaignSpend: number }) {
  const adSpend = ads.reduce((sum, row) => sum + row.spend, 0);
  const coverage = ratio(adSpend, campaignSpend);
  return <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15"><div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">Grupos e anúncios</p><h3 className="mt-1 font-semibold">Detalhe por criativo</h3></div><Badge variant="outline" className={coverage >= .98 ? "border-emerald-300/20 text-emerald-100" : "border-amber-200/20 text-amber-100"}>{coverage >= .98 ? "Cobertura granular completa" : `Cobertura granular ${Math.round(coverage * 100)}%`}</Badge></div>{ads.length === 0 ? <div className="p-5 text-sm text-muted-foreground">Não há registros granulares de anúncio para este recorte.</div> : <><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-white/[.03] text-[10px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Campanha</th><th className="px-4 py-3 font-medium">Grupo / conjunto</th><th className="px-4 py-3 font-medium">Anúncio</th><th className="px-4 py-3 font-medium">Investimento</th><th className="px-4 py-3 font-medium">Leads</th><th className="px-4 py-3 font-medium">CPL</th></tr></thead><tbody>{ads.slice(0, 30).map(row => <tr key={`${row.platform}-${row.brand}-${row.adId}`} className="border-t border-white/5"><td className="max-w-52 px-5 py-4"><p className="truncate text-foreground">{row.campaignName}</p><p className="mt-1 font-mono-ui text-[10px] text-muted-foreground">{row.brand}</p></td><td className="max-w-52 px-4 py-4"><p className="truncate text-foreground">{row.adGroupName}</p></td><td className="max-w-64 px-4 py-4"><p className="line-clamp-2 text-foreground">{row.adName}</p></td><td className="px-4 py-4 text-cyan-100">{brl(row.spend)}</td><td className="px-4 py-4">{integer(row.leads)}</td><td className="px-4 py-4">{brl(ratio(row.spend, row.leads))}</td></tr>)}</tbody></table></div>{coverage < .98 ? <p className="border-t border-amber-200/10 bg-amber-100/5 px-5 py-3 text-xs leading-5 text-amber-50/70">A granularidade por anúncio não cobre integralmente o total consolidado deste canal. Os KPIs, comparativos e CPL executivo usam exclusivamente os registros completos por campanha.</p> : null}</>}</div>;
}

function AttributionAudit({ rows }: { rows: AttributionRow[] }) {
  const identified = rows.filter(row => row.matchStatus === "identified").reduce((sum, row) => sum + row.count, 0);
  const signals = rows.filter(row => row.matchStatus === "channel_signal").reduce((sum, row) => sum + row.count, 0);
  const unidentified = rows.filter(row => row.matchStatus === "not_identified").reduce((sum, row) => sum + row.count, 0);
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">Trilha de atribuição</p><h3 className="mt-1 font-semibold">Cobertura auditável</h3></div><Badge variant="outline" className="border-amber-200/20 text-amber-100">ROAS bloqueado</Badge></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><FunnelStep label="Vínculos completos" value={integer(identified)} /><FunnelStep label="Sinais UTM de canal" value={integer(signals)} /><FunnelStep label="Não identificados" value={integer(unidentified)} /></div><p className="mt-4 text-xs leading-5 text-muted-foreground">O painel registra o sinal de UTM presente no negócio, mas só calcula receita por canal após encontrar identificadores que vinculem mídia, lead, negócio e venda de forma verificável.</p></div>;
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; primary: string; secondary: string }[] }) {
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">Análise de origem</p><h3 className="mt-1 font-semibold">{title}</h3><div className="mt-5 space-y-3">{rows.map(row => <div key={row.label} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"><p className="text-sm text-foreground">{row.label}</p><div className="text-right"><p className="text-sm text-cyan-100">{row.primary}</p><p className="mt-1 text-xs text-muted-foreground">{row.secondary}</p></div></div>)}</div></div>;
}

function FunnelStep({ label, value }: { label: string; value: string }) {
  const displayValue = value === "—" ? "Indisponível" : value;
  return <div className="rounded-xl border border-white/10 bg-white/[.025] p-3"><p className="font-mono-ui text-[9px] uppercase tracking-[.11em] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold">{displayValue}</p></div>;
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return <div><div className="flex items-center justify-between text-sm"><span>{label}</span><span className="font-mono-ui text-cyan-100">{integer(value)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(value > 0 ? 2 : 0, Math.min(100, ratio(value, max) * 100))}%` }} /></div></div>;
}

function UnavailableCommercial() {
  return <div className="rounded-2xl border border-amber-200/15 bg-amber-100/5 p-5"><CircleAlert className="h-5 w-5 text-amber-200" /><h3 className="mt-3 font-semibold text-amber-50">Camada comercial indisponível para esta marca</h3><p className="mt-2 text-sm leading-6 text-amber-50/70">A integração Bitrix24 está conectada somente à Medsystems. O painel mantém os dados de mídia da BeautySystems separados e não inventa negócios, receita ou ROAS comercial onde não há CRM conectado.</p></div>;
}

function DataState({ title, detail }: { title: string; detail: string }) {
  return <div className="grid min-h-80 place-items-center px-5 text-center"><div className="max-w-md rounded-2xl border border-amber-200/15 bg-amber-100/5 p-6"><CircleAlert className="mx-auto h-5 w-5 text-amber-200" /><h3 className="mt-3 font-semibold text-amber-50">{title}</h3><p className="mt-2 text-sm leading-6 text-amber-50/70">{detail}</p></div></div>;
}
