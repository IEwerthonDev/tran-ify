import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Pages
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardHome from "@/pages/dashboard/index";
import ServicosPage from "@/pages/dashboard/servicos";
import AgendamentosPage from "@/pages/dashboard/agendamentos";
import DisponibilidadePage from "@/pages/dashboard/disponibilidade";
import AgendaPage from "@/pages/dashboard/agenda";
import ConfiguracoesPage from "@/pages/dashboard/configuracoes";
import RelatoriosPage from "@/pages/dashboard/relatorios";
import AdminOverview from "@/pages/admin/index";
import AdminTenants from "@/pages/admin/tenants";
import AdminContaPage from "@/pages/admin/conta";
import PublicBookingPage from "@/pages/public/booking";

const queryClient = new QueryClient();

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      
      {/* Tenant Routes */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardHome} allowedRole="tenant" />} />
      <Route path="/dashboard/servicos" component={() => <ProtectedRoute component={ServicosPage} allowedRole="tenant" />} />
      <Route path="/dashboard/agendamentos" component={() => <ProtectedRoute component={AgendamentosPage} allowedRole="tenant" />} />
      <Route path="/dashboard/disponibilidade" component={() => <ProtectedRoute component={DisponibilidadePage} allowedRole="tenant" />} />
      <Route path="/dashboard/agenda" component={() => <ProtectedRoute component={AgendaPage} allowedRole="tenant" />} />
      <Route path="/dashboard/configuracoes" component={() => <ProtectedRoute component={ConfiguracoesPage} allowedRole="tenant" />} />
      <Route path="/dashboard/relatorios" component={() => <ProtectedRoute component={RelatoriosPage} allowedRole="tenant" />} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={() => <ProtectedRoute component={AdminOverview} allowedRole="super_admin" />} />
      <Route path="/admin/tenants" component={() => <ProtectedRoute component={AdminTenants} allowedRole="super_admin" />} />
      <Route path="/admin/conta" component={() => <ProtectedRoute component={AdminContaPage} allowedRole="super_admin" />} />

      {/* Public Booking Route - MUST be last as it's a catch-all for slugs */}
      <Route path="/:slug" component={PublicBookingPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
