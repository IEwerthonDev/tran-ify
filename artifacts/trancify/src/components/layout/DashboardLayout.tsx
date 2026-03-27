import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  CalendarDays, 
  ListTodo, 
  Scissors, 
  Clock, 
  Settings, 
  BarChart3, 
  LogOut,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isSuperAdmin = user?.role === "super_admin";

  const tenantNav = [
    { name: "Início", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
    { name: "Agendamentos", href: "/dashboard/agendamentos", icon: ListTodo },
    { name: "Serviços", href: "/dashboard/servicos", icon: Scissors },
    { name: "Disponibilidade", href: "/dashboard/disponibilidade", icon: Clock },
    { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
    { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
  ];

  const adminNav = [
    { name: "Visão Geral", href: "/admin", icon: LayoutDashboard },
    { name: "Trancistas (Tenants)", href: "/admin/tenants", icon: Users },
  ];

  const navItems = isSuperAdmin ? adminNav : tenantNav;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-72 bg-card border-r border-border/50 hidden md:flex flex-col fixed inset-y-0 z-10 shadow-2xl shadow-black/5">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-display font-bold text-xl shadow-lg">
            T
          </div>
          <span className="font-display font-bold text-2xl text-foreground tracking-tight">
            Trançify
          </span>
        </div>

        <div className="px-6 pb-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
            {isSuperAdmin ? "Administração" : "Meu Salão"}
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href} className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}>
                  <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-primary-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-border/50">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30" onClick={() => logout()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair da conta
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-72 flex flex-col min-h-screen relative">
        <div className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
