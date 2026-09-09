import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Activity, ArrowUpRight, BarChart3, CalendarDays, CircleDollarSign, Filter, Images, Lightbulb, MousePointerClick, Search, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Brand = "all" | "medsystems" | "beautysystems";
type Platform = "google_ads" | "meta_ads";

const PLATFORM_COPY = {
  google_ads: { name: "Google Ads", accent: "cyan", description: "Investimento, leads e distribuição de verba por campanha no período selecionado." },
  meta_ads: { name: "Meta Ads", accent: "violet", description: "Investimento, leads, distribuição de verba e anúncios com status efetivo ativo." },
} as const;

const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);
const integer = (value: number) => Math.round(value || 0).toLocaleString("pt-BR");
const percent = (value: number) => `${(value || 0).toFixed(1).replace(".", ",")}%`;
const BRAND_LABEL: Record<Brand, string> = { all: "Todas as marcas", medsystems: "Medsystems", beautysystems: "BeautySystems" };

function yesterdayInSaoPaulo() {
  const date = new Date(Date.now() - 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function MediaChannelDashboard({ platform, brand, onBrandChange }: { platform: Platform; brand: Brand; onBrandChange: (value: Brand) => void }) {
  const copy = PLATFORM_COPY[platform];
  const defaultEnd = useMemo(yesterdayInSaoPaulo, []);
  const defaultStart = `${defaultEnd.slice(0, 8)}01`;
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [campaignId, setCampaignId] = useState("all");
  useEffect(() => setCampaignId("all"), [brand, platform, startDate, endDate]);

  const query = trpc.analytics.channelDashboard.useQuery({
    platform,
    brand,
    startDate,
    endDate,
    campaignId: campaignId === "all" ? undefined : campaignId,
  }, { retry: 1, staleTime: 5 * 60_000, refetchOnWindowFocus: false });
  const data = query.data;

  const insights = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Maior verba", value: data.insights.topSpendCampaign?.campaignName ?? "Sem campanha", detail: data.insights.topSpendCampaign ? `${brl(data.insights.topSpendCampaign.spend)} · ${percent(data.insights.topSpendCampaign.spendShare)}` : "Sem investimento no filtro." },
      { label: "Mais leads", value: data.insights.topLeadCampaign?.campaignName ?? "Sem campanha", detail: data.insights.topLeadCampaign ? `${integer(data.insights.topLeadCampaign.leads)} leads de plataforma` : "Sem leads no filtro." },
      { label: "Concentração de verba", value: percent(data.insights.topThreeSpendShare), detail: "Participação das três campanhas com maior investimento." },
      { label: "Campanhas sem lead", value: integer(data.insights.campaignsWithoutLeads), detail: "Campanhas com investimento e zero leads de plataforma no período." },
    ];
  }, [data]);

  const applyDates = () => {
    if (draftStart > draftEnd) return;
    setStartDate(draftStart);
    setEndDate(draftEnd);
  };

  if (query.isLoading && !data) return <LoadingState platform={copy.name} />;
  if (query.isError) return <EmptyState title={`Não foi possível carregar ${copy.name}`} detail={query.error.message || "A consulta não respondeu."} />;
  if (!data) return <EmptyState title={`${copy.name} indisponível`} detail="Não houve retorno para o recorte selecionado." />;

  return <div className="space-y-5">
    <section className={`overflow-hidden rounded-[28px] border p-5 shadow-2xl sm:p-6 ${platform === "google_ads" ? "border-cyan-200/15 bg-[radial-gradient(circle_at_88%_10%,rgba(34,211,238,.17),transparent_32%),radial-gradient(circle_at_8%_90%,rgba(59,130,246,.11),transparent_30%),linear-gradient(135deg,#071421,#091a2b_52%,#06111c)] shadow-cyan-950/20" : "border-violet-200/15 bg-[radial-gradient(circle_at_88%_10%,rgba(167,139,250,.2),transparent_32%),radial-gradient(circle_at_8%_90%,rgba(34,211,238,.1),transparent_30%),linear-gradient(135deg,#100d24,#11182d_52%,#080e1d)] shadow-violet-950/20"}`}>
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl"><div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-white/15 bg-white/[.04] text-white">{copy.name} · command center</Badge><Badge variant="outline" className="border-emerald-200/20 bg-emerald-200/[.05] text-emerald-100">Nível campanha · sem duplicidade</Badge></div><h3 className="mt-4 text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">Performance de {copy.name}</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{copy.description}</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-[1fr_1fr_auto]"><DateField label="Data inicial" value={draftStart} onChange={setDraftStart} max={defaultEnd} /><DateField label="Data final" value={draftEnd} onChange={setDraftEnd} min={draftStart} max={defaultEnd} /><Button onClick={applyDates} disabled={draftStart > draftEnd} className="h-11 self-end bg-white text-slate-950 hover:bg-slate-100"><Filter className="mr-2 h-4 w-4" />Aplicar</Button></div>
      </div>
      <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/15 p-4 xl:grid-cols-[auto_1fr_auto] xl:items-end">
        <div><span className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-white/45">Marca</span><div className="mt-2 flex flex-wrap gap-2">{(["all", "medsystems", "beautysystems"] as Brand[]).map(option => <BrandPill key={option} active={brand === option} label={BRAND_LABEL[option]} onClick={() => onBrandChange(option)} />)}</div></div>
        <label className="block min-w-0"><span className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-white/45">Campanha</span><select aria-label={`Filtrar campanhas de ${copy.name}`} value={campaignId} onChange={event => setCampaignId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-200/35"><option value="all">Todas as campanhas · {data.campaignOptions.length}</option>{data.campaignOptions.map(item => <option key={`${item.brand}-${item.campaignId}`} value={item.campaignId}>{item.campaignName} · {brl(item.spend)}</option>)}</select></label>
        <div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-white/10 text-white/70">{startDate.split("-").reverse().join("/")}–{endDate.split("-").reverse().join("/")}</Badge><Button variant="outline" size="sm" className="border-white/10 bg-black/10 text-muted-foreground" onClick={() => { setDraftStart(defaultStart); setDraftEnd(defaultEnd); setStartDate(defaultStart); setEndDate(defaultEnd); setCampaignId("all"); }}>Mês atual</Button></div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><MediaKpi icon={CircleDollarSign} label="Investimento" value={brl(data.totals.spend)} helper={`${integer(data.totals.campaigns)} campanhas no filtro`} /><MediaKpi icon={Target} label="Leads" value={integer(data.totals.leads)} helper="Resultado reportado pela plataforma" /><MediaKpi icon={MousePointerClick} label="CPL" value={data.totals.cpl == null ? "Indisponível" : brl(data.totals.cpl)} helper="Investimento ÷ leads de plataforma" /><MediaKpi icon={Activity} label="Cliques" value={integer(data.totals.clicks)} helper={data.totals.ctr == null ? "CTR indisponível" : `CTR ${percent(data.totals.ctr)}`} />{platform === "meta_ads" ? <MediaKpi icon={Images} label="Criativos ativos" value={integer(data.totals.activeCreatives)} helper={`Status em ${data.methodology.activeStatusAsOf?.split("-").reverse().join("/")}`} /> : <MediaKpi icon={CalendarDays} label="Cobertura" value={data.period.dataEnd?.split("-").reverse().join("/") ?? "Indisponível"} helper="Última data encontrada" />}</div>
    </section>

    {data.totals.spend <= 0 ? <EmptyState title="Sem investimento no filtro" detail="Ajuste as datas, a marca ou a campanha para visualizar dados." /> : <>
      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><DailyChart rows={data.byDay} platform={platform} /><CampaignDistribution rows={data.campaigns} totalSpend={data.totals.spend} /></section>
      <section className="rounded-3xl border border-white/10 bg-black/15 p-5"><PanelHeader eyebrow="Leitura por campanha" title="Verba, leads e eficiência" detail="CPL calculado somente quando a plataforma reporta ao menos um lead." /><div className="premium-scrollbar mt-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="text-[10px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="pb-3 pr-4">Campanha</th><th className="pb-3 pr-4">Marca</th><th className="pb-3 pr-4 text-right">Verba</th><th className="pb-3 pr-4 text-right">Participação</th><th className="pb-3 pr-4 text-right">Leads</th><th className="pb-3 text-right">CPL</th></tr></thead><tbody>{data.campaigns.map(item => <tr key={`${item.brand}-${item.campaignId}`} className="border-t border-white/6"><td className="max-w-[360px] py-3 pr-4 font-medium text-white"><button className="text-left hover:text-cyan-100" onClick={() => setCampaignId(item.campaignId)}>{item.campaignName}</button></td><td className="py-3 pr-4 text-muted-foreground">{item.brand === "medsystems" ? "Medsystems" : "BeautySystems"}</td><td className="py-3 pr-4 text-right font-mono-ui text-cyan-100">{brl(item.spend)}</td><td className="py-3 pr-4 text-right">{percent(item.spendShare)}</td><td className="py-3 pr-4 text-right">{integer(item.leads)}</td><td className="py-3 text-right">{item.cpl == null ? "Indisponível" : brl(item.cpl)}</td></tr>)}</tbody></table></div></section>
      {platform === "meta_ads" ? <ActiveCreatives rows={data.activeCreatives} campaignId={campaignId} statusAsOf={data.methodology.activeStatusAsOf} /> : null}
      <section className="rounded-2xl border border-amber-200/15 bg-[linear-gradient(135deg,rgba(251,191,36,.07),rgba(251,191,36,.015))] p-5"><div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-200" /><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-amber-100/75">Leituras gerenciais</p></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{insights.map(item => <article key={item.label} className="rounded-xl border border-amber-100/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-amber-100/65">{item.label}</p><p className="mt-2 truncate text-base font-bold text-white" title={item.value}>{item.value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p></article>)}</div><p className="mt-4 text-xs leading-5 text-amber-50/65">São sinais para investigação, não comandos automáticos de otimização. {platform === "meta_ads" && !data.methodology.officialRecommendationsAvailable ? "As recomendações oficiais da Meta não estão disponíveis no conector atual." : "A decisão de verba deve considerar orçamento, objetivo e contexto comercial."}</p></section>
    </>}
  </div>;
}

function DateField({ label, value, onChange, min, max }: { label: string; value: string; onChange: (value: string) => void; min?: string; max?: string }) { const open = (event: React.MouseEvent<HTMLLabelElement>) => { if ((event.target as HTMLElement).tagName === "INPUT") return; event.preventDefault(); const input = event.currentTarget.querySelector("input"); input?.focus(); input?.showPicker?.(); }; return <label onClick={open} className="cursor-pointer"><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/55">{label}</span><input aria-label={label} type="date" value={value} min={min} max={max} onClick={event => event.currentTarget.showPicker?.()} onChange={event => onChange(event.target.value)} className="dashboard-date-input mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-200/35" /></label>; }
function BrandPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) { return <button type="button" onClick={onClick} className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-200 active:scale-[.97] ${active ? "border-cyan-200/40 bg-cyan-200/15 text-cyan-50" : "border-white/10 bg-white/[.025] text-slate-400 hover:border-white/20 hover:text-white"}`}>{label}</button>; }
function MediaKpi({ icon: Icon, label, value, helper }: { icon: typeof Target; label: string; value: string; helper: string }) { return <article className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-200/10 text-cyan-200"><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-xs text-muted-foreground">{helper}</p></article>; }
function PanelHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) { return <div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-cyan-100/60">{eyebrow}</p><h4 className="mt-1 text-lg font-bold text-white">{title}</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>; }

function DailyChart({ rows, platform }: { rows: { date: string; spend: number; leads: number }[]; platform: Platform }) {
  const width = Math.max(720, rows.length * 48); const height = 250; const maxSpend = Math.max(1, ...rows.map(item => item.spend)); const maxLeads = Math.max(1, ...rows.map(item => item.leads));
  const points = rows.map((item, index) => `${28 + index * 46 + 14},${210 - (item.leads / maxLeads) * 165}`).join(" ");
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><PanelHeader eyebrow="Evolução diária" title="Investimento × leads" detail="Escalas independentes: barras para investimento e linha para leads de plataforma." /><div className="mt-5 overflow-x-auto"><svg role="img" aria-label="Gráfico diário de investimento e leads" viewBox={`0 0 ${width} ${height}`} className="h-[250px] min-w-[720px] w-full"><line x1="24" y1="210" x2={width - 10} y2="210" stroke="rgba(255,255,255,.1)" />{rows.map((item, index) => { const x = 28 + index * 46; const barHeight = (item.spend / maxSpend) * 165; return <g key={item.date}><rect x={x} y={210 - barHeight} width="28" height={Math.max(2, barHeight)} rx="6" fill={platform === "google_ads" ? "#22d3ee" : "#a78bfa"} opacity=".78"><title>{`${item.date}: ${brl(item.spend)} · ${integer(item.leads)} leads`}</title></rect><text x={x + 14} y="232" textAnchor="middle" fill="#94a3b8" fontSize="9">{item.date.slice(8, 10)}</text></g>; })}<polyline points={points} fill="none" stroke="#86efac" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />{rows.map((item, index) => <circle key={`lead-${item.date}`} cx={28 + index * 46 + 14} cy={210 - (item.leads / maxLeads) * 165} r="4" fill="#86efac"><title>{`${item.date}: ${integer(item.leads)} leads`}</title></circle>)}</svg></div><div className="mt-2 flex gap-4 text-[10px] uppercase tracking-[.1em] text-muted-foreground"><span><i className={`mr-2 inline-block h-2 w-2 rounded-sm ${platform === "google_ads" ? "bg-cyan-300" : "bg-violet-300"}`} />Investimento</span><span><i className="mr-2 inline-block h-0.5 w-3 bg-emerald-300 align-middle" />Leads</span></div></div>;
}

function CampaignDistribution({ rows, totalSpend }: { rows: { campaignId: string; campaignName: string; spend: number; spendShare: number }[]; totalSpend: number }) {
  return <div className="rounded-3xl border border-white/10 bg-black/15 p-5"><PanelHeader eyebrow="Alocação" title="Distribuição de verba" detail={`${brl(totalSpend)} distribuídos entre as campanhas do filtro.`} /><div className="mt-5 space-y-3">{rows.slice(0, 8).map((item, index) => <div key={item.campaignId}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-sm text-slate-300" title={item.campaignName}>{item.campaignName}</span><span className="shrink-0 font-mono-ui text-xs text-white">{brl(item.spend)} · {percent(item.spendShare)}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className={index === 0 ? "h-full rounded-full bg-cyan-300" : index === 1 ? "h-full rounded-full bg-violet-300" : "h-full rounded-full bg-emerald-300"} style={{ width: `${Math.max(2, item.spendShare)}%` }} /></div></div>)}</div></div>;
}

type CreativeRow = {
  brand: "medsystems" | "beautysystems";
  campaignId: string;
  campaignName: string;
  adsetId: string;
  adsetName: string;
  adId: string;
  adName: string;
  effectiveStatus: "ACTIVE";
  statusAsOf: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
  cpl: number | null;
  ctr: number | null;
  metricsThrough: string | null;
};

function ActiveCreatives({ rows, campaignId, statusAsOf }: { rows: CreativeRow[]; campaignId: string; statusAsOf: string | null }) {
  const [adsetId, setAdsetId] = useState("all");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(12);
  useEffect(() => { setAdsetId("all"); setSearch(""); setVisible(12); }, [campaignId, statusAsOf]);
  const adsets = useMemo(() => {
    const grouped = new Map<string, { id: string; label: string; campaignName: string; count: number }>();
    rows.forEach(item => { const current = grouped.get(item.adsetId) ?? { id: item.adsetId, label: item.adsetName, campaignName: item.campaignName, count: 0 }; current.count += 1; grouped.set(item.adsetId, current); });
    return Array.from(grouped.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [rows]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return rows.filter(item => (adsetId === "all" || item.adsetId === adsetId) && (!term || [item.adName, item.adsetName, item.campaignName].some(value => value.toLocaleLowerCase("pt-BR").includes(term))));
  }, [rows, adsetId, search]);
  const displayed = filtered.slice(0, visible);

  return <section className="overflow-hidden rounded-[28px] border border-violet-200/15 bg-[radial-gradient(circle_at_90%_0%,rgba(167,139,250,.14),transparent_35%),linear-gradient(145deg,rgba(16,13,36,.96),rgba(8,14,29,.98))] shadow-2xl shadow-violet-950/20">
    <div className="border-b border-white/10 p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><PanelHeader eyebrow="Criativos Meta" title="Galeria de anúncios ativos" detail={campaignId === "all" ? "Miniaturas reais, estrutura campanha → conjunto → anúncio e desempenho agregado no período selecionado." : "Criativos ativos da campanha selecionada, com métricas no nível de anúncio."} /><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="w-fit border-emerald-200/20 bg-emerald-200/[.06] text-emerald-100">Status em {statusAsOf?.split("-").reverse().join("/") ?? "data indisponível"}</Badge><Badge variant="outline" className="border-violet-200/20 bg-violet-200/[.06] text-violet-100">{integer(filtered.length)} criativos</Badge></div></div>
      {rows.length ? <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.7fr)]"><label className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-100/55" /><input aria-label="Buscar criativo Meta" value={search} onChange={event => { setSearch(event.target.value); setVisible(12); }} placeholder="Buscar campanha, conjunto ou anúncio…" className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-200/30 focus:ring-2 focus:ring-violet-200/20" /></label><label><span className="sr-only">Filtrar por conjunto de anúncios</span><select aria-label="Filtrar por conjunto de anúncios" value={adsetId} onChange={event => { setAdsetId(event.target.value); setVisible(12); }} className="h-12 w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 text-sm text-white outline-none focus:border-violet-200/30 focus:ring-2 focus:ring-violet-200/20"><option value="all">Todos os conjuntos · {rows.length}</option>{adsets.map(item => <option key={item.id} value={item.id}>{item.label}{campaignId === "all" ? ` · ${item.campaignName}` : ""} · {item.count}</option>)}</select></label></div> : null}
    </div>
    {rows.length && filtered.length ? <><div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 2xl:grid-cols-3">{displayed.map(item => <CreativeCard key={item.adId} item={item} />)}</div>{visible < filtered.length ? <div className="border-t border-white/8 p-5 text-center"><Button variant="outline" onClick={() => setVisible(current => current + 12)} className="border-violet-200/20 bg-violet-200/[.05] text-violet-50 hover:bg-violet-200/10">Carregar mais {Math.min(12, filtered.length - visible)} criativos</Button></div> : null}</> : rows.length ? <div className="p-5"><EmptyState title="Nenhum criativo encontrado" detail="Ajuste a busca ou o filtro de conjunto para visualizar os anúncios ativos." /></div> : <div className="p-5"><EmptyState title="Nenhum criativo ativo identificado" detail="A fonte não encontrou anúncios ativos para a marca, campanha e período selecionados." /></div>}
  </section>;
}

function CreativeCard({ item }: { item: CreativeRow }) { return <article className="group overflow-hidden rounded-2xl border border-white/10 bg-black/25 transition duration-200 hover:-translate-y-0.5 hover:border-violet-200/25 hover:shadow-xl hover:shadow-violet-950/20"><CreativeImage src={item.thumbnailUrl} alt={`Miniatura do anúncio ${item.adName}`} /><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="line-clamp-2 text-sm font-bold leading-5 text-white" title={item.adName}>{item.adName}</p><p className="mt-1 line-clamp-1 text-[11px] text-violet-100/70" title={item.adsetName}>{item.adsetName}</p></div><Badge variant="outline" className="shrink-0 border-emerald-200/20 bg-emerald-200/[.05] text-[10px] text-emerald-100">Ativo</Badge></div><p className="mt-3 line-clamp-1 border-t border-white/8 pt-3 text-[11px] text-muted-foreground" title={item.campaignName}>{item.campaignName}</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><CreativeMetric label="Verba" value={brl(item.spend)} /><CreativeMetric label="Leads" value={integer(item.leads)} /><CreativeMetric label="CPL" value={item.cpl == null ? "—" : brl(item.cpl)} /><CreativeMetric label="CTR" value={item.ctr == null ? "—" : percent(item.ctr)} /></div><div className="mt-4 flex items-center justify-between gap-3 text-[11px]"><span className="text-muted-foreground">{integer(item.impressions)} imp. · {integer(item.clicks)} cliques</span>{item.previewUrl ? <a href={item.previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-violet-100 transition-colors hover:text-white">Abrir anúncio <ArrowUpRight className="h-3.5 w-3.5" /></a> : <span className="text-muted-foreground">Prévia indisponível</span>}</div></div></article>; }
function CreativeImage({ src, alt }: { src: string | null; alt: string }) { const [failed, setFailed] = useState(false); return <div className="relative aspect-[16/10] overflow-hidden border-b border-white/8 bg-[radial-gradient(circle_at_50%_30%,rgba(167,139,250,.18),transparent_55%),#090f1d]">{src && !failed ? <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" /> : <div className="grid h-full place-items-center text-center"><div><Images className="mx-auto h-7 w-7 text-violet-200/55" /><p className="mt-2 text-xs text-muted-foreground">Imagem indisponível</p></div></div>}<span className="absolute left-3 top-3 rounded-full border border-black/20 bg-black/65 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-white backdrop-blur">{src && !failed ? "Criativo" : "Sem imagem"}</span></div>; }
function CreativeMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/7 bg-white/[.035] px-2.5 py-2"><p className="text-[8px] uppercase tracking-[.1em] text-muted-foreground">{label}</p><p className="mt-1 truncate font-mono-ui text-[11px] font-bold text-white" title={value}>{value}</p></div>; }

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/6 bg-white/[.025] p-2"><p className="text-[9px] uppercase tracking-[.1em] text-muted-foreground">{label}</p><p className="mt-1 truncate text-xs font-semibold text-white">{value}</p></div>; }
function LoadingState({ platform }: { platform: string }) { return <section className="grid min-h-[420px] place-items-center rounded-2xl border border-white/10 bg-black/15"><div className="text-center"><BarChart3 className="mx-auto h-7 w-7 animate-pulse text-cyan-200" /><p className="mt-3 text-sm text-muted-foreground">Montando a visão de {platform}…</p></div></section>; }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <section className="grid min-h-52 place-items-center rounded-2xl border border-white/10 bg-black/15 p-8 text-center"><div><BarChart3 className="mx-auto h-7 w-7 text-cyan-200" /><h4 className="mt-3 font-bold text-white">{title}</h4><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{detail}</p></div></section>; }
