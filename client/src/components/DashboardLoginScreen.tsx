import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

const MEDSYSTEMS_LOGO = "/manus-storage/medsystems-login-logo_75d768a6.png";
const BEAUTYSYSTEMS_LOGO = "/manus-storage/beautysystems-login-logo_83bf2516.png";

export function DashboardLoginScreen({ onAuthenticated }: { onAuthenticated: () => Promise<unknown> | void }) {
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = trpc.auth.login.useMutation({
    onSuccess: async user => {
      utils.auth.me.setData(undefined, user);
      await onAuthenticated();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password || login.isPending) return;
    login.mutate({ username, password });
  };

  return <main className="relative min-h-screen overflow-hidden bg-white text-slate-950">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(236,72,153,.09),transparent_29%),radial-gradient(circle_at_86%_86%,rgba(20,184,166,.12),transparent_30%)]" />
    <div className="relative mx-auto grid min-h-screen max-w-[1320px] place-items-center px-5 py-10 sm:px-8">
      <section className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,.14)] lg:grid lg:grid-cols-[.92fr_1.08fr]">
        <div className="relative flex min-h-[340px] flex-col justify-between overflow-hidden border-b border-slate-200 bg-[linear-gradient(145deg,#fff_4%,#fbf5fa_48%,#effcfb)] p-7 sm:p-10 lg:min-h-[650px] lg:border-b-0 lg:border-r">
          <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur"><ShieldCheck className="h-4 w-4 text-teal-600" />Ambiente protegido</div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-5 sm:gap-8 lg:justify-start">
              <img src={MEDSYSTEMS_LOGO} alt="MedSystems" className="h-auto max-h-24 w-auto max-w-[210px] object-contain" />
              <span className="text-3xl font-light text-slate-300" aria-hidden="true">+</span>
              <img src={BEAUTYSYSTEMS_LOGO} alt="BeautySystems" className="h-auto max-h-20 w-auto max-w-[180px] object-contain" />
            </div>
          </div>
          <div className="relative max-w-md">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.24em] text-teal-700">Revenue command center</p>
            <h1 className="mt-4 text-3xl font-black tracking-[-.045em] text-slate-950 sm:text-4xl">Performance, mídia e negócios em um único ambiente.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">Acesso restrito aos dados de Google Ads, Meta Ads, RD Station e Bitrix24.</p>
          </div>
        </div>

        <div className="flex items-center p-7 sm:p-10 lg:p-16">
          <form onSubmit={submit} className="mx-auto w-full max-w-md" noValidate>
            <p className="font-mono-ui text-[10px] uppercase tracking-[.22em] text-slate-400">Acesso ao dashboard</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-slate-950">Entrar</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use as credenciais fornecidas pelo administrador.</p>

            <label className="mt-8 block">
              <span className="text-xs font-semibold text-slate-700">Usuário</span>
              <span className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-teal-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10">
                <UserRound className="h-4 w-4 text-slate-400" />
                <input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Digite seu usuário" className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400" />
              </span>
            </label>

            <label className="mt-5 block">
              <span className="text-xs font-semibold text-slate-700">Senha</span>
              <span className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-teal-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Digite sua senha" className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400" />
                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </span>
            </label>

            {login.error ? <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{login.error.message || "Não foi possível entrar. Verifique suas credenciais."}</div> : null}

            <Button type="submit" disabled={!username.trim() || !password || login.isPending} className="mt-7 h-12 w-full rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800">
              {login.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validando acesso</> : <>Acessar dashboard<ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
            <p className="mt-6 text-center text-xs leading-5 text-slate-400">Tentativas de acesso são registradas para segurança e auditoria.</p>
          </form>
        </div>
      </section>
    </div>
  </main>;
}

export function DashboardAuthLoading() {
  return <div className="grid min-h-screen place-items-center bg-white"><div className="text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-teal-600" /><p className="mt-3 text-sm text-slate-500">Validando acesso…</p></div></div>;
}
