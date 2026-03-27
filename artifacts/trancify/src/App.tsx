import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

// Pages
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardHome from "@/pages/dashboard/index";
import ServicosPage from "@/pages/dashboard/servicos";
import AgendamentosPage from "@/pages/dashboard/agendamentos";
import DisponibilidadePage from "@/pages/dashboard/disponibilidade";
import PublicBookingPage from "@/pages/public/booking";

const queryClient = new QueryClient();

// Simple Protected Route Wrapper
function ProtectedRoute({ component: Component, allowedRole }: { component: any, allowedRole?: string }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" /></div>;
  
  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  if (allowedRole && user?.role !== allowedRole) {
    setLocation(user?.role === "super_admin" ? "/admin" : "/dashboard");
    return null;
  }

  return <Component />;
}

// Temporary placeholders for missing pages to satisfy completeness routing
function TempPage({ title }: { title: string }) {
  return <div className="p-10"><h1 className="text-3xl font-bold">{title} (Em construção)</h1></div>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      
      {/* Tenant Routes */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardHome} allowedRole="tenant" />} />
      <Route path="/dashboard/servicos" component={() => <ProtectedRoute component={ServicosPage} allowedRole="tenant" />} />
      <Route path="/dashboard/agendamentos" component={() => <ProtectedRoute component={AgendamentosPage} allowedRole="tenant" />} />
      <Route path="/dashboard/disponibilidade" component={() => <ProtectedRoute component={DisponibilidadePage} allowedRole="tenant" />} />
      <Route path="/dashboard/agenda" component={() => <ProtectedRoute component={() => <TempPage title="Agenda Calendário" />} allowedRole="tenant" />} />
      <Route path="/dashboard/configuracoes" component={() => <ProtectedRoute component={() => <TempPage title="Configurações do Salão" />} allowedRole="tenant" />} />
      <Route path="/dashboard/relatorios" component={() => <ProtectedRoute component={() => <TempPage title="Relatórios Financeiros" />} allowedRole="tenant" />} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={() => <ProtectedRoute component={() => <TempPage title="Admin Visão Geral" />} allowedRole="super_admin" />} />
      <Route path="/admin/tenants" component={() => <ProtectedRoute component={() => <TempPage title="Gerenciar Tenants" />} allowedRole="super_admin" />} />

      {/* Public Booking Route - MUST be last as it's a catch-all for slugs */}
      <Route path="/:slug" component={PublicBookingPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
