import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { buildLeadBridge } from "@shared/leadBridge";
import {
  ArrowDownRight, ArrowRight, BadgeDollarSign, BarChart3, BriefcaseBusiness, CalendarDays,
  CheckCircle2, ChevronRight, CircleDollarSign, Filter, Layers3, Megaphone,
  MousePointerClick, Search, Sparkles, Target, TrendingUp, UserRound, Workflow, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type FilterOption = { value: string; label: string; count: number };
type LeadBridgeData = ReturnType<typeof buildLeadBridge>;
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

function yesterdayInSaoPaulo() {
  const date = new Date(Date.now() - 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function BitrixRdOpportunityDashboard() {
  const defaultEnd = useMemo(yesterdayInSaoPaulo, []);
  const defaultStart = `${defaultEnd.slice(0, 8)}01`;
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [draftStart, setDraftStart] = useState(defaultStart);
  const [draftEnd, setDraftEnd] = useState(defaultEnd);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [utmSearch, setUtmSearch] = useState("");
  const query = trpc.bitrix24.rdOpportunityDashboard.useQuery(
    { startDate, endDate, ...filters },
    { retry: 1, staleTime: 5 * 60_000, refetchOnWindowFocus: false },
  );
  const leadReference = trpc.leads.reconciliation.useQuery(
    { startDate, endDate, brand: "all", channel: "all" },
    { retry: 1, staleTime: 5 * 60_000, refetchOnWindowFocus: false },
  );
  const data = query.data;
  const activeFilterCount = Object.values(filters).filter(value => value !== "all").length;

  if (query.isLoading && !data) return <LoadingState />;
  if (query.isError) return <ErrorState detail={friendlyBusinessError(query.error.message || "A consulta gerencial não respondeu.")} onRetry={() => query.refetch()} />;
  if (!data) return <EmptyState title="Visão gerencial indisponível" detail="Não houve retorno para o recorte selecionado." />;

  const options = (key: string) => (data.filterOptions[key] ?? []) as FilterOption[];
  const baselinePipelines = options("pipelines");
  const leadBridge = leadReference.data ? buildLeadBridge(leadReference.data.byBrand, baselinePipelines) : null;
  const filteredAttribution = data.attribution.filter(row => !utmSearch || [row.source, row.medium, row.campaign, row.adset, row.creative].join(" ").toLocaleLowerCase("pt-BR").includes(utmSearch.toLocaleLowerCase("pt-BR")));
  const applyDates = () => { if (draftStart <= draftEnd) { setStartDate(draftStart); setEndDate(draftEnd); } };
  const updateFilter = (key: keyof Filters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const setPipeline = (value: string) => updateFilter("pipeline", value);

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-[28px] border border-cyan-200/15 bg-[radial-gradient(circle_at_88%_10%,rgba(34,211,238,.16),transparent_32%),radial-gradient(circle_at_8%_90%,rgba(139,92,246,.13),transparent_30%),linear-gradient(135deg,#071421,#091a2b_52%,#06111c)] p-5 shadow-2xl shadow-cyan-950/20 sm:p-6">
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-cyan-200/25 bg-cyan-200/[.07] text-cyan-100">Revenue command center</Badge>
            <Badge variant="outline" className="border-emerald-200/20 bg-emerald-200/[.06] text-emerald-100">Fonte: Tráfego Pago</Badge>
            <Badge variant="outline" className="border-white/10 text-white/60">Atualização D-1</Badge>
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">Funil comercial de mídia paga</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Da entrada do lead ao negócio ganho, com regras auditáveis de MQL e SQL, valor comercial e atribuição por campanha, conjunto e criativo.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-[1fr_1fr_auto]">
          <DateField label="Data inicial" value={draftStart} onChange={setDraftStart} max={defaultEnd} />
          <DateField label="Data final" value={draftEnd} onChange={setDraftEnd} min={draftStart} max={defaultEnd} />
          <Button onClick={applyDates} disabled={draftStart > draftEnd} className="h-11 self-end bg-white text-slate-950 hover:bg-slate-100"><Filter className="mr-2 h-4 w-4" />Aplicar</Button>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <HeroKpi icon={Megaphone} label="Leads no Bitrix24" value={integer(data.totals.leads)} helper={data.sourceRule} tone="cyan" />
        <HeroKpi icon={Target} label="MQL · Qualificados" value={integer(data.totals.mql)} helper={`${ratio(data.totals.mql, data.totals.leads)} dos leads`} tone="violet" />
        <HeroKpi icon={TrendingUp} label="SQL · Oportunidades" value={integer(data.totals.sql)} helper={`${ratio(data.totals.sql, data.totals.mql)} dos MQLs`} tone="amber" />
        <HeroKpi icon={BriefcaseBusiness} label="Negócios" value={integer(data.totals.dealCount)} helper={`${integer(data.totals.dealLeads)} leads vinculados`} tone="emerald" />
        <HeroKpi icon={CircleDollarSign} label="Valor dos negócios" value={compactBrl(data.totals.totalDealValue)} helper={`${brl(data.totals.wonValue)} já ganho`} tone="emerald" />
      </div>
    </section>

    <LeadSourceBridge data={leadBridge} loading={leadReference.isLoading} onOpenLeads={() => { window.location.hash = "#leads"; }} />

    <section className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <PanelHeader eyebrow="Filtro principal · Bitrix24" title="Pipeline / marca no CRM" detail="As contagens 50/41/9 abaixo representam somente registros encontrados no Bitrix24 e recalculam o funil comercial." />
        {activeFilterCount ? <Button variant="outline" size="sm" className="w-fit border-white/10 bg-black/10 text-slate-300" onClick={() => setFilters(DEFAULT_FILTERS)}><X className="mr-2 h-3.5 w-3.5" />Limpar {activeFilterCount} filtros</Button> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PipelinePill active={filters.pipeline === "all"} label="Todos" count={options("pipelines").reduce((sum, item) => sum + item.count, 0)} onClick={() => setPipeline("all")} />
        {options("pipelines").map(item => <PipelinePill key={item.value} active={filters.pipeline === item.value} label={item.label} count={item.count} onClick={() => setPipeline(item.value)} />)}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FilterSelect label="Responsável" value={filters.responsible} options={options("responsibles")} onChange={value => updateFilter("responsible", value)} />
        <FilterSelect label="Etapa atual" value={filters.stage} options={options("stages")} onChange={value => updateFilter("stage", value)} />
        <FilterSelect label="Origem / utm_source" value={filters.source} options={options("sources")} onChange={value => updateFilter("source", value)} />
        <FilterSelect label="Campanha / utm_campaign" value={filters.campaign} options={options("campaigns")} onChange={value => updateFilter("campaign", value)} />
        <FilterSelect label="Conjunto / utm_content" value={filters.adset} options={options("adsets")} onChange={value => updateFilter("adset", value)} />
        <FilterSelect label="Criativo / utm_term" value={filters.creative} options={options("creatives")} onChange={value => updateFilter("creative", value)} />
        <FilterSelect label="Posição" value={filters.position} options={options("positions")} onChange={value => updateFilter("position", value)} />
        <FilterSelect label="Produto de interesse" value={filters.product} options={options("products")} onChange={value => updateFilter("product", value)} />
      </div>
    </section>

    {data.totals.leads === 0 ? <EmptyState title="Nenhum lead de Tráfego Pago" detail="Ajuste as datas ou remova parte dos filtros para ampliar o recorte." /> : <>
      <section className="rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(15,31,48,.94),rgba(5,14,24,.98))] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><PanelHeader eyebrow="Conversão ponta a ponta" title="Funil comercial" detail="Cada etapa mostra volume, conversão da etapa anterior e conversão acumulada desde Lead." /><Badge variant="outline" className="w-fit border-white/10 text-white/60">Etapa atual + vínculo por ID</Badge></div>
        <FunnelView stages={data.funnel} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SmallKpi label="Negócios abertos" value={integer(data.totals.openDeals)} helper="Semântica comercial em andamento" />
          <SmallKpi label="Negócios ganhos" value={integer(data.totals.wonDeals)} helper={brl(data.totals.wonValue)} accent="emerald" />
          <SmallKpi label="Negócios perdidos" value={integer(data.totals.lostDeals)} helper="Perda registrada no negócio" accent="rose" />
          <SmallKpi label="Leads descartados" value={integer(data.totals.discardedLeads)} helper={`${ratio(data.totals.discardedLeads, data.totals.leads)} do topo`} accent="amber" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <TrendPanel rows={data.byDay} />
        <CoveragePanel coverage={data.coverage} total={data.totals.leads} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <div className="flex flex-col justify-between gap-4 border-b border-white/8 p-5 lg:flex-row lg:items-end">
          <PanelHeader eyebrow="Atribuição comercial" title="Campanha → conjunto → criativo" detail="UTMs do lead e, quando necessário, fallback do payload RD Station embutido no Bitrix24." />
          <label className="relative block w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input aria-label="Buscar campanha, conjunto ou criativo" value={utmSearch} onChange={event => setUtmSearch(event.target.value)} placeholder="Buscar UTM…" className="h-11 w-full rounded-xl border border-white/10 bg-[#08131f] pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-200/30" /></label>
        </div>
        <AttributionTable rows={filteredAttribution} />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <RankPanel eyebrow="Estágio atual" title="Distribuição da operação" rows={data.stages} total={data.totals.leads} tone="violet" />
        <RankPanel eyebrow="Responsabilidade" title="Carteira por responsável" rows={data.responsible} total={data.totals.leads} tone="cyan" />
        <RankPanel eyebrow="Campanhas" title="Volume por campanha" rows={data.campaigns} total={data.totals.leads} tone="emerald" />
      </section>

      <section className="rounded-2xl border border-amber-200/15 bg-amber-200/[.035] p-5">
        <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" /><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-amber-100/70">Metodologia auditável</p><h4 className="mt-1 font-bold text-white">Como MQL, SQL e atribuição são calculados</h4></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><MethodCard label="MQL" text={data.methodology.mql} /><MethodCard label="SQL" text={data.methodology.sql} /><MethodCard label="Negócio" text={data.methodology.deal} /><MethodCard label="UTMs" text={data.methodology.attribution} /></div>
        <p className="mt-4 border-t border-amber-100/10 pt-4 text-xs leading-5 text-amber-50/60">Limite atual: {data.methodology.limitation}</p>
      </section>
    </>}
  </div>;
}

function DateField({ label, value, onChange, min, max }: { label: string; value: string; onChange: (value: string) => void; min?: string; max?: string }) { const open = (event: React.MouseEvent<HTMLLabelElement>) => { if ((event.target as HTMLElement).tagName === "INPUT") return; event.preventDefault(); const input = event.currentTarget.querySelector("input"); input?.focus(); input?.showPicker?.(); }; return <label onClick={open} className="cursor-pointer"><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/55">{label}</span><input aria-label={label} type="date" value={value} min={min} max={max} onClick={event => event.currentTarget.showPicker?.()} onChange={event => onChange(event.target.value)} className="dashboard-date-input mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-200/35" /></label>; }
function LeadSourceBridge({ data, loading, onOpenLeads }: { data: LeadBridgeData | null; loading: boolean; onOpenLeads: () => void }) {
  if (loading) return <section className="rounded-2xl border border-cyan-200/10 bg-cyan-200/[.03] p-5 text-sm text-slate-400">Conciliando fonte de leads e Bitrix24…</section>;
  if (!data || data.totals.sourceVolume === 0) return <section className="rounded-2xl border border-white/10 bg-black/20 p-5"><PanelHeader eyebrow="Fonte de leads × Bitrix24" title="Sem base de referência neste período" detail="As contagens do pipeline abaixo permanecem disponíveis e representam exclusivamente o CRM. A conciliação será exibida quando houver uma base de referência importada para o recorte." /></section>;
  const brandLabel = { medsystems: "MedSystems", beautysystems: "BeautySystems" } as const;
  const grossDifference = data.totals.sourceVolume - data.totals.bitrixVolume;
  return <section className="overflow-hidden rounded-2xl border border-cyan-200/15 bg-[linear-gradient(135deg,rgba(34,211,238,.065),rgba(139,92,246,.045),rgba(0,0,0,.12))]">
    <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-end">
      <PanelHeader eyebrow="Conciliação de leads" title="Fonte de referência × pessoas × CRM" detail="A fonte mede conversões; pessoas usam identidade normalizada; o Bitrix24 mostra somente os registros comerciais encontrados no CRM. As métricas não são substituídas nem somadas." />
      <Button variant="outline" className="w-fit border-cyan-200/20 bg-cyan-200/[.05] text-cyan-50 hover:bg-cyan-200/[.1]" onClick={onOpenLeads}>Abrir análise completa <ArrowRight className="ml-2 h-4 w-4" /></Button>
    </div>
    <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
      <SmallKpi label="Conversões na fonte" value={integer(data.totals.sourceVolume)} helper="Volume bruto da base de referência" />
      <SmallKpi label="Contatos únicos" value={integer(data.totals.uniqueContacts)} helper="BU + identidade normalizada" accent="emerald" />
      <SmallKpi label="Registros no Bitrix24" value={integer(data.totals.bitrixVolume)} helper="Mesmo período · universo do CRM" accent="amber" />
      <SmallKpi label="Diferença bruta" value={`${grossDifference > 0 ? "+" : ""}${integer(grossDifference)}`} helper="Não equivale a falha sem match individual" accent="rose" />
    </div>
    <div className="grid gap-3 border-t border-white/10 p-5 lg:grid-cols-2">{data.rows.map(row => <article key={row.accountKey} className="rounded-xl border border-white/8 bg-black/15 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-white">{brandLabel[row.accountKey]}</p><p className="mt-1 text-[10px] text-slate-500">Contagens separadas por fonte</p></div>{row.managerReported === row.sourceVolume ? <Badge variant="outline" className="border-emerald-200/20 text-emerald-100">Gestor conciliado</Badge> : <Badge variant="outline" className="border-amber-200/20 text-amber-100">Revisão pendente</Badge>}</div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><MetricMini label="Fonte" value={row.sourceVolume} /><MetricMini label="Pessoas" value={row.uniqueContacts} /><MetricMini label="Gestor" value={row.managerReported} /><MetricMini label="Bitrix24" value={row.bitrixVolume} /></div></article>)}</div>
  </section>;
}
function MetricMini({ label, value }: { label: string; value: number | null }) { return <div className="rounded-lg bg-white/[.025] p-3"><p className="text-[9px] uppercase tracking-[.12em] text-slate-600">{label}</p><p className="mt-1 font-mono-ui text-lg text-white">{value === null ? "N/D" : integer(value)}</p></div>; }
function PipelinePill({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) { return <button onClick={onClick} className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-all duration-200 active:scale-[.97] ${active ? "border-cyan-200/40 bg-cyan-200/15 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,.12)]" : "border-white/10 bg-white/[.025] text-slate-400 hover:border-white/20 hover:text-white"}`}><span className="max-w-[220px] truncate">{label}</span><span className={`rounded-full px-2 py-0.5 font-mono-ui text-[10px] ${active ? "bg-cyan-100 text-slate-950" : "bg-white/8 text-slate-300"}`}>{integer(count)}</span></button>; }
function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: FilterOption[]; onChange: (value: string) => void }) { return <label><span className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-slate-500">{label}</span><select aria-label={`Filtrar por ${label}`} value={value} onChange={event => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08131f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-200/30"><option value="all">Todos · {integer(options.reduce((sum, item) => sum + item.count, 0))}</option>{options.map(item => <option key={item.value} value={item.value}>{item.label} · {integer(item.count)}</option>)}</select></label>; }
function PanelHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) { return <div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-cyan-100/55">{eyebrow}</p><h3 className="mt-1 text-lg font-bold text-white">{title}</h3><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">{detail}</p></div>; }

const toneStyles = { cyan: "bg-cyan-300/10 text-cyan-200", violet: "bg-violet-300/10 text-violet-200", amber: "bg-amber-300/10 text-amber-200", emerald: "bg-emerald-300/10 text-emerald-200" };
function HeroKpi({ icon: Icon, label, value, helper, tone }: { icon: typeof Target; label: string; value: string; helper: string; tone: keyof typeof toneStyles }) { return <article className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black tracking-[-.035em] text-white">{value}</p></div><span className={`grid h-9 w-9 place-items-center rounded-xl ${toneStyles[tone]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 truncate text-xs text-slate-500" title={helper}>{helper}</p></article>; }
function SmallKpi({ label, value, helper, accent = "cyan" }: { label: string; value: string; helper: string; accent?: "cyan" | "emerald" | "rose" | "amber" }) { const color = { cyan: "text-cyan-200", emerald: "text-emerald-200", rose: "text-rose-200", amber: "text-amber-200" }[accent]; return <article className="rounded-xl border border-white/8 bg-white/[.025] p-4"><p className="text-[10px] uppercase tracking-[.12em] text-slate-500">{label}</p><p className={`mt-2 text-2xl font-black ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{helper}</p></article>; }

function FunnelView({ stages }: { stages: { key: string; label: string; count: number; conversionFromPrevious: number; conversionFromLead: number; rule: string }[] }) {
  const colors = ["from-cyan-300 to-cyan-500", "from-sky-400 to-blue-500", "from-violet-400 to-violet-600", "from-amber-300 to-orange-500", "from-emerald-300 to-emerald-500"];
  return <div className="mt-7 grid gap-3 lg:grid-cols-5">{stages.map((stage, index) => <div key={stage.key} className="relative">
    <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[.025] p-4 transition-transform duration-200 hover:-translate-y-1">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colors[index]}`} />
      <div className="flex items-center justify-between gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/7 font-mono-ui text-xs text-slate-300">0{index + 1}</span>{index ? <span className="flex items-center gap-1 text-[10px] text-slate-500"><ArrowDownRight className="h-3 w-3" />{pct(stage.conversionFromPrevious)}</span> : <span className="text-[10px] text-cyan-200">100%</span>}</div>
      <p className="mt-5 text-xs font-medium text-slate-400">{stage.label}</p><p className="mt-1 text-4xl font-black tracking-[-.05em] text-white">{integer(stage.count)}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full bg-gradient-to-r ${colors[index]}`} style={{ width: `${Math.max(2, stage.conversionFromLead)}%` }} /></div>
      <p className="mt-2 text-[10px] text-slate-500">{pct(stage.conversionFromLead)} desde Lead</p><p className="mt-3 line-clamp-3 text-[10px] leading-4 text-slate-600" title={stage.rule}>{stage.rule}</p>
    </article>{index < stages.length - 1 ? <ChevronRight className="absolute -right-5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-white/20 lg:block" /> : null}
  </div>)}</div>;
}

function TrendPanel({ rows }: { rows: { date: string; leads: number; mql: number; sql: number; deals: number }[] }) { return <section className="rounded-2xl border border-white/10 bg-black/20 p-5"><PanelHeader eyebrow="Evolução diária" title="Entrada e progressão comercial" detail="Coorte pela data de criação do lead; MQL, SQL e Negócios refletem a situação atual dessa coorte." /><div className="mt-5 h-[310px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 12, right: 8, bottom: 0, left: -24 }}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="date" tickFormatter={value => `${value.slice(8, 10)}/${value.slice(5, 7)}`} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={{ background: "#08131f", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "white" }} labelFormatter={value => String(value).split("-").reverse().join("/")} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} /><Line type="monotone" dataKey="leads" name="Leads" stroke="#67e8f9" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="mql" name="MQL" stroke="#a78bfa" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="sql" name="SQL" stroke="#fbbf24" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="deals" name="Negócios" stroke="#34d399" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></section>; }

function CoveragePanel({ coverage, total }: { coverage: { source: number; medium: number; campaign: number; adset: number; creative: number; responsible: number; linkedDeal: number }; total: number }) { const rows = [{ label: "utm_source", value: coverage.source }, { label: "utm_medium", value: coverage.medium }, { label: "Campanha", value: coverage.campaign }, { label: "Conjunto", value: coverage.adset }, { label: "Criativo", value: coverage.creative }, { label: "Responsável", value: coverage.responsible }]; return <section className="rounded-2xl border border-white/10 bg-black/20 p-5"><PanelHeader eyebrow="Cobertura" title="Qualidade da atribuição" detail="Percentual de leads com campo identificável no recorte atual." /><div className="mt-5 space-y-4">{rows.map(row => <div key={row.label}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="text-slate-400">{row.label}</span><span className="font-mono-ui text-white">{integer(row.value)} · {ratio(row.value, total)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${total ? (row.value / total) * 100 : 0}%` }} /></div></div>)}</div></section>; }

function AttributionTable({ rows }: { rows: { source: string; medium: string; campaign: string; adset: string; creative: string; leads: number; mql: number; sql: number; deals: number; wonDeals: number; dealValue: number; wonValue: number }[] }) { return <div className="attribution-scroll max-h-[720px] overflow-auto"><table className="min-w-[1180px] w-full text-left text-xs"><thead className="sticky top-0 z-10 bg-[#091724] text-[9px] uppercase tracking-[.12em] text-slate-500 shadow-[0_1px_0_rgba(255,255,255,.07)]"><tr><th className="px-5 py-3">Origem / mídia</th><th className="px-4 py-3">Campanha</th><th className="px-4 py-3">Conjunto</th><th className="px-4 py-3">Criativo</th><th className="px-4 py-3 text-right">Leads</th><th className="px-4 py-3 text-right">MQL</th><th className="px-4 py-3 text-right">SQL</th><th className="px-4 py-3 text-right">Negócios</th><th className="px-4 py-3 text-right">Valor</th><th className="px-5 py-3 text-right">Ganhos</th></tr></thead><tbody className="divide-y divide-white/[.055]">{rows.length ? rows.map((row, index) => <tr key={`${row.campaign}-${row.adset}-${row.creative}-${index}`} className="transition-colors hover:bg-white/[.025]"><td className="px-5 py-4"><p className="max-w-[170px] truncate font-medium text-slate-200" title={row.source}>{row.source}</p><p className="mt-1 max-w-[170px] truncate text-[10px] text-slate-600">{row.medium}</p></td><TextCell value={row.campaign} /><TextCell value={row.adset} /><TextCell value={row.creative} /><NumberCell value={row.leads} /><NumberCell value={row.mql} /><NumberCell value={row.sql} /><NumberCell value={row.deals} /><td className="px-4 py-4 text-right font-mono-ui text-amber-100">{brl(row.dealValue)}</td><td className="px-5 py-4 text-right"><span className="font-mono-ui text-emerald-200">{integer(row.wonDeals)}</span><p className="mt-1 text-[10px] text-slate-600">{brl(row.wonValue)}</p></td></tr>) : <tr><td colSpan={10} className="px-5 py-12 text-center text-slate-500">Nenhuma atribuição encontrada para a busca atual.</td></tr>}</tbody></table></div>; }
function TextCell({ value }: { value: string }) { return <td className="px-4 py-4"><span className={`block max-w-[210px] truncate ${value === "Não identificado" ? "text-slate-600" : "text-slate-300"}`} title={value}>{value}</span></td>; }
function NumberCell({ value }: { value: number }) { return <td className="px-4 py-4 text-right font-mono-ui text-white">{integer(value)}</td>; }

function RankPanel({ eyebrow, title, rows, total, tone }: { eyebrow: string; title: string; rows: { label: string; count: number }[]; total: number; tone: "cyan" | "violet" | "emerald" }) { const color = { cyan: "bg-cyan-300", violet: "bg-violet-300", emerald: "bg-emerald-300" }[tone]; const max = Math.max(1, ...rows.map(item => item.count)); return <section className="rounded-2xl border border-white/10 bg-black/20 p-5"><PanelHeader eyebrow={eyebrow} title={title} detail="Distribuição dentro dos filtros ativos." /><div className="mt-5 space-y-3">{rows.slice(0, 8).map(row => <div key={row.label}><div className="mb-1.5 flex justify-between gap-3"><span className="truncate text-xs text-slate-400" title={row.label}>{row.label}</span><span className="shrink-0 font-mono-ui text-[10px] text-white">{integer(row.count)} · {ratio(row.count, total)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(2, (row.count / max) * 100)}%` }} /></div></div>)}</div></section>; }
function MethodCard({ label, text }: { label: string; text: string }) { return <article className="rounded-xl border border-amber-100/10 bg-black/15 p-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-amber-200">{label}</p><p className="mt-2 text-xs leading-5 text-slate-400">{text}</p></article>; }
function LoadingState() { return <section className="grid min-h-[460px] place-items-center rounded-3xl border border-white/10 bg-black/20"><div className="text-center"><Workflow className="mx-auto h-8 w-8 animate-pulse text-cyan-200" /><p className="mt-3 text-sm text-slate-500">Montando o funil de Tráfego Pago…</p></div></section>; }
function ErrorState({ detail, onRetry }: { detail: string; onRetry: () => void }) { return <section className="grid min-h-64 place-items-center rounded-2xl border border-rose-200/15 bg-rose-200/[.03] p-8 text-center"><div><Workflow className="mx-auto h-7 w-7 text-rose-200" /><h4 className="mt-3 font-bold text-white">Não foi possível carregar Negócios</h4><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{detail}</p><Button className="mt-5 bg-white text-slate-950 hover:bg-slate-100" onClick={onRetry}>Tentar novamente</Button></div></section>; }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <section className="grid min-h-64 place-items-center rounded-2xl border border-white/10 bg-black/20 p-8 text-center"><div><Workflow className="mx-auto h-7 w-7 text-cyan-200" /><h4 className="mt-3 font-bold text-white">{title}</h4><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{detail}</p></div></section>; }
