import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RdBitrixLeadAuditPanel } from "@/components/RdBitrixLeadAuditPanel";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownRight, BarChart3, BriefcaseBusiness, CalendarDays,
  CheckCircle2, ChevronRight, CircleDollarSign, Filter, Layers3, Megaphone,
  MousePointerClick, Search, Sparkles, Target, TrendingUp, UserRound, Workflow, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type FilterOption = { value: string; label: string; count: number };
type Filters = {
  pipeline: string; responsible: string; source: string; stage: string; position: string;
  product: string; campaign: string; adset: string; creative: string;
};

const DEFAULT_FILTERS: Filters = {
  pipeline: "all", responsible: "all", source: "all", stage: "all", position: "all",
  product: "all", campaign: "all", adset: "all", creative: "all",
};
const integer = (value: number) => Math.round(value || 0).toLocaleString("pt-BR");
const pct = (value: number) => `${(value || 0).toFixed(1).replace(".", ",")}%`;
const ratio = (value: number, total: number) => total ? `${((value / total) * 100).toFixed(1).replace(".", ",")}%` : "0,0%";
const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);
const compactBrl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
const friendlyBusinessError = (detail: string) => /service unavailable|unexpected token|valid json/i.test(detail)
  ? "O serviço ficou temporariamente indisponível. Aguarde alguns segundos e tente novamente."
  : detail;

function fallbackDefaultPeriod() {
  const date = new Date(Date.now() - 86_400_000);
  const endDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return { startDate: `${endDate.slice(0, 8)}01`, endDate };
}

export function BitrixRdOpportunityDashboard() {
  const fallbackPeriod = useMemo(fallbackDefaultPeriod, []);
  const defaultPeriodQuery = trpc.bitrix24.rdOpportunityDefaultPeriod.useQuery(undefined, {
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const defaultPeriod = defaultPeriodQuery.data ?? fallbackPeriod;
  const [startDate, setStartDate] = useState(fallbackPeriod.startDate);
  const [endDate, setEndDate] = useState(fallbackPeriod.endDate);
  const [draftStart, setDraftStart] = useState(fallbackPeriod.startDate);
  const [draftEnd, setDraftEnd] = useState(fallbackPeriod.endDate);
  const [usesDefaultPeriod, setUsesDefaultPeriod] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  useEffect(() => {
    if (!usesDefaultPeriod) return;
    setStartDate(defaultPeriod.startDate);
    setEndDate(defaultPeriod.endDate);
    setDraftStart(defaultPeriod.startDate);
    setDraftEnd(defaultPeriod.endDate);
  }, [defaultPeriod.endDate, defaultPeriod.startDate, usesDefaultPeriod]);

  const query = trpc.bitrix24.rdOpportunityDashboard.useQuery(
    { startDate, endDate, ...filters },
    { retry: 1, staleTime: 60_000, refetchOnWindowFocus: true },
  );
  const data = query.data;
  const activeFilterCount = Object.values(filters).filter(value => value !== "all").length;

  if (query.isLoading && !data) return <LoadingState />;
  if (query.isError) return <ErrorState detail={friendlyBusinessError(query.error.message || "A consulta gerencial não respondeu.")} onRetry={() => query.refetch()} />;
  if (!data) return <EmptyState title="Visão gerencial indisponível" detail="Não houve retorno para o recorte selecionado." />;

  const options = (key: string) => (data.filterOptions[key] ?? []) as FilterOption[];
  const baselinePipelines = options("pipelines");
  const applyDates = () => {
    if (draftStart <= draftEnd) {
      setStartDate(draftStart);
      setEndDate(draftEnd);
      setUsesDefaultPeriod(draftStart === defaultPeriod.startDate && draftEnd === defaultPeriod.endDate);
    }
  };
  const updateFilter = (key: keyof Filters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const setPipeline = (value: string) => updateFilter("pipeline", value);

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-[28px] border border-cyan-200/15 bg-[radial-gradient(circle_at_88%_10%,rgba(34,211,238,.16),transparent_32%),radial-gradient(circle_at_8%_90%,rgba(139,92,246,.13),transparent_30%),linear-gradient(135deg,#071421,#091a2b_52%,#06111c)] p-5 shadow-2xl shadow-cyan-950/20 sm:p-6">
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-cyan-200/25 bg-cyan-200/[.07] text-cyan-100">Revenue command center</Badge>
            <Badge variant="outline" className="border-emerald-200/20 bg-emerald-200/[.06] text-emerald-100">Universo: RD Station → Bitrix24</Badge>
            <Badge variant="outline" className="border-white/10 text-white/60">Dados até {defaultPeriod.endDate.split("-").reverse().join("/")}</Badge>
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">Funil comercial RD Station → Bitrix24</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Contatos qualificados no RD Station localizados no Bitrix24 por e-mail ou nome. Correspondências múltiplas incluem cada Lead técnico candidato no funil, mantendo a duplicidade visível na auditoria.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-[1fr_1fr_auto]">
          <DateField label="Data inicial" value={draftStart} onChange={setDraftStart} max={defaultPeriod.endDate} />
          <DateField label="Data final" value={draftEnd} onChange={setDraftEnd} min={draftStart} max={defaultPeriod.endDate} />
          <Button onClick={applyDates} disabled={draftStart > draftEnd} className="h-11 self-end bg-white text-slate-950 hover:bg-slate-100"><Filter className="mr-2 h-4 w-4" />Aplicar</Button>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <HeroKpi icon={Megaphone} label="Leads RD → Bitrix" value={integer(data.totals.leads)} helper={data.totals.duplicateBitrixLeadCandidates ? `${integer(data.totals.duplicateBitrixLeadCandidates)} Leads duplicados incluídos` : "Contatos qualificados localizados no CRM"} tone="cyan" />
        <HeroKpi icon={Target} label="MQL · Qualificados" value={integer(data.totals.mql)} helper={`${ratio(data.totals.mql, data.totals.leads)} dos leads`} tone="violet" />
        <HeroKpi icon={TrendingUp} label="SQL · Oportunidades" value={integer(data.totals.sql)} helper={`${ratio(data.totals.sql, data.totals.mql)} dos MQLs`} tone="amber" />
        <HeroKpi icon={BriefcaseBusiness} label="Negócios ganhos" value={integer(data.totals.wonDeals)} helper={`${integer(data.commercialWinsByBu.medsystems.count)} Med · ${integer(data.commercialWinsByBu.beautysystems.count)} Beauty`} tone="emerald" />
        <HeroKpi icon={CircleDollarSign} label="Valor ganho" value={compactBrl(data.totals.wonValue)} helper="Pipelines comerciais · fechamento no período" tone="emerald" />
      </div>
    </section>

    <section className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <PanelHeader eyebrow="Filtro principal · Bitrix24" title="Pipeline / marca no CRM" detail={`O universo contém contatos RD Station qualificados encontrados no CRM por e-mail ou nome. Cada Lead técnico de correspondências múltiplas também é contado; ${integer(data.totals.duplicateBitrixLeadCandidates)} duplicidade(s) técnica(s) estão sinalizadas na auditoria e ${integer(data.totals.unassignedLeads)} lead(s) permanecem sem BU reconhecida.`} />
        {activeFilterCount ? <Button variant="outline" size="sm" className="w-fit border-white/10 bg-black/10 text-slate-300" onClick={() => setFilters(DEFAULT_FILTERS)}><X className="mr-2 h-3.5 w-3.5" />Limpar {activeFilterCount} filtros</Button> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PipelinePill active={filters.pipeline === "all"} label="Todos" count={baselinePipelines.reduce((sum, item) => sum + item.count, 0)} onClick={() => setPipeline("all")} />
        {options("pipelines").map(item => <PipelinePill key={item.value} active={filters.pipeline === item.value} label={item.label} count={item.count} onClick={() => setPipeline(item.value)} />)}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FilterSelect label="Responsável" value={filters.responsible} options={options("responsibles")} allCount={data.totals.leads} onChange={value => updateFilter("responsible", value)} />
        <FilterSelect label="Etapa atual" value={filters.stage} options={options("stages")} allCount={data.totals.leads} onChange={value => updateFilter("stage", value)} />
        <FilterSelect label="Origem / utm_source" value={filters.source} options={options("sources")} allCount={data.totals.leads} onChange={value => updateFilter("source", value)} />
        <FilterSelect label="Campanha / utm_campaign" value={filters.campaign} options={options("campaigns")} allCount={data.totals.leads} onChange={value => updateFilter("campaign", value)} />
        <FilterSelect label="Conjunto / utm_content" value={filters.adset} options={options("adsets")} allCount={data.totals.leads} onChange={value => updateFilter("adset", value)} />
        <FilterSelect label="Criativo / utm_term" value={filters.creative} options={options("creatives")} allCount={data.totals.leads} onChange={value => updateFilter("creative", value)} />
        <FilterSelect label="Posição" value={filters.position} options={options("positions")} allCount={data.totals.leads} onChange={value => updateFilter("position", value)} />
        <FilterSelect label="Produto de interesse" value={filters.product} options={options("products")} allCount={data.totals.leads} onChange={value => updateFilter("product", value)} />
      </div>
    </section>

    <LeadPacingPanel pacing={data.pacing} />

    {data.totals.leads === 0 ? <EmptyState title="Nenhum lead RD Station encontrado no Bitrix24" detail="Ajuste as datas ou remova parte dos filtros para ampliar o recorte." /> : <>
      <section className="rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(15,31,48,.94),rgba(5,14,24,.98))] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><PanelHeader eyebrow="Progressão dos leads" title="Funil por status atual" detail="Cada etapa usa o contato qualificado do RD Station e a posição atual encontrada no Bitrix24; não representa histórico de transição." /><Badge variant="outline" className="w-fit border-white/10 text-white/60">Contato RD + etapa Bitrix</Badge></div>
        <FunnelView stages={data.funnel} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SmallKpi label="Ganhos MedSystems" value={integer(data.commercialWinsByBu.medsystems.count)} helper={brl(data.commercialWinsByBu.medsystems.value)} accent="emerald" />
          <SmallKpi label="Ganhos BeautySystems" value={integer(data.commercialWinsByBu.beautysystems.count)} helper={brl(data.commercialWinsByBu.beautysystems.value)} accent="emerald" />
          <SmallKpi label="Valor ganho" value={compactBrl(data.totals.wonValue)} helper="Pipelines comerciais oficiais" />
          <SmallKpi label="Leads descartados" value={integer(data.totals.discardedLeads)} helper={`${ratio(data.totals.discardedLeads, data.totals.leads)} do topo`} accent="amber" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <TrendPanel rows={data.byDay} />
        <CoveragePanel coverage={data.coverage} total={data.totals.leads} />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <RankPanel eyebrow="Estágio atual" title="Distribuição da operação" rows={data.stages} total={data.totals.leads} tone="violet" />
        <RankPanel eyebrow="Responsabilidade" title="Carteira por responsável" rows={data.responsible} total={data.totals.leads} tone="cyan" />
        <RankPanel eyebrow="Campanhas" title="Volume por campanha" rows={data.campaigns} total={data.totals.leads} tone="emerald" />
      </section>

      <section className="rounded-2xl border border-amber-200/15 bg-amber-200/[.035] p-5">
        <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" /><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-amber-100/70">Metodologia auditável</p><h4 className="mt-1 font-bold text-white">Como universo, MQL, SQL e negócios ganhos são calculados</h4></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><MethodCard label="Universo" text={data.methodology.reconciliation} /><MethodCard label="MQL" text={data.methodology.mql} /><MethodCard label="SQL" text={data.methodology.sql} /><MethodCard label="Negócios" text={data.methodology.deal} /><MethodCard label="UTMs" text={data.methodology.attribution} /></div>
        <p className="mt-4 border-t border-amber-100/10 pt-4 text-xs leading-5 text-amber-50/60">Limite atual: {data.methodology.limitation}</p>
      </section>

      <RdBitrixLeadAuditPanel startDate={startDate} endDate={endDate} />
    </>}
  </div>;
}

function DateField({ label, value, onChange, min, max }: { label: string; value: string; onChange: (value: string) => void; min?: string; max?: string }) { const open = (event: React.MouseEvent<HTMLLabelElement>) => { if ((event.target as HTMLElement).tagName === "INPUT") return; event.preventDefault(); const input = event.currentTarget.querySelector("input"); input?.focus(); input?.showPicker?.(); }; return <label onClick={open} className="cursor-pointer"><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/55">{label}</span><input aria-label={label} type="date" value={value} min={min} max={max} onClick={event => event.currentTarget.showPicker?.()} onChange={event => onChange(event.target.value)} className="dashboard-date-input mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-200/35" /></label>; }
function PipelinePill({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) { return <button onClick={onClick} className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-all duration-200 active:scale-[.97] ${active ? "border-cyan-200/40 bg-cyan-200/15 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,.12)]" : "border-white/10 bg-white/[.025] text-slate-400 hover:border-white/20 hover:text-white"}`}><span className="max-w-[220px] truncate">{label}</span><span className={`rounded-full px-2 py-0.5 font-mono-ui text-[10px] ${active ? "bg-cyan-100 text-slate-950" : "bg-white/8 text-slate-300"}`}>{integer(count)}</span></button>; }
function FilterSelect({ label, value, options, allCount, onChange }: { label: string; value: string; options: FilterOption[]; allCount: number; onChange: (value: string) => void }) { return <label><span className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-slate-500">{label}</span><select aria-label={`Filtrar por ${label}`} value={value} onChange={event => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-200/30"><option value="all">Todos · {integer(allCount)}</option>{options.map(item => <option key={item.value} value={item.value}>{item.label} · {integer(item.count)}</option>)}</select></label>; }
function PanelHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) { return <div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-cyan-100/55">{eyebrow}</p><h3 className="mt-1 text-lg font-bold text-white">{title}</h3><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">{detail}</p></div>; }

const toneStyles = { cyan: "bg-cyan-300/10 text-cyan-200", violet: "bg-violet-300/10 text-violet-200", amber: "bg-amber-300/10 text-amber-200", emerald: "bg-emerald-300/10 text-emerald-200" };
function HeroKpi({ icon: Icon, label, value, helper, tone }: { icon: typeof Target; label: string; value: string; helper: string; tone: keyof typeof toneStyles }) { return <article className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black tracking-[-.035em] text-white">{value}</p></div><span className={`grid h-9 w-9 place-items-center rounded-xl ${toneStyles[tone]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 truncate text-xs text-slate-500" title={helper}>{helper}</p></article>; }
function SmallKpi({ label, value, helper, accent = "cyan" }: { label: string; value: string; helper: string; accent?: "cyan" | "emerald" | "rose" | "amber" }) { const color = { cyan: "text-cyan-200", emerald: "text-emerald-200", rose: "text-rose-200", amber: "text-amber-200" }[accent]; return <article className="rounded-xl border border-white/8 bg-white/[.025] p-4"><p className="text-[10px] uppercase tracking-[.12em] text-slate-500">{label}</p><p className={`mt-2 text-2xl font-black ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{helper}</p></article>; }

function FunnelView({ stages }: { stages: { key: string; label: string; count: number; conversionFromPrevious: number; conversionFromLead: number; rule: string }[] }) {
  const colors = ["from-cyan-300 to-cyan-500", "from-sky-400 to-blue-500", "from-violet-400 to-violet-600", "from-amber-300 to-orange-500", "from-emerald-300 to-emerald-500"];
  return <div className="mt-7 grid gap-3 lg:grid-cols-3">{stages.map((stage, index) => <div key={stage.key} className="relative">
    <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[.025] p-4 transition-transform duration-200 hover:-translate-y-1">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colors[index]}`} />
      <div className="flex items-center justify-between gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/7 font-mono-ui text-xs text-slate-300">0{index + 1}</span>{index ? <span className="flex items-center gap-1 text-[10px] text-slate-500"><ArrowDownRight className="h-3 w-3" />{pct(stage.conversionFromPrevious)}</span> : <span className="text-[10px] text-cyan-200">100%</span>}</div>
      <p className="mt-5 text-xs font-medium text-slate-400">{stage.label}</p><p className="mt-1 text-4xl font-black tracking-[-.05em] text-white">{integer(stage.count)}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full bg-gradient-to-r ${colors[index]}`} style={{ width: `${Math.max(2, stage.conversionFromLead)}%` }} /></div>
      <p className="mt-2 text-[10px] text-slate-500">{pct(stage.conversionFromLead)} desde Lead</p><p className="mt-3 line-clamp-3 text-[10px] leading-4 text-slate-600" title={stage.rule}>{stage.rule}</p>
    </article>{index < stages.length - 1 ? <ChevronRight className="absolute -right-5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-white/20 lg:block" /> : null}
  </div>)}</div>;
}

function TrendPanel({ rows }: { rows: { date: string; leads: number; mql: number; sql: number; deals: number }[] }) { return <section className="rounded-2xl border border-white/10 bg-black/20 p-5"><PanelHeader eyebrow="Evolução diária" title="Entrada e progressão comercial" detail="Coorte pela data da conversão qualificada no RD Station; MQL e SQL refletem a situação atual encontrada no Bitrix24." /><div className="mt-5 h-[310px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 12, right: 8, bottom: 0, left: -24 }}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="date" tickFormatter={value => `${value.slice(8, 10)}/${value.slice(5, 7)}`} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={{ background: "#08131f", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "white" }} labelFormatter={value => String(value).split("-").reverse().join("/")} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} /><Line type="monotone" dataKey="leads" name="Leads" stroke="#67e8f9" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="mql" name="MQL" stroke="#a78bfa" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="sql" name="SQL" stroke="#fbbf24" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></section>; }

function CoveragePanel({ coverage, total }: { coverage: { source: number; medium: number; campaign: number; adset: number; creative: number; responsible: number; linkedDeal: number }; total: number }) { const rows = [{ label: "utm_source", value: coverage.source }, { label: "utm_medium", value: coverage.medium }, { label: "Campanha", value: coverage.campaign }, { label: "Conjunto", value: coverage.adset }, { label: "Criativo", value: coverage.creative }, { label: "Responsável", value: coverage.responsible }]; return <section className="rounded-2xl border border-white/10 bg-black/20 p-5"><PanelHeader eyebrow="Cobertura" title="Qualidade da atribuição" detail="Percentual de leads com campo identificável no recorte atual." /><div className="mt-5 space-y-4">{rows.map(row => <div key={row.label}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="text-slate-400">{row.label}</span><span className="font-mono-ui text-white">{integer(row.value)} · {ratio(row.value, total)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${total ? (row.value / total) * 100 : 0}%` }} /></div></div>)}</div></section>; }

type PacingRow = { brand: "medsystems" | "beautysystems" | "consolidado"; target: number; actual: number; attainmentPct: number; expectedByDate: number; paceDelta: number; projected: number; dailyRequired: number };
type PacingPayload = { available: boolean; label: string; elapsedDays: number; remainingDays: number; isMonthToDate: boolean; total: PacingRow[]; paid: PacingRow[]; targetTimeline: { label: string; total: number; paid: number; medsystems: { total: number; paid: number }; beautysystems: { total: number; paid: number } }[]; methodology: { total: string; paid: string } };
const pacingLabel = (brand: PacingRow["brand"]) => brand === "medsystems" ? "MedSystems" : brand === "beautysystems" ? "BeautySystems" : "Consolidado";

function LeadPacingPanel({ pacing }: { pacing: PacingPayload }) {
  if (!pacing.available) return <section className="rounded-2xl border border-amber-200/15 bg-amber-200/[.035] p-5"><PanelHeader eyebrow="Metas de leads" title="Meta mensal indisponível" detail="Não há meta cadastrada para o mês final do intervalo selecionado. Selecione setembro ou outubro de 2026 para visualizar o pacing." /></section>;
  const consolidatedTotal = pacing.total.at(-1)!;
  const consolidatedPaid = pacing.paid.at(-1)!;
  return <section className="overflow-hidden rounded-[28px] border border-cyan-200/15 bg-[radial-gradient(circle_at_92%_0%,rgba(34,211,238,.10),transparent_32%),radial-gradient(circle_at_5%_100%,rgba(251,191,36,.08),transparent_28%),linear-gradient(145deg,rgba(7,24,38,.96),rgba(5,15,26,.98))] shadow-2xl shadow-cyan-950/15">
    <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:p-6">
      <PanelHeader eyebrow="Metas de leads" title={`Pacing mensal · ${pacing.label}`} detail={`Realizado até o dia ${pacing.elapsedDays}; faltam ${pacing.remainingDays} dias no mês. ${pacing.isMonthToDate ? "O cálculo usa o mês corrente desde o dia 01." : "O intervalo selecionado não começa no dia 01; use-o como referência, não como pacing mensal fechado."}`} />
      <Badge variant="outline" className="w-fit border-cyan-200/20 bg-cyan-200/[.06] text-cyan-100">Meta total + mídia paga</Badge>
    </div>
    <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
      <PacingChart title="Total de leads × meta total" rows={pacing.total} accent="#67e8f9" meta="#94a3b8" detail={pacing.methodology.total} />
      <PacingChart title="Leads de mídia paga × meta paga" rows={pacing.paid} accent="#fbbf24" meta="#94a3b8" detail={pacing.methodology.paid} />
    </div>
    <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
      <PacingStat label="Total · atingimento" value={pct(consolidatedTotal.attainmentPct)} helper={`${integer(consolidatedTotal.actual)} de ${integer(consolidatedTotal.target)} leads`} tone="cyan" />
      <PacingStat label="Total · ritmo diário" value={integer(Math.ceil(consolidatedTotal.dailyRequired))} helper="leads/dia necessários até a meta" tone="cyan" />
      <PacingStat label="Pago · atingimento" value={pct(consolidatedPaid.attainmentPct)} helper={`${integer(consolidatedPaid.actual)} de ${integer(consolidatedPaid.target)} leads`} tone="amber" />
      <PacingStat label="Pago · ritmo diário" value={integer(Math.ceil(consolidatedPaid.dailyRequired))} helper="leads/dia necessários até a meta" tone="amber" />
    </div>
    <div className="border-t border-white/10 px-5 py-4 sm:px-6"><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-slate-500">Trilha de metas · setembro e outubro</p><div className="mt-3 grid gap-3 md:grid-cols-2">{pacing.targetTimeline.map(item => <div key={item.label} className="rounded-xl border border-white/10 bg-black/15 px-4 py-3"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-white">{item.label}</span><span className="font-mono-ui text-xs text-cyan-100">Total {integer(item.total)}</span></div><p className="mt-1 text-xs text-slate-500">Med {integer(item.medsystems.total)} · Beauty {integer(item.beautysystems.total)} <span className="mx-1">|</span> Pago: Med {integer(item.medsystems.paid)} · Beauty {integer(item.beautysystems.paid)}</p></div>)}</div></div>
  </section>;
}
function PacingChart({ title, rows, accent, meta, detail }: { title: string; rows: PacingRow[]; accent: string; meta: string; detail: string }) { const data = rows.map(row => ({ label: pacingLabel(row.brand), realizado: row.actual, meta: row.target, expected: row.expectedByDate, projection: row.projected, paceDelta: row.paceDelta })); return <article className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5"><h4 className="font-semibold text-white">{title}</h4><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{detail}</p><div className="mt-3 h-[255px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 28, right: 4, bottom: 0, left: -22 }}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#08131f", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "white" }} formatter={(value: number, name: string) => [integer(Number(value)), name === "realizado" ? "Realizado" : "Meta"]} /><Legend formatter={value => value === "realizado" ? "Realizado" : "Meta"} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} /><Bar dataKey="realizado" fill={accent} radius={[7, 7, 0, 0]} maxBarSize={42}><LabelList dataKey="realizado" position="top" fill="#e2e8f0" fontSize={10} formatter={(value: number) => integer(Number(value))} /></Bar><Bar dataKey="meta" fill={meta} fillOpacity={0.55} radius={[7, 7, 0, 0]} maxBarSize={42}><LabelList dataKey="meta" position="top" fill="#94a3b8" fontSize={10} formatter={(value: number) => integer(Number(value))} /></Bar></BarChart></ResponsiveContainer></div></article>; }
function PacingStat({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: "cyan" | "amber" }) { const color = tone === "cyan" ? "text-cyan-100" : "text-amber-100"; return <div className="bg-[#081722]/80 px-5 py-4"><p className="text-[9px] uppercase tracking-[.14em] text-slate-500">{label}</p><p className={`mt-1 font-mono-ui text-2xl font-bold ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{helper}</p></div>; }

function AttributionTable({ rows }: { rows: { source: string; medium: string; campaign: string; adset: string; creative: string; leads: number; mql: number; sql: number }[] }) {
  if (!rows.length) return <div className="grid min-h-56 place-items-center p-8 text-center"><div><Search className="mx-auto h-7 w-7 text-cyan-200/60" /><p className="mt-3 font-semibold text-white">Nenhuma atribuição encontrada</p><p className="mt-1 text-sm text-slate-500">Revise a busca ou os filtros ativos.</p></div></div>;
  return <>
    <div className="attribution-scroll hidden max-h-[760px] overflow-auto lg:block">
      <table className="w-full min-w-[1180px] table-fixed text-left text-xs">
        <colgroup><col className="w-[14%]" /><col className="w-[24%]" /><col className="w-[22%]" /><col className="w-[24%]" /><col className="w-[5.3%]" /><col className="w-[5.3%]" /><col className="w-[5.4%]" /></colgroup>
        <thead className="sticky top-0 z-20 bg-[#081722]/95 text-[9px] uppercase tracking-[.14em] text-slate-400 shadow-[0_1px_0_rgba(255,255,255,.1)] backdrop-blur-xl"><tr><th className="px-5 py-4">Origem</th><th className="px-4 py-4"><HierarchyHeader index="01" label="Campanha" /></th><th className="px-4 py-4"><HierarchyHeader index="02" label="Conjunto" /></th><th className="px-4 py-4"><HierarchyHeader index="03" label="Criativo" /></th><th className="px-2 py-4 text-center">Leads</th><th className="px-2 py-4 text-center">MQL</th><th className="px-3 py-4 text-center">SQL</th></tr></thead>
        <tbody className="divide-y divide-white/[.065]">{rows.map((row, index) => <tr key={`${row.campaign}-${row.adset}-${row.creative}-${index}`} className="group align-top transition-colors hover:bg-cyan-100/[.035]"><td className="px-5 py-5"><SourceBadge source={row.source} medium={row.medium} /></td><HierarchyCell value={row.campaign} /><HierarchyCell value={row.adset} /><HierarchyCell value={row.creative} /><MetricCell value={row.leads} tone="cyan" /><MetricCell value={row.mql} tone="violet" /><MetricCell value={row.sql} tone="amber" /></tr>)}</tbody>
      </table>
    </div>
    <div className="attribution-scroll max-h-[760px] space-y-3 overflow-y-auto p-4 lg:hidden">{rows.map((row, index) => <article key={`${row.campaign}-${row.adset}-${row.creative}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><SourceBadge source={row.source} medium={row.medium} /><div className="flex gap-1.5"><CompactMetric label="L" value={row.leads} tone="cyan" /><CompactMetric label="M" value={row.mql} tone="violet" /><CompactMetric label="S" value={row.sql} tone="amber" /></div></div><div className="mt-4 space-y-3"><MobileHierarchyRow index="01" label="Campanha" value={row.campaign} /><MobileHierarchyRow index="02" label="Conjunto" value={row.adset} /><MobileHierarchyRow index="03" label="Criativo" value={row.creative} /></div></article>)}</div>
  </>;
}
function WinsAttributionTable({ rows }: { rows: { source: string; medium: string; campaign: string; adset: string; creative: string; wonDeals: number; wonValue: number }[] }) {
  if (!rows.length) return <div className="grid min-h-56 place-items-center p-8 text-center"><div><BriefcaseBusiness className="mx-auto h-7 w-7 text-emerald-200/60" /><p className="mt-3 font-semibold text-white">Nenhum ganho encontrado nesta busca</p><p className="mt-1 text-sm text-slate-500">Revise a busca ou os filtros ativos.</p></div></div>;
  return <>
    <div className="attribution-scroll hidden max-h-[620px] overflow-auto lg:block">
      <table className="w-full min-w-[1110px] table-fixed text-left text-xs">
        <colgroup><col className="w-[15%]" /><col className="w-[26%]" /><col className="w-[22%]" /><col className="w-[22%]" /><col className="w-[7%]" /><col className="w-[8%]" /></colgroup>
        <thead className="sticky top-0 z-20 bg-[#09211f]/95 text-[9px] uppercase tracking-[.14em] text-slate-400 shadow-[0_1px_0_rgba(255,255,255,.1)] backdrop-blur-xl"><tr><th className="px-5 py-4">Origem</th><th className="px-4 py-4"><HierarchyHeader index="01" label="Campanha" /></th><th className="px-4 py-4"><HierarchyHeader index="02" label="Conjunto" /></th><th className="px-4 py-4"><HierarchyHeader index="03" label="Criativo" /></th><th className="px-2 py-4 text-center">Ganhos</th><th className="px-4 py-4 text-right">Valor ganho</th></tr></thead>
        <tbody className="divide-y divide-white/[.065]">{rows.map((row, index) => <tr key={`${row.campaign}-${row.adset}-${row.creative}-${index}`} className="group align-top transition-colors hover:bg-emerald-100/[.035]"><td className="px-5 py-5"><SourceBadge source={row.source} medium={row.medium} /></td><HierarchyCell value={row.campaign} /><HierarchyCell value={row.adset} /><HierarchyCell value={row.creative} /><td className="px-2 py-5 text-center"><span className="inline-grid min-w-10 place-items-center rounded-lg border border-emerald-200/15 bg-emerald-200/[.07] px-2 py-1.5 font-mono-ui text-xs font-bold text-emerald-100">{integer(row.wonDeals)}</span></td><td className="px-4 py-5 text-right font-mono-ui text-sm font-bold text-emerald-100">{brl(row.wonValue)}</td></tr>)}</tbody>
      </table>
    </div>
    <div className="attribution-scroll max-h-[620px] space-y-3 overflow-y-auto p-4 lg:hidden">{rows.map((row, index) => <article key={`${row.campaign}-${row.adset}-${row.creative}-${index}`} className="rounded-2xl border border-emerald-200/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><SourceBadge source={row.source} medium={row.medium} /><div className="rounded-lg bg-emerald-200/10 px-2.5 py-1.5 text-center text-emerald-100"><p className="text-[8px] uppercase tracking-[.1em] opacity-60">Ganhos</p><p className="font-mono-ui text-xs font-bold">{integer(row.wonDeals)}</p></div></div><div className="mt-4 space-y-3"><MobileHierarchyRow index="01" label="Campanha" value={row.campaign} /><MobileHierarchyRow index="02" label="Conjunto" value={row.adset} /><MobileHierarchyRow index="03" label="Criativo" value={row.creative} /></div><div className="mt-4 border-t border-white/10 pt-3 text-right"><p className="text-[9px] uppercase tracking-[.12em] text-slate-500">Valor ganho</p><p className="mt-1 font-mono-ui text-sm font-bold text-emerald-100">{brl(row.wonValue)}</p></div></article>)}</div>
  </>;
}
function HierarchyHeader({ index, label }: { index: string; label: string }) { return <span className="inline-flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-md bg-white/[.06] font-mono-ui text-[8px] text-cyan-100/70">{index}</span>{label}</span>; }
function SourceBadge({ source, medium }: { source: string; medium: string }) { return <div className="min-w-0"><span className="inline-flex max-w-full rounded-lg border border-cyan-200/15 bg-cyan-200/[.07] px-2.5 py-1 text-[11px] font-semibold text-cyan-50"><span className="truncate" title={source}>{source}</span></span><p className="mt-1.5 truncate pl-0.5 text-[10px] uppercase tracking-[.1em] text-slate-500" title={medium}>{medium}</p></div>; }
function HierarchyCell({ value }: { value: string }) { const missing = value === "Não identificado"; return <td className="px-4 py-5"><p className={`line-clamp-2 break-words text-[13px] leading-5 ${missing ? "italic text-slate-600" : "font-medium text-slate-200"}`} title={value}>{value}</p></td>; }
function MetricCell({ value, tone }: { value: number; tone: "cyan" | "violet" | "amber" }) { const styles = { cyan: "border-cyan-200/15 bg-cyan-200/[.07] text-cyan-100", violet: "border-violet-200/15 bg-violet-200/[.07] text-violet-100", amber: "border-amber-200/15 bg-amber-200/[.07] text-amber-100" }[tone]; return <td className="px-2 py-5 text-center"><span className={`inline-grid min-w-10 place-items-center rounded-lg border px-2 py-1.5 font-mono-ui text-xs font-bold ${styles}`}>{integer(value)}</span></td>; }
function CompactMetric({ label, value, tone }: { label: string; value: number; tone: "cyan" | "violet" | "amber" }) { const styles = { cyan: "bg-cyan-200/10 text-cyan-100", violet: "bg-violet-200/10 text-violet-100", amber: "bg-amber-200/10 text-amber-100" }[tone]; return <div className={`min-w-10 rounded-lg px-2 py-1.5 text-center ${styles}`}><p className="text-[8px] uppercase tracking-[.1em] opacity-60">{label}</p><p className="font-mono-ui text-xs font-bold">{integer(value)}</p></div>; }
function MobileHierarchyRow({ index, label, value }: { index: string; label: string; value: string }) { const missing = value === "Não identificado"; return <div className="grid grid-cols-[28px_1fr] gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[.055] font-mono-ui text-[9px] text-cyan-100/60">{index}</span><div className="min-w-0"><p className="text-[9px] uppercase tracking-[.12em] text-slate-500">{label}</p><p className={`mt-1 break-words text-xs leading-5 ${missing ? "italic text-slate-600" : "text-slate-200"}`} title={value}>{value}</p></div></div>; }

function RankPanel({ eyebrow, title, rows, total, tone }: { eyebrow: string; title: string; rows: { label: string; count: number }[]; total: number; tone: "cyan" | "violet" | "emerald" }) { const color = { cyan: "bg-cyan-300", violet: "bg-violet-300", emerald: "bg-emerald-300" }[tone]; const max = Math.max(1, ...rows.map(item => item.count)); return <section className="rounded-2xl border border-white/10 bg-black/20 p-5"><PanelHeader eyebrow={eyebrow} title={title} detail="Distribuição dentro dos filtros ativos." /><div className="mt-5 space-y-3">{rows.slice(0, 8).map(row => <div key={row.label}><div className="mb-1.5 flex justify-between gap-3"><span className="truncate text-xs text-slate-400" title={row.label}>{row.label}</span><span className="shrink-0 font-mono-ui text-[10px] text-white">{integer(row.count)} · {ratio(row.count, total)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(2, (row.count / max) * 100)}%` }} /></div></div>)}</div></section>; }
function MethodCard({ label, text }: { label: string; text: string }) { return <article className="rounded-xl border border-amber-100/10 bg-black/15 p-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-amber-200">{label}</p><p className="mt-2 text-xs leading-5 text-slate-400">{text}</p></article>; }
function LoadingState() { return <section className="grid min-h-[460px] place-items-center rounded-3xl border border-white/10 bg-black/20"><div className="text-center"><Workflow className="mx-auto h-8 w-8 animate-pulse text-cyan-200" /><p className="mt-3 text-sm text-slate-500">Montando a leitura Bitrix24…</p></div></section>; }
function ErrorState({ detail, onRetry }: { detail: string; onRetry: () => void }) { return <section className="grid min-h-64 place-items-center rounded-2xl border border-rose-200/15 bg-rose-200/[.03] p-8 text-center"><div><Workflow className="mx-auto h-7 w-7 text-rose-200" /><h4 className="mt-3 font-bold text-white">Não foi possível carregar Negócios</h4><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{detail}</p><Button className="mt-5 bg-white text-slate-950 hover:bg-slate-100" onClick={onRetry}>Tentar novamente</Button></div></section>; }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <section className="grid min-h-64 place-items-center rounded-2xl border border-white/10 bg-black/20 p-8 text-center"><div><Workflow className="mx-auto h-7 w-7 text-cyan-200" /><h4 className="mt-3 font-bold text-white">{title}</h4><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{detail}</p></div></section>; }
