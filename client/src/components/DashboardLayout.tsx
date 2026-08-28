import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { BarChart3, BookOpenCheck, BriefcaseBusiness, LayoutDashboard, LogOut, PanelLeft, RadioTower, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", hash: "overview" },
  { icon: BarChart3, label: "Google Ads", hash: "google" },
  { icon: BarChart3, label: "Meta Ads", hash: "meta" },
  { icon: RadioTower, label: "Programática", hash: "programmatic" },
  { icon: BriefcaseBusiness, label: "Negócios", hash: "bitrix" },
  { icon: BookOpenCheck, label: "Guia de dados", hash: "guide" },
];

type DashboardUser = { username: string | null; name: string | null; role: "admin" | "user" };

export default function DashboardLayout({ children, user, onLogout }: { children: React.ReactNode; user: DashboardUser; onLogout: () => Promise<void> }) {
  return <SidebarProvider><DashboardShell user={user} onLogout={onLogout}>{children}</DashboardShell></SidebarProvider>;
}

function DashboardShell({ children, user, onLogout }: { children: React.ReactNode; user: DashboardUser; onLogout: () => Promise<void> }) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const [activeHash, setActiveHash] = useState(() => window.location.hash.replace("#", "") || "overview");

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash.replace("#", "") || "overview");
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const navigate = (hash: string) => {
    setActiveHash(hash);
    window.location.hash = hash;
  };
  const visibleMenuItems = user.role === "admin" ? [...menuItems, { icon: ScrollText, label: "Acessos", hash: "access" }] : menuItems;
  const displayName = user.name || user.username || "Usuário";
  const initial = displayName.slice(0, 1).toUpperCase();

  return <>
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-[#07090c]">
      <SidebarHeader className="h-20 justify-center border-b border-white/5">
        <div className="flex w-full items-center gap-3 px-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 font-mono-ui text-sm font-bold text-cyan-100 shadow-[0_0_22px_rgba(103,232,249,.12)]">M</span>{!collapsed ? <div className="min-w-0"><p className="font-mono-ui text-[10px] tracking-[.22em] text-cyan-200">MEDSYSTEMS</p><p className="mt-0.5 text-xs font-medium text-muted-foreground">Performance & negócios</p></div> : null}<button onClick={toggleSidebar} className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/[.08] hover:text-white" aria-label="Alternar menu"><PanelLeft className="h-4 w-4" /></button></div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <p className="px-3 pb-2 font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground group-data-[collapsible=icon]:hidden">Navegação</p>
        <SidebarMenu>{visibleMenuItems.map(item => <SidebarMenuItem key={item.hash}><SidebarMenuButton isActive={activeHash === item.hash} onClick={() => navigate(item.hash)} tooltip={item.label} className="h-11 rounded-xl text-muted-foreground transition data-[active=true]:bg-cyan-300/10 data-[active=true]:text-cyan-100 hover:bg-white/[.05] hover:text-white"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/5 p-3"><div className="flex items-center gap-2 rounded-xl p-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 font-mono-ui text-[10px] text-emerald-100">{initial}</span>{!collapsed ? <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-foreground">{displayName}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{user.role === "admin" ? "Administrador" : "Cliente"}</p></div> : null}<button type="button" onClick={() => onLogout()} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose-300/10 hover:text-rose-200" aria-label="Sair"><LogOut className="h-4 w-4" /></button></div></SidebarFooter>
    </Sidebar>
    <SidebarInset className="bg-[#080a0e]"><div className="flex h-14 items-center border-b border-white/5 px-4 md:hidden"><SidebarTrigger className="rounded-xl border border-white/10 bg-white/[.03]" /><span className="ml-3 text-sm font-semibold">Performance Command Center</span></div><main className="min-h-screen p-4 lg:p-6">{children}</main></SidebarInset>
  </>;
}
