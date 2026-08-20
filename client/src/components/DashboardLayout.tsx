import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { BarChart3, BookOpenCheck, CircleDollarSign, Database, FileSpreadsheet, LayoutDashboard, LogOut, PanelLeft, RadioTower } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", hash: "overview" },
  { icon: BarChart3, label: "Google Ads", hash: "google" },
  { icon: BarChart3, label: "Meta Ads", hash: "meta" },
  { icon: CircleDollarSign, label: "Revenue", hash: "revenue" },
  { icon: Database, label: "Bitrix24", hash: "bitrix" },
  { icon: FileSpreadsheet, label: "Planilha Bitrix24", hash: "spreadsheet" },
  { icon: RadioTower, label: "RD Station", hash: "rdstation" },
  { icon: BookOpenCheck, label: "Guia de dados", hash: "guide" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="grid min-h-screen place-items-center p-5"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-9 text-center"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-cyan-200">Acesso protegido</p><h1 className="mt-3 text-2xl font-bold">Revenue Command Center</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Entre para acessar os dados de mídia, leads e receita.</p><Button onClick={() => startLogin()} className="mt-7 w-full bg-cyan-200 text-slate-950 hover:bg-cyan-100">Entrar no painel</Button></div></div>;
  return <SidebarProvider><DashboardShell>{children}</DashboardShell></SidebarProvider>;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
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

  return <>
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-[#07090c]">
      <SidebarHeader className="h-20 justify-center border-b border-white/5">
        <div className="flex w-full items-center gap-3 px-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 font-mono-ui text-sm font-bold text-cyan-100 shadow-[0_0_22px_rgba(103,232,249,.12)]">M</span>{!collapsed ? <div className="min-w-0"><p className="font-mono-ui text-[10px] tracking-[.22em] text-cyan-200">MEDSYSTEMS</p><p className="mt-0.5 text-xs font-medium text-muted-foreground">Revenue control</p></div> : null}<button onClick={toggleSidebar} className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/[.08] hover:text-white" aria-label="Alternar menu"><PanelLeft className="h-4 w-4" /></button></div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <p className="px-3 pb-2 font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground group-data-[collapsible=icon]:hidden">Navegação</p>
        <SidebarMenu>{menuItems.map(item => <SidebarMenuItem key={item.hash}><SidebarMenuButton isActive={activeHash === item.hash} onClick={() => navigate(item.hash)} tooltip={item.label} className="h-11 rounded-xl text-muted-foreground transition data-[active=true]:bg-cyan-300/10 data-[active=true]:text-cyan-100 hover:bg-white/[.05] hover:text-white"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/5 p-3">
        <DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[.05]"><Avatar className="h-8 w-8 border border-white/10"><AvatarFallback className="bg-cyan-200/10 text-xs text-cyan-100">{user?.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback></Avatar>{!collapsed ? <div className="min-w-0"><p className="truncate text-xs font-medium text-foreground">{user?.name || "Usuário"}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">Acesso protegido</p></div> : null}</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="bg-[#080a0e]"><div className="flex h-14 items-center border-b border-white/5 px-4 md:hidden"><SidebarTrigger className="rounded-xl border border-white/10 bg-white/[.03]" /><span className="ml-3 text-sm font-semibold">Revenue Command Center</span></div><main className="min-h-screen p-4 lg:p-6">{children}</main></SidebarInset>
  </>;
}
