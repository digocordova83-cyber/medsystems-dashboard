import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  CircleAlert,
  DollarSign,
  ExternalLink,
  Eye,
  Globe2,
  MousePointerClick,
  RadioTower,
  Send,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function dateInSaoPaulo(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function percent(value: number) {
  return `${(value || 0).toFixed(2).replace(".", ",")}%`;
}

function shortDate(value: Date | string | null) {
  if (!value) return "Não informado";
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function Kpi({
  label,
  value,
  helper,
  icon: Icon,
  accent = "cyan",
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof DollarSign;
  accent?: "cyan" | "violet" | "emerald";
}) {
  const colors = {
    cyan: "bg-cyan-200/10 text-cyan-100",
    violet: "bg-violet-200/10 text-violet-100",
    emerald: "bg-emerald-200/10 text-emerald-100",
  };
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
      </div>
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${colors[accent]}`}><Icon className="h-4 w-4" /></span>
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
  </div>;
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block">
    <span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/50">{label}</span>
    <input
      type="date"
      value={value}
      onChange={event => onChange(event.target.value)}
      onClick={event => event.currentTarget.showPicker?.()}
      className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white [color-scheme:dark] outline-none transition focus:border-cyan-200/30 focus:ring-2 focus:ring-cyan-200/20"
    />
  </label>;
}

type CampaignReport = {
  reportKey: string;
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
  reportUrl: string | null;
  dataDate: string;
};

type PushReport = {
  reportKey: string;
  campaignName: string;
  reportType: string;
  objective: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  status: string;
  spend: number;
  sends: number;
  clicks: number;
  ctr: number;
  cpd: number;
  contractedBudget: number;
  contractedSends: number;
  reportUrl: string;
  dataDate: Date | string | null;
};

function StatusBadge({ status }: { status: string }) {
  const active = status === "active" || status === "ativo";
  const label = active ? "Ativo" : status === "ended" ? "Encerrado" : status;
  return <Badge variant="outline" className={active ? "border-emerald-200/20 text-emerald-100" : "border-slate-400/20 text-slate-400"}>{label}</Badge>;
}

function ReportLink({ href }: { href: string | null }) {
  if (!href) return null;
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-cyan-100 transition hover:text-white">
    Abrir relatório <ExternalLink className="h-3.5 w-3.5" />
  </a>;
}

function CampaignReportCard({ report }: { report: CampaignReport }) {
  return <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-fuchsia-200">{report.reportType}</p>
        <h4 className="mt-2 text-lg font-bold text-white">{report.campaignName}</h4>
        <p className="mt-1 text-xs text-slate-400">Objetivo: {report.objective}</p>
      </div>
      <StatusBadge status={report.status} />
    </div>
    <p className="mt-4 text-xs text-slate-500">{shortDate(report.startDate)} – {shortDate(report.endDate)}</p>
    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
      <div><p className="text-[10px] uppercase tracking-wider text-slate-600">Investimento</p><p className="mt-1 font-semibold text-white">{brl(report.spend)}</p></div>
      <div><p className="text-[10px] uppercase tracking-wider text-slate-600">Impressões</p><p className="mt-1 font-semibold text-white">{integer(report.impressions)}</p></div>
      <div><p className="text-[10px] uppercase tracking-wider text-slate-600">Cliques</p><p className="mt-1 font-semibold text-white">{integer(report.clicks)}</p></div>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs text-slate-500">CTR {percent(report.ctr)}</p><ReportLink href={report.reportUrl} /></div>
      <Badge variant="outline" className={report.counted ? "border-cyan-200/15 text-cyan-100" : "border-amber-200/15 text-amber-100"}>{report.counted ? "Incluído no total" : `Duplicado de ${report.duplicateOf}`}</Badge>
    </div>
  </article>;
}

function PushReportCard({ report }: { report: PushReport }) {
  const budgetProgress = report.contractedBudget > 0 ? (report.spend / report.contractedBudget) * 100 : 0;
  return <article className="rounded-2xl border border-cyan-200/15 bg-cyan-200/[.035] p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-cyan-200">{report.reportType}</p>
        <h4 className="mt-2 text-lg font-bold text-white">{report.campaignName}</h4>
        <p className="mt-1 text-xs text-slate-400">Objetivo: {report.objective}</p>
      </div>
      <StatusBadge status={report.status} />
    </div>
    <p className="mt-4 text-xs text-slate-500">{shortDate(report.startDate)} – {shortDate(report.endDate)} · dados até {shortDate(report.dataDate)}</p>
    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
      <div><p className="text-[10px] uppercase tracking-wider text-slate-600">Investimento</p><p className="mt-1 font-semibold text-white">{brl(report.spend)}</p></div>
      <div><p className="text-[10px] uppercase tracking-wider text-slate-600">Disparos</p><p className="mt-1 font-semibold text-white">{integer(report.sends)}</p></div>
      <div><p className="text-[10px] uppercase tracking-wider text-slate-600">Cliques</p><p className="mt-1 font-semibold text-white">{integer(report.clicks)}</p></div>
    </div>
    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300" style={{ width: `${Math.min(100, budgetProgress)}%` }} /></div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs text-slate-500">CTR {percent(report.ctr)} · CPD {brl(report.cpd)}</p><ReportLink href={report.reportUrl} /></div>
      <Badge variant="outline" className="border-cyan-200/15 text-cyan-100">{percent(budgetProgress)} da verba</Badge>
    </div>
  </article>;
}

function Ranking({ title, rows, total, icon: Icon }: { title: string; rows: Array<{ name: string; impressions: number; clicks: number; ctr: number; viewability: number }>; total: number; icon: typeof Globe2 }) {
  const max = Math.max(1, ...rows.map(row => row.impressions));
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
    <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-fuchsia-200" /><h3 className="font-semibold text-white">{title}</h3></div>
    <div className="mt-5 space-y-4">
      {rows.length ? rows.map((row, index) => <div key={`${row.name}:${index}`}>
        <div className="flex items-end justify-between gap-4 text-sm"><span className="min-w-0 truncate text-slate-200">{row.name}</span><span className="shrink-0 font-mono-ui text-xs text-fuchsia-100">{integer(row.impressions)} · {percent(row.ctr)}</span></div>
        <div className="mt-2 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 to-cyan-300" style={{ width: `${Math.max(2, (row.impressions / max) * 100)}%` }} /></div>
        <p className="mt-1 text-[10px] text-slate-600">{total > 0 ? percent((row.impressions / total) * 100) : "0,00%"} das impressões · {integer(row.clicks)} cliques</p>
      </div>) : <p className="py-10 text-center text-sm text-slate-500">Este relatório não possui ranking de entrega.</p>}
    </div>
  </div>;
}

export function ProgrammaticDashboard() {
  const initial = useMemo(defaults, []);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [reportKey, setReportKey] = useState("all");
  const input = useMemo(() => ({ startDate, endDate, reportKey: reportKey === "all" ? undefined : reportKey }), [startDate, endDate, reportKey]);
  const query = trpc.publya.dashboard.useQuery(input, { retry: 1, staleTime: 5 * 60_000, refetchOnWindowFocus: false });
  const data = query.data;
  const viewabilityRows = data?.campaigns.filter(row => row.counted && row.viewability > 0) ?? [];
  const weightedViewability = viewabilityRows.reduce((sum, row) => sum + row.viewability * Math.max(1, row.impressions), 0);
  const viewabilityWeight = viewabilityRows.reduce((sum, row) => sum + Math.max(1, row.impressions), 0);
  const viewability = viewabilityWeight ? weightedViewability / viewabilityWeight : 0;
  const isOverview = reportKey === "all";

  if (query.isLoading) return <div className="grid min-h-[420px] place-items-center"><div className="text-center"><RadioTower className="mx-auto h-7 w-7 animate-pulse text-fuchsia-200" /><p className="mt-3 text-sm text-slate-400">Carregando relatórios Publya…</p></div></div>;
  if (query.isError) return <div className="rounded-2xl border border-rose-200/15 bg-rose-300/[.04] p-8 text-center"><CircleAlert className="mx-auto h-6 w-6 text-rose-200" /><h3 className="mt-3 font-semibold text-white">Não foi possível carregar a Programática</h3><p className="mt-2 text-sm text-slate-400">{query.error.message}</p></div>;
  if (!data) return null;

  const reportCount = data.campaigns.length + (data.push ? 1 : 0);
  return <div className="space-y-6">
    <section className="overflow-hidden rounded-[28px] border border-fuchsia-200/15 bg-[radial-gradient(circle_at_90%_10%,rgba(217,70,239,.17),transparent_30%),radial-gradient(circle_at_5%_90%,rgba(34,211,238,.11),transparent_28%),linear-gradient(135deg,#0b1320,#111328_52%,#090f1c)] p-5 shadow-2xl shadow-fuchsia-950/20 sm:p-6">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-fuchsia-200/25 bg-fuchsia-200/[.07] text-fuchsia-100">Publya · API + Push</Badge><Badge variant="outline" className={data.connection.configured ? "border-emerald-200/20 bg-emerald-200/[.06] text-emerald-100" : "border-amber-200/20 bg-amber-200/[.06] text-amber-100"}>{data.connection.configured ? "Atualização diária ativa" : "Aguardando conexão"}</Badge></div>
          <h3 className="mt-4 text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">{isOverview ? "Overview geral de cinco relatórios" : "Visão individual do relatório"}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{isOverview ? "Push, PMAX, Meta e duas campanhas de Programática Display, com filtro individual, dados D-1 e acesso direto aos relatórios oficiais." : "Indicadores, evolução e detalhamentos restritos ao relatório selecionado, sem misturar outras campanhas."}</p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-2xl xl:grid-cols-[1fr_1fr_1.3fr]">
          <DateField label="Início" value={startDate} onChange={setStartDate} />
          <DateField label="Fim" value={endDate} onChange={setEndDate} />
          <label><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/50">Campanha / relatório</span><select value={reportKey} onChange={event => setReportKey(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-fuchsia-200/25"><option value="all">Overview geral — 5 relatórios</option>{data.reportOptions.map(item => <option key={item.reportKey} value={item.reportKey}>{item.reportType} · {item.objective}</option>)}</select></label>
        </div>
      </div>
      {data.connection.lastDataDate ? <p className="mt-4 text-xs text-slate-500">Última data consolidada: {shortDate(data.connection.lastDataDate)}</p> : null}
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi label="Investimento total" value={data.period.exactSnapshotAvailable ? brl(data.totals.spend) : "Indisponível"} helper="Soma canônica de mídia e Push" icon={DollarSign} />
      <Kpi label="Impressões de mídia" value={integer(data.totals.impressions)} helper={data.totals.impressions === 0 && data.totals.sends > 0 ? "Não se aplica ao relatório Push" : data.quality.reachReliable ? `${integer(data.totals.reach)} de alcance` : "Alcance indisponível: retorno instável"} icon={Eye} accent="violet" />
      <Kpi label="Disparos Push" value={integer(data.totals.sends)} helper={`CTR Push ${percent(data.totals.pushCtr)}`} icon={Send} accent="emerald" />
      <Kpi label="Cliques totais" value={integer(data.totals.clicks)} helper={`${integer(data.totals.mediaClicks)} mídia + ${integer(data.totals.pushClicks)} Push`} icon={MousePointerClick} />
      <Kpi label="Eficiência" value={data.totals.sends ? brl(data.totals.pushCpd) : viewability ? percent(viewability) : "Indisponível"} helper={data.totals.sends ? "Custo por disparo Push" : `CPM mídia ${brl(data.totals.cpm)}`} icon={Target} accent="emerald" />
    </section>

    <section>
      <div className="flex items-end justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-slate-500">{isOverview ? "B2B · cinco fontes" : "B2B · filtro individual"}</p><h3 className="mt-1 text-xl font-bold text-white">Resultados por campanha</h3></div><Badge variant="outline" className="border-white/10 text-slate-400">{reportCount} {reportCount === 1 ? "relatório" : "relatórios"}</Badge></div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">{data.campaigns.map(report => <CampaignReportCard key={report.reportKey} report={report as CampaignReport} />)}{data.push ? <PushReportCard report={data.push as PushReport} /> : null}</div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-slate-500">Evolução diária D-1</p><h3 className="mt-1 font-semibold text-white">Impressões, disparos e cliques</h3>{data.byDay.length ? <div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.byDay}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={value => String(value).slice(8)} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#08131f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} labelFormatter={value => String(value).split("-").reverse().join("/")} /><Bar yAxisId="left" dataKey="impressions" name="Impressões" fill="#d8b4fe" radius={[5, 5, 0, 0]} /><Bar yAxisId="left" dataKey="sends" name="Disparos Push" fill="#67e8f9" radius={[5, 5, 0, 0]} /><Line yAxisId="right" type="monotone" dataKey="clicks" name="Cliques" stroke="#f9a8d4" strokeWidth={2.5} dot={false} /></ComposedChart></ResponsiveContainer></div> : <div className="mt-5 grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[.015] px-6 text-center"><div><BarChart3 className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-3 text-sm text-slate-400">Não há série diária para este recorte.</p><p className="mt-1 text-xs leading-5 text-slate-600">Nenhum valor é estimado.</p></div></div>}</div>
      <Ranking title="Portais com maior impacto" icon={Globe2} rows={(data.sites.length ? data.sites : data.publishers).slice(0, 8)} total={data.totals.impressions} />
    </section>

    <section className="grid gap-5 xl:grid-cols-2"><Ranking title="Formatos com maior entrega" icon={BarChart3} rows={data.formats.slice(0, 8)} total={data.totals.impressions} /><Ranking title="Criativos com maior entrega" icon={RadioTower} rows={data.creatives.slice(0, 8)} total={data.totals.impressions} /></section>
    {data.warnings.map(warning => <section key={warning} className="rounded-2xl border border-amber-200/15 bg-amber-100/5 p-4 text-xs leading-5 text-amber-50/75"><strong className="text-amber-50">Qualidade do dado:</strong> {warning}</section>)}
    <section className="rounded-2xl border border-amber-200/15 bg-amber-100/5 p-4 text-xs leading-5 text-amber-50/70"><strong className="text-amber-50">Metodologia:</strong> {data.methodology}</section>
  </div>;
}
