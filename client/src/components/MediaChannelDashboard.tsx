import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Activity, ArrowUpRight, BarChart3, CalendarDays, CircleDollarSign, Filter, Images, Lightbulb, MousePointerClick, Target } from "lucide-react";
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

export function MediaChannelDashboard({ platform, brand }: { platform: Platform; brand: Brand }) {
  const copy = PLATFORM_COPY[platform];
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-08-19");
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
  }, { refetchInterval: 60_000 });
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
    <section className={`overflow-hidden rounded-3xl border p-5 sm:p-6 ${platform === "google_ads" ? "border-cyan-200/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.14),transparent_36%),linear-gradient(135deg,rgba(8,29,46,.98),rgba(7,17,29,.96))]" : "border-violet-200/15 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,.16),transparent_36%),linear-gradient(135deg,rgba(27,19,52,.98),rgba(9,15,29,.96))]"}`}>
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl"><div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-white/15 bg-white/[.04] text-white">{copy.name} · visão gerencial</Badge><Badge variant="outline" className="border-emerald-200/20 bg-emerald-200/[.05] text-emerald-100">Nível campanha · sem duplicidade</Badge></div><h3 className="mt-4 text-2xl font-black tracking-[-.04em] text-white sm:text-3xl">Performance por período e campanha</h3><p className="mt-2 text-sm leading-6 text-slate-300">{copy.description}</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[550px] xl:grid-cols-[1fr_1fr_auto]"><DateField label="Data inicial" value={draftStart} onChange={setDraftStart} max="2026-08-19" /><DateField label="Data final" value={draftEnd} onChange={setDraftEnd} min={draftStart} max="2026-08-19" /><Button onClick={applyDates} disabled={draftStart > draftEnd} className="h-11 self-end bg-white text-slate-950 hover:bg-slate-100"><Filter className="mr-2 h-4 w-4" />Aplicar</Button></div>
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="block min-w-0 flex-1"><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/55">Campanha</span><select aria-label={`Filtrar campanhas de ${copy.name}`} value={campaignId} onChange={event => setCampaignId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-200/35"><option value="all">Todas as campanhas · {data.campaignOptions.length}</option>{data.campaignOptions.map(item => <option key={`${item.brand}-${item.campaignId}`} value={item.campaignId}>{item.campaignName} · {brl(item.spend)}</option>)}</select></label>
        <div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-white/10 text-white/70">Filtro: {startDate.split("-").reverse().join("/")}–{endDate.split("-").reverse().join("/")}</Badge><Button variant="outline" size="sm" className="border-white/10 bg-black/10 text-muted-foreground" onClick={() => { setDraftStart("2026-08-01"); setDraftEnd("2026-08-19"); setStartDate("2026-08-01"); setEndDate("2026-08-19"); setCampaignId("all"); }}>Mês atual</Button></div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><MediaKpi icon={CircleDollarSign} label="Investimento" value={brl(data.totals.spend)} helper={`${integer(data.totals.campaigns)} campanhas no filtro`} /><MediaKpi icon={Target} label="Leads" value={integer(data.totals.leads)} helper="Resultado reportado pela plataforma" /><MediaKpi icon={MousePointerClick} label="CPL" value={data.totals.cpl == null ? "Indisponível" : brl(data.totals.cpl)} helper="Investimento ÷ leads de plataforma" /><MediaKpi icon={Activity} label="Cliques" value={integer(data.totals.clicks)} helper={data.totals.ctr == null ? "CTR indisponível" : `CTR ${percent(data.totals.ctr)}`} />{platform === "meta_ads" ? <MediaKpi icon={Images} label="Criativos ativos" value={integer(data.totals.activeCreatives)} helper={`Status em ${data.methodology.activeStatusAsOf?.split("-").reverse().join("/")}`} /> : <MediaKpi icon={CalendarDays} label="Cobertura" value={data.period.dataEnd?.split("-").reverse().join("/") ?? "Indisponível"} helper="Última data encontrada" />}</div>
    </section>

    {data.totals.spend <= 0 ? <EmptyState title="Sem investimento no filtro" detail="Ajuste as datas, a marca ou a campanha para visualizar dados." /> : <>
      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><DailyChart rows={data.byDay} platform={platform} /><CampaignDistribution rows={data.campaigns} totalSpend={data.totals.spend} /></section>
      <section className="rounded-2xl border border-white/10 bg-black/15 p-5"><PanelHeader eyebrow="Leitura por campanha" title="Verba, leads e eficiência" detail="CPL calculado somente quando a plataforma reporta ao menos um lead." /><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="text-[10px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="pb-3 pr-4">Campanha</th><th className="pb-3 pr-4">Marca</th><th className="pb-3 pr-4 text-right">Verba</th><th className="pb-3 pr-4 text-right">Participação</th><th className="pb-3 pr-4 text-right">Leads</th><th className="pb-3 text-right">CPL</th></tr></thead><tbody>{data.campaigns.map(item => <tr key={`${item.brand}-${item.campaignId}`} className="border-t border-white/6"><td className="max-w-[360px] py-3 pr-4 font-medium text-white"><button className="text-left hover:text-cyan-100" onClick={() => setCampaignId(item.campaignId)}>{item.campaignName}</button></td><td className="py-3 pr-4 text-muted-foreground">{item.brand === "medsystems" ? "Medsystems" : "BeautySystems"}</td><td className="py-3 pr-4 text-right font-mono-ui text-cyan-100">{brl(item.spend)}</td><td className="py-3 pr-4 text-right">{percent(item.spendShare)}</td><td className="py-3 pr-4 text-right">{integer(item.leads)}</td><td className="py-3 text-right">{item.cpl == null ? "Indisponível" : brl(item.cpl)}</td></tr>)}</tbody></table></div></section>
      {platform === "meta_ads" ? <ActiveCreatives rows={data.activeCreatives} campaignId={campaignId} statusAsOf={data.methodology.activeStatusAsOf} /> : null}
      <section className="rounded-2xl border border-amber-200/15 bg-[linear-gradient(135deg,rgba(251,191,36,.07),rgba(251,191,36,.015))] p-5"><div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-200" /><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-amber-100/75">Leituras gerenciais</p></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{insights.map(item => <article key={item.label} className="rounded-xl border border-amber-100/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-amber-100/65">{item.label}</p><p className="mt-2 truncate text-base font-bold text-white" title={item.value}>{item.value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p></article>)}</div><p className="mt-4 text-xs leading-5 text-amber-50/65">São sinais para investigação, não comandos automáticos de otimização. {platform === "meta_ads" && !data.methodology.officialRecommendationsAvailable ? "As recomendações oficiais da Meta não estão disponíveis no conector atual." : "A decisão de verba deve considerar orçamento, objetivo e contexto comercial."}</p></section>
    </>}
  </div>;
}

function DateField({ label, value, onChange, min, max }: { label: string; value: string; onChange: (value: string) => void; min?: string; max?: string }) { return <label><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/55">{label}</span><input aria-label={label} type="date" value={value} min={min} max={max} onChange={event => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-200/35" /></label>; }
function MediaKpi({ icon: Icon, label, value, helper }: { icon: typeof Target; label: string; value: string; helper: string }) { return <article className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-200/10 text-cyan-200"><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-xs text-muted-foreground">{helper}</p></article>; }
function PanelHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) { return <div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-cyan-100/60">{eyebrow}</p><h4 className="mt-1 text-lg font-bold text-white">{title}</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>; }

function DailyChart({ rows, platform }: { rows: { date: string; spend: number; leads: number }[]; platform: Platform }) {
  const width = Math.max(720, rows.length * 48); const height = 250; const maxSpend = Math.max(1, ...rows.map(item => item.spend)); const maxLeads = Math.max(1, ...rows.map(item => item.leads));
  const points = rows.map((item, index) => `${28 + index * 46 + 14},${210 - (item.leads / maxLeads) * 165}`).join(" ");
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><PanelHeader eyebrow="Evolução diária" title="Investimento × leads" detail="Escalas independentes: barras para investimento e linha para leads de plataforma." /><div className="mt-5 overflow-x-auto"><svg role="img" aria-label="Gráfico diário de investimento e leads" viewBox={`0 0 ${width} ${height}`} className="h-[250px] min-w-[720px] w-full"><line x1="24" y1="210" x2={width - 10} y2="210" stroke="rgba(255,255,255,.1)" />{rows.map((item, index) => { const x = 28 + index * 46; const barHeight = (item.spend / maxSpend) * 165; return <g key={item.date}><rect x={x} y={210 - barHeight} width="28" height={Math.max(2, barHeight)} rx="6" fill={platform === "google_ads" ? "#22d3ee" : "#a78bfa"} opacity=".78"><title>{`${item.date}: ${brl(item.spend)} · ${integer(item.leads)} leads`}</title></rect><text x={x + 14} y="232" textAnchor="middle" fill="#94a3b8" fontSize="9">{item.date.slice(8, 10)}</text></g>; })}<polyline points={points} fill="none" stroke="#86efac" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />{rows.map((item, index) => <circle key={`lead-${item.date}`} cx={28 + index * 46 + 14} cy={210 - (item.leads / maxLeads) * 165} r="4" fill="#86efac"><title>{`${item.date}: ${integer(item.leads)} leads`}</title></circle>)}</svg></div><div className="mt-2 flex gap-4 text-[10px] uppercase tracking-[.1em] text-muted-foreground"><span><i className={`mr-2 inline-block h-2 w-2 rounded-sm ${platform === "google_ads" ? "bg-cyan-300" : "bg-violet-300"}`} />Investimento</span><span><i className="mr-2 inline-block h-0.5 w-3 bg-emerald-300 align-middle" />Leads</span></div></div>;
}

function CampaignDistribution({ rows, totalSpend }: { rows: { campaignId: string; campaignName: string; spend: number; spendShare: number }[]; totalSpend: number }) {
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><PanelHeader eyebrow="Alocação" title="Distribuição de verba" detail={`${brl(totalSpend)} distribuídos entre as campanhas do filtro.`} /><div className="mt-5 space-y-3">{rows.slice(0, 8).map((item, index) => <div key={item.campaignId}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-sm text-slate-300" title={item.campaignName}>{item.campaignName}</span><span className="shrink-0 font-mono-ui text-xs text-white">{percent(item.spendShare)}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className={index === 0 ? "h-full rounded-full bg-cyan-300" : index === 1 ? "h-full rounded-full bg-violet-300" : "h-full rounded-full bg-emerald-300"} style={{ width: `${Math.max(2, item.spendShare)}%` }} /></div></div>)}</div></div>;
}

function ActiveCreatives({ rows, campaignId, statusAsOf }: { rows: { campaignId: string; campaignName: string; adId: string; adName: string; effectiveStatus: "ACTIVE"; previewUrl: string | null; metricsThrough: string | null }[]; campaignId: string; statusAsOf: string | null }) {
  return <section className="rounded-2xl border border-violet-200/15 bg-violet-300/[.035] p-5"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><PanelHeader eyebrow="Criativos Meta" title="Anúncios com status ativo" detail={campaignId === "all" ? "Anúncios ativos organizados por campanha, independentemente da entrega no intervalo de mídia." : "Anúncios ativos da campanha selecionada."} /><Badge variant="outline" className="w-fit border-emerald-200/20 bg-emerald-200/[.05] text-emerald-100">Status efetivo em {statusAsOf?.split("-").reverse().join("/")}</Badge></div>{rows.length ? <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.slice(0, 12).map(item => <article key={item.adId} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-white" title={item.adName}>{item.adName}</p><p className="mt-1 truncate text-xs text-muted-foreground" title={item.campaignName}>{item.campaignName}</p></div><Badge variant="outline" className="shrink-0 border-emerald-200/20 text-emerald-100">Ativo</Badge></div><div className="mt-4 grid grid-cols-2 gap-2"><Metric label="ID do anúncio" value={item.adId} /><Metric label="Último registro" value={item.metricsThrough?.split("-").reverse().join("/") ?? "Indisponível"} /></div><div className="mt-4 flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">Desempenho permanece no nível campanha</span>{item.previewUrl ? <a href={item.previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-violet-100 hover:text-white">Ver prévia <ArrowUpRight className="h-3.5 w-3.5" /></a> : <span className="text-muted-foreground">Prévia indisponível</span>}</div></article>)}</div> : <EmptyState title="Nenhum criativo ativo identificado" detail="O snapshot de status não encontrou anúncios ativos para a marca e campanha selecionadas." />}</section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/6 bg-white/[.025] p-2"><p className="text-[9px] uppercase tracking-[.1em] text-muted-foreground">{label}</p><p className="mt-1 truncate text-xs font-semibold text-white">{value}</p></div>; }
function LoadingState({ platform }: { platform: string }) { return <section className="grid min-h-[420px] place-items-center rounded-2xl border border-white/10 bg-black/15"><div className="text-center"><BarChart3 className="mx-auto h-7 w-7 animate-pulse text-cyan-200" /><p className="mt-3 text-sm text-muted-foreground">Montando a visão de {platform}…</p></div></section>; }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <section className="grid min-h-52 place-items-center rounded-2xl border border-white/10 bg-black/15 p-8 text-center"><div><BarChart3 className="mx-auto h-7 w-7 text-cyan-200" /><h4 className="mt-3 font-bold text-white">{title}</h4><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{detail}</p></div></section>; }
