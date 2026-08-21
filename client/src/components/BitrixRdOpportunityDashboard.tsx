import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Activity, BarChart3, CalendarDays, Database, Filter, Gauge, Layers3, Lightbulb, Target, UserRound, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ReportingPeriod = "2026-07" | "2026-08";
type CountRow = { label: string; count: number };

const integer = (value: number) => Math.round(value || 0).toLocaleString("pt-BR");
const percentage = (value: number, total: number) => total ? `${((value / total) * 100).toFixed(1).replace(".", ",")}%` : "0,0%";

export function BitrixRdOpportunityDashboard({ period }: { period: ReportingPeriod }) {
  const [pipeline, setPipeline] = useState("all");
  useEffect(() => setPipeline("all"), [period]);
  const query = trpc.bitrix24.rdOpportunityDashboard.useQuery({ pipeline, period }, { refetchInterval: 60_000 });
  const data = query.data;
  const insights = useMemo(() => {
    if (!data || !data.totals.leads) return [];
    const topStage = data.stages[0];
    const topResponsible = data.responsible[0];
    const missingProduct = data.totals.leads - data.coverage.product;
    return [
      { label: "Pico de entrada", value: data.totals.peakDay ? `${data.totals.peakDay.date.split("-").reverse().join("/")} · ${integer(data.totals.peakDay.count)} leads` : "Sem movimento", detail: "Maior volume diário do recorte selecionado." },
      { label: "Etapa dominante", value: topStage ? `${topStage.label} · ${percentage(topStage.count, data.totals.leads)}` : "Não identificada", detail: "Concentração atual do estoque de leads." },
      { label: "Responsável com maior carteira", value: topResponsible ? `${topResponsible.label} · ${integer(topResponsible.count)}` : "Não identificado", detail: "Distribuição pelo campo Pessoa responsável." },
      { label: "Produto não informado", value: `${integer(missingProduct)} leads`, detail: `${percentage(missingProduct, data.totals.leads)} do recorte sem produto preenchido.` },
    ];
  }, [data]);

  if (query.isLoading && !data) return <LoadingState />;
  if (query.isError) return <EmptyState title="Não foi possível carregar a nova visão Bitrix24" detail={query.error.message || "A consulta gerencial não respondeu."} />;
  if (!data) return <EmptyState title="Visão gerencial indisponível" detail="Não houve retorno para o recorte selecionado." />;

  const maxDay = Math.max(1, ...data.byDay.map(item => item.count));
  return <div className="space-y-5">
    <section className="overflow-hidden rounded-3xl border border-cyan-200/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.14),transparent_36%),linear-gradient(135deg,rgba(9,28,45,.98),rgba(7,17,29,.96))] p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-cyan-200/20 bg-cyan-200/[.06] text-cyan-100">Bitrix24 · gestão de leads</Badge><Badge variant="outline" className="border-emerald-200/20 bg-emerald-200/[.05] text-emerald-100">Evento excluído</Badge></div><h3 className="mt-4 text-2xl font-black tracking-[-.04em] text-white sm:text-3xl">Oportunidades RD Station</h3><p className="mt-2 text-sm leading-6 text-slate-300">Leitura exclusiva de leads com <strong>Nome do Lead = Oportunidade do RD Station</strong>. Todos os indicadores abaixo respondem ao Pipeline de Vendas selecionado.</p></div>
        <label className="block min-w-[260px]"><span className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-cyan-100/70">Pipeline de Vendas</span><select aria-label="Filtrar por Pipeline de Vendas" value={pipeline} onChange={event => setPipeline(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-cyan-200/15 bg-[#08131f] px-3 text-sm font-medium text-white outline-none ring-cyan-200/40 focus:ring-2"><option value="all">Todos os pipelines · {integer(data.pipelineOptions.reduce((sum, item) => sum + item.count, 0))}</option>{data.pipelineOptions.map(item => <option key={item.id} value={item.id}>{item.label} · {integer(item.count)}</option>)}</select></label>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ManagerKpi icon={Layers3} label="Leads no filtro" value={integer(data.totals.leads)} helper={data.selectedPipeline.label} tone="cyan" /><ManagerKpi icon={CalendarDays} label="Dias com entrada" value={integer(data.totals.activeDays)} helper={`${data.period.start.split("-").reverse().join("/")} a ${data.period.end.split("-").reverse().join("/")}`} tone="violet" /><ManagerKpi icon={Gauge} label="Média por dia ativo" value={data.totals.averagePerActiveDay.toFixed(1).replace(".", ",")} helper="Sem estimar dias sem entrada" tone="emerald" /><ManagerKpi icon={UserRound} label="Responsáveis" value={integer(data.totals.distinctResponsibles)} helper="IDs distintos no recorte" tone="amber" /></div>
    </section>

    {data.totals.leads === 0 ? <EmptyState title="Nenhum lead encontrado" detail="Não há leads Oportunidade do RD Station para o pipeline e o período selecionados." /> : <>
      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><PanelHeader eyebrow="Volume diário" title="Leads por dia" detail="Entrada de oportunidades no fuso de São Paulo." /><div className="mt-6 overflow-x-auto pb-2"><div className="flex min-w-[680px] items-end gap-2" role="img" aria-label="Gráfico de barras de leads por dia">{data.byDay.map(item => <div key={item.date} className="group flex min-w-7 flex-1 flex-col items-center gap-2"><span className="font-mono-ui text-[10px] text-cyan-100 opacity-0 transition-opacity group-hover:opacity-100">{item.count}</span><div className="w-full rounded-t-lg bg-[linear-gradient(180deg,#67e8f9,#0891b2)] shadow-[0_0_18px_rgba(34,211,238,.12)] transition-transform duration-200 group-hover:-translate-y-1" style={{ height: `${Math.max(10, (item.count / maxDay) * 180)}px` }} /><span className="rotate-[-45deg] whitespace-nowrap text-[9px] text-muted-foreground">{item.date.slice(8, 10)}/{item.date.slice(5, 7)}</span></div>)}</div></div></div>
        <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><PanelHeader eyebrow="Filtro principal" title="Distribuição por pipeline" detail="Clique para aplicar o recorte em toda a aba." /><div className="mt-5 space-y-3">{data.pipelineOptions.map((item, index) => <button type="button" key={item.id} onClick={() => setPipeline(pipeline === item.id ? "all" : item.id)} className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${pipeline === item.id ? "border-cyan-200/30 bg-cyan-200/10" : "border-white/7 bg-white/[.02] hover:border-white/15 hover:bg-white/[.04]"}`}><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium text-slate-200">{item.label}</span><span className="font-mono-ui text-sm text-cyan-100">{integer(item.count)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className={index === 0 ? "h-full rounded-full bg-cyan-300" : index === 1 ? "h-full rounded-full bg-violet-300" : "h-full rounded-full bg-emerald-300"} style={{ width: `${Math.max(3, (item.count / Math.max(...data.pipelineOptions.map(option => option.count), 1)) * 100)}%` }} /></div></button>)}</div>{pipeline !== "all" ? <Button variant="outline" size="sm" className="mt-4 w-full border-white/10 bg-black/10 text-muted-foreground" onClick={() => setPipeline("all")}>Limpar filtro de pipeline</Button> : null}</div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2"><RankPanel eyebrow="Responsabilidade" title="Leads por responsável" rows={data.responsible} total={data.totals.leads} tone="cyan" /><RankPanel eyebrow="Fluxo comercial" title="Leads por etapa" rows={data.stages} total={data.totals.leads} tone="violet" /></section>

      <section className="rounded-2xl border border-white/10 bg-black/15 p-5"><PanelHeader eyebrow="Qualidade do cadastro" title="Cobertura dos campos gerenciais" detail="Percentual de leads com informação utilizável no recorte." /><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><CoverageCard label="Informações da fonte" value={data.coverage.sourceInformation} total={data.totals.leads} icon={Database} /><CoverageCard label="Posição" value={data.coverage.position} total={data.totals.leads} icon={Activity} /><CoverageCard label="Produto de Interesse" value={data.coverage.product} total={data.totals.leads} icon={Target} /><CoverageCard label="Responsável com nome" value={data.coverage.responsibleName} total={data.totals.leads} icon={UserRound} /></div></section>

      <section className="grid gap-5 xl:grid-cols-3"><RankPanel eyebrow="Origem declarada" title="Informações da fonte" rows={data.sourceInformation} total={data.totals.leads} tone="emerald" limit={8} /><RankPanel eyebrow="Perfil" title="Posição" rows={data.positions} total={data.totals.leads} tone="amber" limit={8} /><RankPanel eyebrow="Interesse" title="Produto de Interesse" rows={data.products} total={data.totals.leads} tone="cyan" limit={8} /></section>

      <section className="rounded-2xl border border-amber-200/15 bg-[linear-gradient(135deg,rgba(251,191,36,.07),rgba(251,191,36,.015))] p-5"><div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-200" /><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-amber-100/75">Insights gerenciais automáticos</p></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{insights.map(item => <article key={item.label} className="rounded-xl border border-amber-100/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-amber-100/65">{item.label}</p><p className="mt-2 text-base font-bold text-white">{item.value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p></article>)}</div></section>

      <section className="flex flex-col justify-between gap-3 rounded-2xl border border-white/8 bg-white/[.02] p-4 text-xs leading-5 text-muted-foreground md:flex-row md:items-center"><span>Critério: título exato “{data.titleFilter}” · origem Evento excluída.</span><span>Responsáveis sem de-para unívoco aparecem pelo ID, sem nome presumido.</span></section>
    </>}
  </div>;
}

function ManagerKpi({ icon: Icon, label, value, helper, tone }: { icon: typeof Layers3; label: string; value: string; helper: string; tone: "cyan" | "violet" | "emerald" | "amber" }) {
  const colors = { cyan: "text-cyan-200 bg-cyan-200/10", violet: "text-violet-200 bg-violet-200/10", emerald: "text-emerald-200 bg-emerald-200/10", amber: "text-amber-200 bg-amber-200/10" };
  return <article className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p></div><span className={`grid h-9 w-9 place-items-center rounded-xl ${colors[tone]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-xs text-muted-foreground">{helper}</p></article>;
}

function PanelHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) { return <div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-cyan-100/60">{eyebrow}</p><h4 className="mt-1 text-lg font-bold text-white">{title}</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>; }

function RankPanel({ eyebrow, title, rows, total, tone, limit = 10 }: { eyebrow: string; title: string; rows: CountRow[]; total: number; tone: "cyan" | "violet" | "emerald" | "amber"; limit?: number }) {
  const max = Math.max(1, ...rows.map(item => item.count));
  const bar = { cyan: "bg-cyan-300", violet: "bg-violet-300", emerald: "bg-emerald-300", amber: "bg-amber-300" }[tone];
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><PanelHeader eyebrow={eyebrow} title={title} detail="Distribuição dentro do filtro atual." /><div className="mt-5 space-y-3">{rows.slice(0, limit).map(item => <div key={item.label}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-sm text-slate-300" title={item.label}>{item.label}</span><span className="shrink-0 font-mono-ui text-xs text-white">{integer(item.count)} · {percentage(item.count, total)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }} /></div></div>)}</div></div>;
}

function CoverageCard({ label, value, total, icon: Icon }: { label: string; value: number; total: number; icon: typeof Filter }) {
  const rate = total ? (value / total) * 100 : 0;
  return <article className="rounded-xl border border-white/8 bg-white/[.02] p-4"><div className="flex items-center justify-between"><Icon className="h-4 w-4 text-cyan-200" /><span className="font-mono-ui text-xs text-cyan-100">{percentage(value, total)}</span></div><p className="mt-4 text-sm font-semibold text-white">{label}</p><p className="mt-1 text-xs text-muted-foreground">{integer(value)} de {integer(total)} leads</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#34d399)]" style={{ width: `${rate}%` }} /></div></article>;
}

function LoadingState() { return <section className="grid min-h-[420px] place-items-center rounded-2xl border border-white/10 bg-black/15"><div className="text-center"><BarChart3 className="mx-auto h-7 w-7 animate-pulse text-cyan-200" /><p className="mt-3 text-sm text-muted-foreground">Montando a visão gerencial do Bitrix24…</p></div></section>; }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <section className="grid min-h-64 place-items-center rounded-2xl border border-white/10 bg-black/15 p-8 text-center"><div><Workflow className="mx-auto h-7 w-7 text-cyan-200" /><h4 className="mt-3 font-bold text-white">{title}</h4><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{detail}</p></div></section>; }
