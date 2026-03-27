import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetMyAppointments, useUpdateAppointment, useUpdateAppointmentCost } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AgendamentosPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { data: appointments, isLoading, refetch } = useGetMyAppointments();

  const filtered = appointments?.filter(a => filterStatus === "all" || a.status === filterStatus).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-foreground">Todos Agendamentos</h1>
        <p className="text-muted-foreground mt-2 text-lg">Gerencie clientes, status e custos de material.</p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
          <button 
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${filterStatus === status ? 'bg-foreground text-background shadow-md' : 'bg-card border border-border text-muted-foreground hover:border-foreground/30'}`}
          >
            {status === 'all' ? 'Todos' : 
             status === 'pending' ? 'Pendentes' : 
             status === 'confirmed' ? 'Confirmados' : 
             status === 'completed' ? 'Concluídos' : 'Cancelados'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-card rounded-2xl border border-border/50 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xl shadow-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="p-4 pl-6 font-semibold">Data & Hora</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Serviço</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 pr-6 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(app => (
                  <tr key={app.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-lg">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{format(parseISO(app.date), "dd/MM/yyyy")}</div>
                          <div className="text-sm text-muted-foreground">{app.time}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{app.clientName}</div>
                      <div className="text-sm text-muted-foreground">{app.clientPhone || "Sem telefone"}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-foreground">{app.serviceName}</div>
                      <div className="text-sm text-primary font-bold">{formatCurrency(app.servicePrice)}</div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <ActionMenu appointment={app} onUpdate={refetch} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                Nenhum agendamento encontrado para este filtro.
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    pending: { label: "Pendente", classes: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    confirmed: { label: "Confirmado", classes: "bg-blue-100 text-blue-800 border-blue-200" },
    completed: { label: "Concluído", classes: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    cancelled: { label: "Cancelado", classes: "bg-red-100 text-red-800 border-red-200" },
  };
  const config = map[status];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.classes}`}>
      {config.label}
    </span>
  );
}

function ActionMenu({ appointment, onUpdate }: { appointment: any, onUpdate: () => void }) {
  const [costStr, setCostStr] = useState(appointment.materialCost?.toString() || "");
  const [isCostOpen, setIsCostOpen] = useState(false);
  const updateStatus = useUpdateAppointment();
  const updateCost = useUpdateAppointmentCost();
  const { toast } = useToast();

  const handleStatus = async (status: any) => {
    await updateStatus.mutateAsync({ id: appointment.id, data: { status } });
    toast({ title: "Status atualizado" });
    onUpdate();
  };

  const handleSaveCost = async () => {
    await updateCost.mutateAsync({ id: appointment.id, data: { materialCost: Number(costStr) } });
    toast({ title: "Custo salvo com sucesso" });
    setIsCostOpen(false);
    onUpdate();
  };

  return (
    <div className="flex justify-end gap-2">
      {appointment.status === 'pending' && (
        <Button size="sm" className="h-9 rounded-lg" onClick={() => handleStatus('confirmed')}>Confirmar</Button>
      )}
      {appointment.status === 'confirmed' && (
        <Button size="sm" variant="outline" className="h-9 rounded-lg bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" onClick={() => handleStatus('completed')}>Concluir</Button>
      )}
      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
        <Button size="sm" variant="ghost" className="h-9 text-destructive hover:bg-destructive/10" onClick={() => handleStatus('cancelled')}>Cancelar</Button>
      )}
      
      {appointment.status === 'completed' && (
        <Dialog open={isCostOpen} onOpenChange={setIsCostOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary" className="h-9 rounded-lg font-bold">
              {appointment.materialCost ? formatCurrency(appointment.materialCost) : "Add Custo"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Custo de Material</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Registre quanto gastou de jumbo/material para este atendimento para calcular seu lucro real.</p>
              <div>
                <label className="text-sm font-semibold mb-1 block">Valor (R$)</label>
                <Input type="number" value={costStr} onChange={e => setCostStr(e.target.value)} placeholder="Ex: 85.50" />
              </div>
              <Button onClick={handleSaveCost} className="w-full">Salvar Custo</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
