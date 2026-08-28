import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart3, CircleAlert, DollarSign, Eye, Globe2, MousePointerClick, RadioTower, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function dateInSaoPaulo(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function defaults() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const endDate = dateInSaoPaulo(yesterday);
  return { startDate: `${endDate.slice(0, 7)}-01`, endDate };
}

function integer(value: number) {
  return Math.round(value || 0).toLocaleString("pt-BR");
}

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value || 0);
}

function percent(value: number) {
  return `${(value || 0).toFixed(2).replace(".", ",")}%`;
}

function shortDate(value: Date | string | null) {
  if (!value) return "Não informado";
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function Kpi({ label, value, helper, icon: Icon, accent = "cyan" }: { label: string; value: string; helper: string; icon: typeof DollarSign; accent?: "cyan" | "violet" | "emerald" }) {
  const colors = { cyan: "bg-cyan-200/10 text-cyan-100", violet: "bg-violet-200/10 text-violet-100", emerald: "bg-emerald-200/10 text-emerald-100" };
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p></div><span className={`grid h-9 w-9 place-items-center rounded-xl ${colors[accent]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p></div>;
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/50">{label}</span><input type="date" value={value} onChange={event => onChange(event.target.value)} onClick={event => event.currentTarget.showPicker?.()} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white [color-scheme:dark] outline-none transition focus:border-cyan-200/30 focus:ring-2 focus:ring-cyan-200/20" /></label>;
}

type Report = {
  campaignId: number;
  campaignName: string;
  reportType: string;
  objective: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  counted: boolean;
  duplicateOf: number | null;
};

function ReportCard({ report }: { report: Report }) {
  const statusLabel = report.status === "active" ? "Ativo" : report.status === "ended" ? "Encerrado" : report.status;
  return <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-fuchsia-200">{report.reportType}</p><h4 className="mt-2 text-lg font-bold text-white">{report.campaignName}</h4><p className="mt-1 text-xs text-slate-400">Objetivo: {report.objective}</p></div><Badge variant="outline" className={report.status === "active" ? "border-emerald-200/20 text-emerald-100" : "border-slate-400/20 text-slate-400"}>{statusLabel}</Badge></div>
    <p className="mt-4 text-xs text-slate-500">{shortDate(report.startDate)} – {shortDate(report.endDate)}</p>
    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-4"><div><p className="text-[10px] uppercase tracking-wider text-slate-600">Investimento</p><p className="mt-1 font-semibold text-white">{brl(report.spend)}</p></div><div><p className="text-[10px] uppercase tracking-wider text-slate-600">Impressões</p><p className="mt-1 font-semibold text-white">{integer(report.impressions)}</p></div><div><p className="text-[10px] uppercase tracking-wider text-slate-600">Cliques</p><p className="mt-1 font-semibold text-white">{integer(report.clicks)}</p></div></div>
    <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">CTR {percent(report.ctr)}</span><Badge variant="outline" className={report.counted ? "border-cyan-200/15 text-cyan-100" : "border-amber-200/15 text-amber-100"}>{report.counted ? "Incluído no total" : `Duplicado de ${report.duplicateOf}`}</Badge></div>
  </article>;
}

function Ranking({ title, rows, total, icon: Icon }: { title: string; rows: Array<{ name: string; impressions: number; clicks: number; ctr: number; viewability: number }>; total: number; icon: typeof Globe2 }) {
  const max = Math.max(1, ...rows.map(row => row.impressions));
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-fuchsia-200" /><h3 className="font-semibold text-white">{title}</h3></div><div className="mt-5 space-y-4">{rows.length ? rows.map((row, index) => <div key={`${row.name}:${index}`}><div className="flex items-end justify-between gap-4 text-sm"><span className="min-w-0 truncate text-slate-200">{row.name}</span><span className="shrink-0 font-mono-ui text-xs text-fuchsia-100">{integer(row.impressions)} · {percent(row.ctr)}</span></div><div className="mt-2 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 to-cyan-300" style={{ width: `${Math.max(2, (row.impressions / max) * 100)}%` }} /></div><p className="mt-1 text-[10px] text-slate-600">{total > 0 ? percent((row.impressions / total) * 100) : "0,00%"} das impressões · {integer(row.clicks)} cliques</p></div>) : <p className="py-10 text-center text-sm text-slate-500">Dados ainda não coletados.</p>}</div></div>;
}

export function ProgrammaticDashboard() {
  const initial = useMemo(defaults, []);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [campaignId, setCampaignId] = useState("all");
  const input = useMemo(() => ({ startDate, endDate, campaignId: campaignId === "all" ? undefined : Number(campaignId) }), [startDate, endDate, campaignId]);
  const query = trpc.publya.dashboard.useQuery(input, { retry: 1, staleTime: 5 * 60_000, refetchOnWindowFocus: false });
  const data = query.data;
  const viewabilityRows = data?.campaigns.filter(row => row.counted && row.viewability > 0) ?? [];
  const weightedViewability = viewabilityRows.reduce((sum, row) => sum + row.viewability * Math.max(1, row.impressions), 0);
  const viewabilityWeight = viewabilityRows.reduce((sum, row) => sum + Math.max(1, row.impressions), 0);
  const viewability = viewabilityWeight ? weightedViewability / viewabilityWeight : 0;

  if (query.isLoading) return <div className="grid min-h-[420px] place-items-center"><div className="text-center"><RadioTower className="mx-auto h-7 w-7 animate-pulse text-fuchsia-200" /><p className="mt-3 text-sm text-slate-400">Carregando relatórios Publya…</p></div></div>;
  if (query.isError) return <div className="rounded-2xl border border-rose-200/15 bg-rose-300/[.04] p-8 text-center"><CircleAlert className="mx-auto h-6 w-6 text-rose-200" /><h3 className="mt-3 font-semibold text-white">Não foi possível carregar a Programática</h3><p className="mt-2 text-sm text-slate-400">{query.error.message}</p></div>;
  if (!data) return null;

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-[28px] border border-fuchsia-200/15 bg-[radial-gradient(circle_at_90%_10%,rgba(217,70,239,.17),transparent_30%),radial-gradient(circle_at_5%_90%,rgba(34,211,238,.11),transparent_28%),linear-gradient(135deg,#0b1320,#111328_52%,#090f1c)] p-5 shadow-2xl shadow-fuchsia-950/20 sm:p-6">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div className="max-w-3xl"><div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-fuchsia-200/25 bg-fuchsia-200/[.07] text-fuchsia-100">Publya · API v2</Badge><Badge variant="outline" className={data.connection.configured ? "border-emerald-200/20 bg-emerald-200/[.06] text-emerald-100" : "border-amber-200/20 bg-amber-200/[.06] text-amber-100"}>{data.connection.configured ? "Conexão configurada" : "Aguardando token permanente"}</Badge></div><h3 className="mt-4 text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">Quatro relatórios B2B em uma visão</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">PMAX, Meta e duas execuções de Programática Display coletadas diretamente da Publya, preservando objetivo, período e métricas de cada relatório.</p></div><div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-2xl xl:grid-cols-[1fr_1fr_1.3fr]"><DateField label="Início" value={startDate} onChange={setStartDate} /><DateField label="Fim" value={endDate} onChange={setEndDate} /><label><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/50">Relatório</span><select value={campaignId} onChange={event => setCampaignId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-fuchsia-200/25"><option value="all">Todos os 4 relatórios</option>{data.campaignOptions.map(item => <option key={item.campaignId} value={item.campaignId}>{item.reportType} · {item.objective}</option>)}</select></label></div></div>
      {!data.connection.configured ? <div className="mt-6 rounded-2xl border border-amber-200/15 bg-amber-100/5 p-4 text-sm leading-6 text-amber-50/75">A conexão Publya ainda não possui um token permanente válido.</div> : null}
      {data.connection.lastDataDate ? <p className="mt-4 text-xs text-slate-500">Última data com dados: {new Date(data.connection.lastDataDate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p> : null}
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Investimento" value={data.period.exactSnapshotAvailable ? brl(data.totals.spend) : "Indisponível"} helper={data.period.exactSnapshotAvailable ? "Total canônico dos quatro relatórios" : "Sem snapshot exato; nenhum valor estimado"} icon={DollarSign} /><Kpi label="Impressões" value={integer(data.totals.impressions)} helper={data.quality.reachReliable ? `${integer(data.totals.reach)} de alcance reportado` : "Alcance indisponível: retorno instável"} icon={Eye} accent="violet" /><Kpi label="Cliques" value={integer(data.totals.clicks)} helper={`CTR consolidado ${percent(data.totals.ctr)}`} icon={MousePointerClick} /><Kpi label="Viewability" value={viewability ? percent(viewability) : "Indisponível"} helper={`CPM consolidado ${data.period.exactSnapshotAvailable ? brl(data.totals.cpm) : "indisponível"}`} icon={Target} accent="emerald" /></section>

    <section><div className="flex items-end justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-slate-500">B2B · quatro campanhas</p><h3 className="mt-1 text-xl font-bold text-white">Relatórios em execução</h3></div><Badge variant="outline" className="border-white/10 text-slate-400">{data.campaigns.length} relatórios</Badge></div><div className="mt-4 grid gap-4 xl:grid-cols-2">{data.campaigns.map(report => <ReportCard key={report.campaignId} report={report} />)}</div></section>

    <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><div className="rounded-2xl border border-white/10 bg-black/15 p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-slate-500">Evolução diária disponível</p><h3 className="mt-1 font-semibold text-white">Impressões e cliques expostos por dia</h3>{data.byDay.length ? <div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.byDay}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={value => String(value).slice(8)} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#08131f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} labelFormatter={value => String(value).split("-").reverse().join("/")} /><Bar yAxisId="left" dataKey="impressions" name="Impressões" fill="#d8b4fe" radius={[5, 5, 0, 0]} /><Line yAxisId="right" type="monotone" dataKey="clicks" name="Cliques" stroke="#67e8f9" strokeWidth={2.5} dot={false} /></ComposedChart></ResponsiveContainer></div> : <div className="mt-5 grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[.015] px-6 text-center"><div><BarChart3 className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-3 text-sm text-slate-400">A API não expôs impressões ou cliques diários para este recorte.</p><p className="mt-1 text-xs leading-5 text-slate-600">Os totais agregados permanecem disponíveis; a série não é estimada.</p></div></div>}</div><Ranking title="Portais com maior impacto" icon={Globe2} rows={(data.sites.length ? data.sites : data.publishers).slice(0, 8)} total={data.totals.impressions} /></section>

    <section className="grid gap-5 xl:grid-cols-2"><Ranking title="Formatos com maior entrega" icon={BarChart3} rows={data.formats.slice(0, 8)} total={data.totals.impressions} /><Ranking title="Criativos com maior entrega" icon={RadioTower} rows={data.creatives.slice(0, 8)} total={data.totals.impressions} /></section>

    <section className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-slate-500">Auditoria dos relatórios</p><h3 className="mt-1 font-semibold text-white">Plataforma, objetivo e tratamento</h3></div><Badge variant="outline" className="w-fit border-white/10 text-slate-400">{data.campaigns.length} relatórios no período</Badge></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="text-[10px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Campanha</th><th className="px-3 py-3">Objetivo</th><th className="px-3 py-3">Período</th><th className="px-3 py-3">Tratamento</th><th className="px-3 py-3 text-right">Investimento</th><th className="px-3 py-3 text-right">Impressões</th><th className="px-3 py-3 text-right">Cliques</th></tr></thead><tbody>{data.campaigns.map(item => <tr key={item.campaignId} className="border-t border-white/5"><td className="px-3 py-3 text-fuchsia-100">{item.reportType}</td><td className="max-w-sm px-3 py-3 font-medium text-white">{item.campaignName}</td><td className="px-3 py-3 text-slate-300">{item.objective}</td><td className="px-3 py-3 text-slate-400">{shortDate(item.startDate)} – {shortDate(item.endDate)}</td><td className="px-3 py-3"><Badge variant="outline" className={item.counted ? "border-emerald-200/15 text-emerald-100" : "border-amber-200/15 text-amber-100"}>{item.counted ? "Somado" : `Duplicado de ${item.duplicateOf}`}</Badge></td><td className="px-3 py-3 text-right font-mono-ui text-fuchsia-100">{brl(item.spend)}</td><td className="px-3 py-3 text-right">{integer(item.impressions)}</td><td className="px-3 py-3 text-right">{integer(item.clicks)}</td></tr>)}</tbody></table></div>{data.campaigns.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Nenhum snapshot Publya foi coletado para o período selecionado.</p> : null}</section>
    {data.warnings.map(warning => <section key={warning} className="rounded-2xl border border-amber-200/15 bg-amber-100/5 p-4 text-xs leading-5 text-amber-50/75"><strong className="text-amber-50">Qualidade do dado:</strong> {warning}</section>)}
    <section className="rounded-2xl border border-amber-200/15 bg-amber-100/5 p-4 text-xs leading-5 text-amber-50/70"><strong className="text-amber-50">Metodologia:</strong> {data.methodology}</section>
  </div>;
}
