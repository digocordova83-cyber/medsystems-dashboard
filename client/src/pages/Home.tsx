import DashboardLayout from "@/components/DashboardLayout";
import { RevenueAnalytics } from "@/components/RevenueAnalytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Copy,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type AccountKey = "medsystems" | "beautysystems";

const accountAccent: Record<AccountKey, string> = {
  medsystems: "from-cyan-300/25 to-blue-500/5 border-cyan-200/25",
  beautysystems: "from-emerald-300/20 to-teal-500/5 border-emerald-200/25",
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Indisponível";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 first:pl-5">
      <p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function DealMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="p-5 first:pl-6"><p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>{detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}</div>;
}

function formatBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

export default function Home() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const status = trpc.rdstation.status.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 20_000 });
  const callback = trpc.rdstation.callbackInfo.useQuery(undefined, { enabled: Boolean(user) });
  const bitrix = trpc.bitrix24.medsystemsStatus.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 60_000 });
  const bitrixJuly = trpc.bitrix24.medsystemsJulyTotals.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 60_000 });
  const bitrixDeals = trpc.bitrix24.medsystemsJulyDealAnalytics.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 60_000 });
  const medSegmentations = trpc.rdstation.listSegmentations.useQuery({ accountKey: "medsystems" }, { enabled: false });
  const beautySegmentations = trpc.rdstation.listSegmentations.useQuery({ accountKey: "beautysystems" }, { enabled: false });
  const [segmentations, setSegmentations] = useState<Partial<Record<AccountKey, string>>>({});

  const beginAuthorization = trpc.rdstation.startAuthorization.useMutation({
    onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
    onError: error => toast.error(error.message),
  });
  const setSegmentation = trpc.rdstation.updateSegmentation.useMutation({
    onSuccess: () => {
      toast.success("Segmentação salva.");
      utils.rdstation.status.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const syncContacts = trpc.rdstation.syncContacts.useMutation({
    onSuccess: ({ imported, page, total, complete }) => {
      toast.success(complete ? `Importação concluída: ${total || imported} contatos.` : `Página ${page} importada: ${imported} contatos.`);
      utils.rdstation.status.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const syncEvents = trpc.rdstation.syncNextEvents.useMutation({
    onSuccess: ({ contactsProcessed, eventsStored, complete }) => {
      toast.success(complete ? `${eventsStored} conversões armazenadas. Coleta concluída.` : `${contactsProcessed} contatos processados; ${eventsStored} conversões armazenadas.`);
      utils.rdstation.status.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (status.data) {
      setSegmentations(Object.fromEntries(status.data.accounts.map(account => [account.accountKey, account.segmentationId ?? ""])) as Partial<Record<AccountKey, string>>);
    }
  }, [status.data]);

  const busy = beginAuthorization.isPending || setSegmentation.isPending || syncContacts.isPending || syncEvents.isPending;
  const copyCallback = async () => {
    if (!callback.data?.callbackUrl) return;
    await navigator.clipboard.writeText(callback.data.callbackUrl);
    toast.success("URL de callback copiada.");
  };

  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center p-5">
        <div className="surface-glass w-full max-w-md rounded-3xl p-9 text-center shadow-2xl">
          <div className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck className="h-6 w-6" /></div>
          <p className="font-mono-ui text-xs uppercase tracking-[.22em] text-cyan-200">RD Station Marketing</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Controle de integração</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Acesse o painel para conectar e sincronizar Medsystems e BeautySystems.</p>
          <Button onClick={() => startLogin()} className="mt-8 w-full bg-primary text-primary-foreground hover:bg-cyan-300">Entrar com Manus <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8 px-1 pb-12 pt-3">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgb(103,232,249)]" /><span className="font-mono-ui text-xs uppercase tracking-[.18em] text-cyan-100/70">integração de dados · julho 2026</span></div>
            <h1 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">RD Station <span className="text-cyan-200">Control</span></h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Autorização OAuth2, coleta paginada e armazenamento isolado de contatos e conversões por conta.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Painel restrito · tokens criptografados</div>
        </header>

        <RevenueAnalytics />

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="surface-glass rounded-2xl p-5 lg:col-span-2">
            <div className="flex items-start justify-between gap-4"><div><p className="font-mono-ui text-[11px] uppercase tracking-[.16em] text-muted-foreground">Callback OAuth público</p><p className="mt-2 break-all text-sm font-medium text-foreground">{callback.data?.callbackUrl ?? "Carregando URL…"}</p></div><Button variant="outline" size="icon" onClick={copyCallback} disabled={!callback.data}><Copy className="h-4 w-4" /></Button></div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">Cadastre esta mesma URL no App Publisher do RD Station para cada aplicativo. Depois de publicar o projeto, atualize a URL cadastrada para o domínio publicado.</p>
          </div>
          <div className="rounded-2xl border border-cyan-200/15 bg-cyan-300/8 p-5"><Sparkles className="h-5 w-5 text-cyan-200" /><p className="mt-3 text-sm font-semibold">Coleta controlada</p><p className="mt-1 text-xs leading-5 text-cyan-100/65">A lista de contatos é importada por páginas; eventos são processados em lotes curtos para respeitar os limites da API.</p></div>
        </section>

        <section className="surface-glass flex flex-col justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3"><div className={`mt-1 h-2.5 w-2.5 rounded-full ${bitrix.data?.connected ? "bg-emerald-300 shadow-[0_0_12px_rgb(110,231,183)]" : "bg-orange-300"}`} /><div><p className="font-mono-ui text-[11px] uppercase tracking-[.16em] text-muted-foreground">Bitrix24 CRM · Medsystems</p><p className="mt-1 text-sm font-semibold">{bitrix.data?.connected ? "Conectado com sucesso" : "Conexão indisponível"}</p><p className="mt-1 text-xs text-muted-foreground">{bitrix.data?.connected ? `Portal: ${bitrix.data.portal}` : "Verifique o webhook de entrada configurado."}</p><p className="mt-2 text-xs text-emerald-100/80">Julho/2026: <strong>{bitrixJuly.data?.lead ?? 0}</strong> leads · <strong>{bitrixJuly.data?.contact ?? 0}</strong> contatos · <strong>{bitrixJuly.data?.deal ?? 0}</strong> negócios</p></div></div>
          {bitrix.data?.connected ? <div className="flex gap-2">{bitrix.data.capabilities.map(capability => <Badge key={capability} variant="outline" className="border-emerald-200/20 text-emerald-100">{capability}</Badge>)}</div> : null}
        </section>

        {bitrixDeals.data ? <section className="surface-glass overflow-hidden rounded-3xl" id="negocios">
          <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-end"><div><p className="font-mono-ui text-[11px] uppercase tracking-[.16em] text-cyan-100/70">Bitrix24 · negócios criados em julho/2026</p><h2 className="mt-1 text-xl font-bold tracking-tight">Fechamentos, valores e descartes</h2></div><p className="text-xs text-muted-foreground">Valores em BRL · Critério: DATE_CREATE</p></div>
          <div className="grid divide-x divide-white/10 border-b border-white/10 sm:grid-cols-4"><DealMetric label="Negócios criados" value={bitrixDeals.data.total.toLocaleString("pt-BR")} /><DealMetric label="Fechados" value={bitrixDeals.data.closed.toLocaleString("pt-BR")} detail={`${bitrixDeals.data.won} ganhos · ${bitrixDeals.data.lost} perdidos`} /><DealMetric label="Valor ganho" value={formatBrl(bitrixDeals.data.wonValue)} detail={`${bitrixDeals.data.wonRateOfClosed.toFixed(1)}% dos fechados`} /><DealMetric label="Ticket médio ganho" value={formatBrl(bitrixDeals.data.averageWonTicket)} detail={`${bitrixDeals.data.open} em aberto`} /></div>
          <div className="grid gap-0 lg:grid-cols-2"><div className="p-6"><h3 className="text-sm font-semibold">Origens dos negócios</h3><div className="mt-4 space-y-3">{bitrixDeals.data.sources.slice(0, 6).map(source => <div key={source.label} className="flex items-center justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm text-foreground">{source.label}</p><p className="text-xs text-muted-foreground">{source.count} negócios</p></div><p className="font-mono-ui text-xs text-cyan-100">{formatBrl(source.value)}</p></div>)}</div></div>
          <div className="border-t border-white/10 p-6 lg:border-l lg:border-t-0"><h3 className="text-sm font-semibold">Descartes por pipeline</h3><div className="mt-4 space-y-3">{bitrixDeals.data.losses.map(loss => <div key={loss.label} className="flex items-center justify-between gap-4"><div><p className="text-sm text-foreground">{loss.label}</p><p className="text-xs text-muted-foreground">{loss.count} descartes · {loss.withObservation} com observação</p></div><p className="font-mono-ui text-xs text-orange-100">{formatBrl(loss.value)}</p></div>)}</div><p className="mt-5 rounded-xl border border-amber-200/15 bg-amber-100/5 p-3 text-xs leading-5 text-amber-50/70">O Bitrix24 disponibiliza a etapa “Negócio perdido”, mas não possui um campo estruturado de motivo de perda nos dados recebidos. As observações existem em texto livre e não são exibidas neste painel.</p></div></div>
        </section> : null}

        <section id="sincronizacao" className="grid gap-5 xl:grid-cols-2">
          {status.isLoading ? <div className="surface-glass col-span-full grid min-h-72 place-items-center rounded-3xl"><Loader2 className="animate-spin text-primary" /></div> : status.data?.accounts.map(account => {
            const key = account.accountKey as AccountKey;
            const accountSegmentations = key === "medsystems" ? medSegmentations : beautySegmentations;
            const isReady = account.authorized && account.status !== "erro";
            return (
              <article key={account.accountKey} className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-2xl ${accountAccent[key]}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${isReady ? "bg-emerald-300" : account.status === "erro" ? "bg-orange-300" : "bg-slate-400"}`} /><p className="font-mono-ui text-[11px] uppercase tracking-[.18em] text-muted-foreground">Conta separada</p></div><h2 className="mt-2 text-2xl font-bold tracking-tight">{account.displayName}</h2></div>
                  <Badge variant="outline" className="border-white/15 bg-black/15 px-3 py-1 text-[11px] capitalize text-foreground">{account.status}</Badge>
                </div>
                <div className="mt-6 grid grid-cols-4 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/15 py-4"><Metric label="1ª conv. jul." value={account.firstJulyQualified} /><Metric label="Última conv. jul." value={account.lastJulyQualified} /><Metric label="Pendentes" value={account.contactsPendingEvents} /><Metric label="Página" value={account.contactSyncPage} /></div>
                <p className="mt-3 text-[11px] text-muted-foreground">{account.contactsSyncedAt ? `Contatos concluídos: ${formatDate(account.contactsSyncedAt)}` : `Progresso: ${account.contactsStored.toLocaleString("pt-BR")}${account.contactSyncTotal ? ` de ${account.contactSyncTotal.toLocaleString("pt-BR")}` : ""} contatos`}</p>
                <div className="mt-5 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><p>Autorização: <span className="text-foreground">{formatDate(account.authorizedAt)}</span></p><p>Última coleta: <span className="text-foreground">{formatDate(account.lastSyncAt)}</span></p></div>
                {account.lastError ? <div className="mt-4 flex gap-2 rounded-xl border border-orange-300/25 bg-orange-300/10 p-3 text-xs text-orange-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{account.lastError}</div> : null}
                <div className="mt-6 border-t border-white/10 pt-5">
                  <Label htmlFor={`segment-${key}`} className="text-xs font-semibold text-foreground">Identificador da segmentação de julho/2026</Label>
                  <div className="mt-2 flex gap-2"><Input id={`segment-${key}`} list={`segments-${key}`} value={segmentations[key] ?? ""} placeholder="UUID ou ID da segmentação" onChange={event => setSegmentations(current => ({ ...current, [key]: event.target.value }))} className="border-white/10 bg-black/20 text-sm" /><Button variant="outline" disabled={busy} onClick={() => setSegmentation.mutate({ accountKey: key, segmentationId: segmentations[key] ?? "" })}>Salvar</Button></div>
                  <datalist id={`segments-${key}`}>{accountSegmentations.data?.segmentations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</datalist>
                  <div className="mt-2 flex flex-wrap items-center gap-2"><Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-cyan-100 hover:bg-cyan-200/10 hover:text-cyan-100" disabled={accountSegmentations.isFetching || !account.authorized} onClick={() => accountSegmentations.refetch()}>{accountSegmentations.isFetching ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}Carregar segmentações</Button>{accountSegmentations.data ? <span className="text-[11px] text-muted-foreground">{accountSegmentations.data.segmentations.length} opções encontradas</span> : null}</div>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Carregue as segmentações desta conta e escolha a que representa julho de 2026. O campo sugere os identificadores encontrados.</p>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  <Button disabled={busy} onClick={() => beginAuthorization.mutate({ accountKey: key })} className="bg-white text-slate-950 hover:bg-cyan-100"><ExternalLink className="mr-2 h-4 w-4" />{account.authorized ? "Reautorizar" : "Autorizar"}</Button>
                  <Button variant="secondary" disabled={busy || !account.authorized || !account.segmentationId || Boolean(account.contactsSyncedAt)} onClick={() => syncContacts.mutate({ accountKey: key })}><Database className="mr-2 h-4 w-4" />Importar próxima página</Button>
                  <Button variant="outline" disabled={busy || !account.authorized || account.contactsPendingEvents === 0} onClick={() => syncEvents.mutate({ accountKey: key })}><RefreshCw className="mr-2 h-4 w-4" />Próximo lote</Button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />Dados e tokens desta conta não são reutilizados na outra conta.</div>
              </article>
            );
          })}
        </section>
        <section className="surface-glass rounded-3xl p-6"><div className="flex items-center gap-3"><ChevronRight className="h-5 w-5 text-cyan-200" /><div><h3 className="font-semibold">Ordem recomendada</h3><p className="mt-1 text-sm text-muted-foreground">Autorize a conta, informe a segmentação de julho de 2026, importe os contatos e processe os lotes de conversões até que o campo pendentes seja zero.</p></div></div></section>
        <section className="rounded-3xl border border-amber-200/15 bg-amber-100/5 p-6"><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" /><div><h3 className="font-semibold text-amber-50">Nota sobre a coleta direta por API</h3><p className="mt-1 text-sm leading-6 text-amber-50/70">A API permite classificar origem a partir do <span className="font-mono-ui text-[12px]">traffic_source</span>. Como ela não retorna o campo do Dashboard “Recurso usado na conversão”, a exclusão de Importação é técnica, baseada em marcadores de identificador, família e payload do evento. Para reproduzir o filtro do Dashboard de forma idêntica, use uma segmentação criada no RD Station.</p></div></div></section>
      </div>
    </DashboardLayout>
  );
}
