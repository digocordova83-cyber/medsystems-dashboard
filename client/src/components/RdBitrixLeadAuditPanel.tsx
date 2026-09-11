import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, DatabaseZap, Mail, Phone, RefreshCcw, ShieldCheck, UserCheck, UserRoundSearch, UserX, UsersRound } from "lucide-react";
import { useState } from "react";

type AuditBrand = "all" | "medsystems" | "beautysystems";
type AuditStatus = "all" | "lead" | "contact_only" | "not_found" | "multiple";
type BitrixCandidate = {
  entityType: "lead" | "contact";
  bitrixId: number;
  name: string;
  email: string;
  phone: string;
  stage: string;
  createdAt: string;
};
type AuditRow = {
  key: string;
  brandLabel: string;
  name: string;
  email: string;
  phone: string;
  rdDate: string;
  rdSource: string;
  rdEventCount: number;
  matchStatus: Exclude<AuditStatus, "all">;
  matchMethod: string;
  bitrixEntity: string;
  bitrixStage: string;
  bitrixCreatedAt: string | null;
  bitrixRecordCount: number;
  bitrixCandidates: BitrixCandidate[];
};

const number = (value: number) => Math.round(value || 0).toLocaleString("pt-BR");
const displayDate = (value: string) => value.split("-").reverse().join("/");

const statusPresentation: Record<Exclude<AuditStatus, "all">, { label: string; className: string }> = {
  lead: { label: "Encontrado como Lead", className: "border-emerald-200/20 bg-emerald-200/[.08] text-emerald-100" },
  contact_only: { label: "Somente Contato", className: "border-sky-200/20 bg-sky-200/[.08] text-sky-100" },
  not_found: { label: "Não encontrado", className: "border-amber-200/20 bg-amber-200/[.08] text-amber-100" },
  multiple: { label: "Múltiplos registros", className: "border-violet-200/20 bg-violet-200/[.08] text-violet-100" },
};

export function RdBitrixLeadAuditPanel({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [brand, setBrand] = useState<AuditBrand>("all");
  const [matchStatus, setMatchStatus] = useState<AuditStatus>("all");
  const query = trpc.leads.rdBitrixAudit.useQuery({ startDate, endDate, brand, matchStatus }, { staleTime: 60_000, refetchOnWindowFocus: true, retry: 1 });
  const data = query.data;

  return <section className="overflow-hidden rounded-[28px] border border-sky-200/15 bg-[radial-gradient(circle_at_92%_0%,rgba(56,189,248,.11),transparent_31%),radial-gradient(circle_at_5%_90%,rgba(52,211,153,.09),transparent_28%),linear-gradient(145deg,rgba(7,25,41,.98),rgba(5,14,25,.99))] shadow-2xl shadow-sky-950/20">
    <div className="flex flex-col justify-between gap-5 border-b border-white/10 p-5 sm:p-6 xl:flex-row xl:items-end">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-sky-200/20 bg-sky-200/[.06] text-sky-100"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Auditoria protegida</Badge><Badge variant="outline" className="border-white/10 text-white/60">RD Station ↔ Bitrix24</Badge></div>
        <p className="mt-4 font-mono-ui text-[10px] uppercase tracking-[.16em] text-sky-100/55">Conferência de integração</p>
        <h3 className="mt-1 text-xl font-black tracking-[-.03em] text-white sm:text-2xl">Leads do RD Station no Bitrix24</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">O funil usa os contatos qualificados no RD Station localizados no Bitrix24. A busca prioriza e-mail exato e usa nome normalizado apenas na ausência de e-mail correspondente; em casos múltiplos, cada Lead técnico candidato é incluído no funil e todos os registros ficam visíveis para revisão.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {([ ["all", "Todas"], ["medsystems", "MedSystems"], ["beautysystems", "BeautySystems"] ] as const).map(([value, label]) => <button key={value} onClick={() => setBrand(value)} className={`rounded-full border px-3 py-2 text-xs font-medium transition-all active:scale-[.97] ${brand === value ? "border-sky-200/35 bg-sky-200/15 text-sky-50" : "border-white/10 bg-white/[.025] text-slate-400 hover:border-white/20 hover:text-white"}`}>{label}</button>)}
      </div>
    </div>

    <div className="border-b border-white/10 bg-black/15 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <AuditMetric icon={UsersRound} label="Contatos RD" value={data ? number(data.totals.rdQualifiedContacts) : "—"} helper="Únicos e qualificados" tone="sky" />
          <AuditMetric icon={DatabaseZap} label="Eventos RD" value={data ? number(data.totals.rdQualifiedEvents) : "—"} helper="Conversões aceitas" tone="violet" />
          <AuditMetric icon={UserRoundSearch} label="RD com match único" value={data ? number(data.totals.matchedAsLead + data.totals.matchedAsContactOnly) : "—"} helper="Uma correspondência por e-mail ou nome" tone="cyan" />
          <AuditMetric icon={UserCheck} label="Leads múltiplos no funil" value={data ? number(data.totals.multipleLeadCandidates) : "—"} helper="Candidatos Lead de casos duplicados" tone="violet" />
          <AuditMetric icon={CheckCircle2} label="Leads técnicos Bitrix" value={data ? number(data.totals.bitrixTechnicalLeads) : "—"} helper={data?.unassignedBitrix.technicalLeads ? `Inclui ${number(data.unassignedBitrix.technicalLeads)} sem BU` : "Referência do CRM no período"} tone="emerald" />
        </div>
        <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="audit-match-status">Situação no Bitrix24</label><select id="audit-match-status" value={matchStatus} onChange={event => setMatchStatus(event.target.value as AuditStatus)} className="h-10 rounded-xl border border-white/10 bg-[#08131f] px-3 text-xs text-white outline-none focus:ring-2 focus:ring-sky-200/30"><option value="all">Todas as situações</option><option value="lead">Encontrado como Lead</option><option value="contact_only">Somente Contato</option><option value="not_found">Não encontrado</option><option value="multiple">Múltiplos registros</option></select><Button variant="outline" size="sm" onClick={() => query.refetch()} className="h-10 border-white/10 bg-white/[.025] text-slate-200 hover:bg-white/[.07]"><RefreshCcw className={`mr-2 h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />Atualizar</Button></div>
      </div>
      {data ? <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-white/8 bg-white/8 sm:grid-cols-4"><MatchSummary label="Como Lead" value={data.totals.matchedAsLead} tone="emerald" /><MatchSummary label="Somente Contato" value={data.totals.matchedAsContactOnly} tone="sky" /><MatchSummary label="Não encontrados" value={data.totals.notFound} tone="amber" /><MatchSummary label="Múltiplos registros" value={data.totals.multiple} tone="violet" /></div> : null}
    </div>

    {query.isLoading ? <div className="grid min-h-64 place-items-center p-8 text-center"><div><DatabaseZap className="mx-auto h-7 w-7 animate-pulse text-sky-200" /><p className="mt-3 text-sm text-slate-400">Conferindo as identidades entre RD Station e Bitrix24…</p></div></div> : query.isError ? <div className="grid min-h-64 place-items-center p-8 text-center"><div><UserX className="mx-auto h-7 w-7 text-rose-200" /><p className="mt-3 font-semibold text-white">Não foi possível carregar a auditoria</p><p className="mt-1 text-sm text-slate-500">{query.error.message}</p><Button onClick={() => query.refetch()} className="mt-4 bg-white text-slate-950 hover:bg-slate-100">Tentar novamente</Button></div></div> : data ? <>
      <div className="grid gap-px border-b border-white/10 bg-white/8 sm:grid-cols-2"><MethodNote label="Regra RD" text={data.methodology.rd} /><MethodNote label="Regra de correspondência" text={data.methodology.matching} /></div>
      <AuditTable rows={data.rows} />
    </> : null}
  </section>;
}

function AuditMetric({ icon: Icon, label, value, helper, tone }: { icon: typeof UsersRound; label: string; value: string; helper: string; tone: "sky" | "violet" | "cyan" | "emerald" }) { const color = { sky: "bg-sky-200/10 text-sky-100", violet: "bg-violet-200/10 text-violet-100", cyan: "bg-cyan-200/10 text-cyan-100", emerald: "bg-emerald-200/10 text-emerald-100" }[tone]; return <article className="rounded-xl border border-white/8 bg-white/[.025] p-3.5"><div className="flex items-start justify-between gap-2"><div><p className="text-[9px] uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 text-2xl font-black tracking-[-.04em] text-white">{value}</p></div><span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></span></div><p className="mt-1.5 text-[10px] text-slate-500">{helper}</p></article>; }
function MatchSummary({ label, value, tone }: { label: string; value: number; tone: "emerald" | "sky" | "amber" | "violet" }) { const color = { emerald: "text-emerald-100", sky: "text-sky-100", amber: "text-amber-100", violet: "text-violet-100" }[tone]; return <div className="bg-[#071722]/80 px-4 py-3"><p className="text-[9px] uppercase tracking-[.13em] text-slate-500">{label}</p><p className={`mt-1 font-mono-ui text-lg font-bold ${color}`}>{number(value)}</p></div>; }
function MethodNote({ label, text }: { label: string; text: string }) { return <div className="bg-black/15 p-4"><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-sky-100/60">{label}</p><p className="mt-1.5 text-xs leading-5 text-slate-400">{text}</p></div>; }

function BitrixCandidates({ row }: { row: AuditRow }) {
  if (!row.bitrixCandidates.length) return <div><p className="font-medium text-white">{row.bitrixStage}</p><p className="mt-1 text-slate-500">{row.bitrixEntity}{row.bitrixCreatedAt ? ` · criado em ${displayDate(row.bitrixCreatedAt)}` : ""}</p></div>;
  return <div className="space-y-2"><p className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-violet-100/70">{number(row.bitrixCandidates.length)} candidatos Bitrix24</p>{row.bitrixCandidates.map(candidate => <article key={`${candidate.entityType}:${candidate.bitrixId}`} className="rounded-lg border border-violet-200/15 bg-violet-200/[.045] p-2.5"><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="outline" className="border-violet-200/20 bg-violet-200/[.07] text-violet-100">{candidate.entityType === "lead" ? "Lead" : "Contato"} #{candidate.bitrixId}</Badge><span className="text-[10px] text-slate-500">Criado em {displayDate(candidate.createdAt)}</span></div><p className="mt-2 font-semibold text-white">{candidate.name}</p><p className="mt-1 break-all text-[11px] text-slate-400"><Mail className="mr-1 inline h-3 w-3 text-sky-200/70" />{candidate.email}</p><p className="mt-1 text-[11px] text-slate-400"><Phone className="mr-1 inline h-3 w-3 text-sky-200/70" />{candidate.phone}</p><p className="mt-2 text-[11px] font-medium text-sky-100">{candidate.stage}</p></article>)}</div>;
}

function AuditTable({ rows }: { rows: AuditRow[] }) {
  if (!rows.length) return <div className="grid min-h-60 place-items-center p-8 text-center"><div><UserRoundSearch className="mx-auto h-7 w-7 text-sky-200/65" /><p className="mt-3 font-semibold text-white">Nenhum contato nesta combinação de filtros</p><p className="mt-1 text-sm text-slate-500">Altere a BU ou a situação de correspondência para ampliar a lista.</p></div></div>;
  return <>
    <div className="audit-lead-scroll hidden max-h-[680px] overflow-auto lg:block"><table className="w-full min-w-[1450px] text-left text-xs"><thead className="sticky top-0 z-20 bg-[#071722]/95 text-[9px] uppercase tracking-[.14em] text-slate-400 shadow-[0_1px_0_rgba(255,255,255,.1)] backdrop-blur-xl"><tr><th className="px-5 py-4">Contato RD Station</th><th className="px-4 py-4">BU / data</th><th className="px-4 py-4">Origem RD</th><th className="px-4 py-4">Situação Bitrix</th><th className="px-4 py-4">Registro(s) Bitrix24</th></tr></thead><tbody className="divide-y divide-white/[.065]">{rows.map(row => <tr key={row.key} className="align-top transition-colors hover:bg-sky-100/[.03]"><td className="px-5 py-4"><p className="font-semibold text-white">{row.name}</p><p className="mt-2 flex items-center gap-2 text-slate-400"><Mail className="h-3.5 w-3.5 text-sky-200/70" />{row.email}</p><p className="mt-1.5 flex items-center gap-2 text-slate-400"><Phone className="h-3.5 w-3.5 text-sky-200/70" />{row.phone}</p></td><td className="px-4 py-4"><p className="font-medium text-sky-100">{row.brandLabel}</p><p className="mt-1 text-slate-500">Conversão: {displayDate(row.rdDate)}</p></td><td className="px-4 py-4"><p className="text-slate-200">{row.rdSource}</p><p className="mt-1 text-slate-500">{number(row.rdEventCount)} evento(s) qualificado(s)</p></td><td className="px-4 py-4"><Badge variant="outline" className={statusPresentation[row.matchStatus].className}>{statusPresentation[row.matchStatus].label}</Badge><p className="mt-2 text-slate-500">{row.matchMethod}{row.bitrixRecordCount > 1 ? ` · ${row.bitrixRecordCount} registros` : ""}</p></td><td className="px-4 py-4"><BitrixCandidates row={row} /></td></tr>)}</tbody></table></div>
    <div className="audit-lead-scroll max-h-[680px] space-y-3 overflow-auto p-4 lg:hidden">{rows.map(row => <article key={row.key} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-white">{row.name}</p><p className="mt-1 text-xs text-sky-100">{row.brandLabel} · {displayDate(row.rdDate)}</p></div><Badge variant="outline" className={statusPresentation[row.matchStatus].className}>{statusPresentation[row.matchStatus].label}</Badge></div><div className="mt-4 space-y-2 border-y border-white/8 py-3 text-xs text-slate-400"><p className="flex gap-2 break-all"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-200/70" />{row.email}</p><p className="flex gap-2"><Phone className="h-3.5 w-3.5 shrink-0 text-sky-200/70" />{row.phone}</p></div><div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><p className="text-slate-500">Origem RD</p><p className="mt-1 text-slate-200">{row.rdSource}</p></div><div><p className="text-slate-500">Situação</p><p className="mt-1 text-slate-200">{row.matchMethod}</p></div></div><div className="mt-4 border-t border-white/8 pt-4"><BitrixCandidates row={row} /></div></article>)}</div>
  </>;
}
