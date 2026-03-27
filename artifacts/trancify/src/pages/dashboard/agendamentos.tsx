import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetMyAppointments, useUpdateAppointment, useUpdateAppointmentCost, useDeleteAppointment } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Calendar, Trash2, Eye, User, Phone, CreditCard, Ruler, Image, MessageSquare, X } from "lucide-react";
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
                      <div className="flex justify-end items-center gap-2">
                        <DetailModal appointment={app} />
                        <ActionMenu appointment={app} onUpdate={refetch} />
                      </div>
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

function DetailModal({ appointment }: { appointment: any }) {
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const photos: string[] = appointment.referencePhotos ?? [];
  const paymentLabel: Record<string, string> = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };
  const braidLabel: Record<string, string> = { mid_back: "Até o meio das costas", waist_butt: "Até a cintura / Bumbum" };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="h-9 rounded-lg gap-1.5 text-muted-foreground hover:text-foreground">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Ver</span>
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => { if (lightbox) e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Detalhes do Agendamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Date / Time / Status */}
            <div className="flex items-center justify-between bg-secondary/50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">
                    {format(parseISO(appointment.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-muted-foreground text-sm">às {appointment.time}</p>
                </div>
              </div>
              <StatusBadge status={appointment.status} />
            </div>

            {/* Client Info */}
            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Dados da Cliente</h3>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{appointment.clientName}</p>
                  {appointment.clientAge && <p className="text-sm text-muted-foreground">{appointment.clientAge} anos</p>}
                </div>
              </div>
              {appointment.clientPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`https://wa.me/${appointment.clientPhone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                     className="text-primary font-semibold hover:underline">
                    {appointment.clientPhone}
                  </a>
                </div>
              )}
            </div>

            {/* Service Info */}
            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Serviço</h3>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-foreground">{appointment.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{braidLabel[appointment.braidSize] ?? appointment.braidSize}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{formatCurrency(appointment.servicePrice)}</p>
                  {appointment.materialCost != null && (
                    <p className="text-xs text-muted-foreground">
                      Material: {formatCurrency(appointment.materialCost)} · Lucro: {formatCurrency(appointment.servicePrice - appointment.materialCost)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">Pagamento: <strong className="text-foreground">{paymentLabel[appointment.paymentMethod] ?? appointment.paymentMethod}</strong></span>
              </div>
            </div>

            {/* Hair Description */}
            {appointment.hairDescription && (
              <div className="bg-card rounded-2xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição do Cabelo</h3>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{appointment.hairDescription}</p>
              </div>
            )}

            {/* Reference Photos */}
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fotos de Referência</h3>
              </div>
              {photos.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nenhuma foto de referência enviada.</p>
              ) : (
                <div className="flex gap-3 flex-wrap">
                  {photos.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightbox(src)}
                      className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md group"
                    >
                      <img src={src} alt={`Referência ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="bg-secondary/40 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Observações</p>
                <p className="text-sm text-foreground">{appointment.notes}</p>
              </div>
            )}
          </div>

          {/* Lightbox — inside DialogContent so it's within the focus trap */}
          {lightbox && (
            <div
              className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
              style={{ zIndex: 9999 }}
              onClick={() => setLightbox(null)}
            >
              <button
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 rounded-full p-2 transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={lightbox}
                alt="Foto ampliada"
                className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
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
  const deleteAppt = useDeleteAppointment();
  const { toast } = useToast();

  const handleStatus = async (status: any) => {
    try {
      await updateStatus.mutateAsync({ id: appointment.id, data: { status } });
      toast({ title: "Status atualizado" });
      onUpdate();
    } catch {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const handleSaveCost = async () => {
    const val = Number(costStr);
    if (isNaN(val) || val < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    try {
      await updateCost.mutateAsync({ id: appointment.id, data: { materialCost: val } });
      toast({ title: "Custo salvo com sucesso" });
      setIsCostOpen(false);
      onUpdate();
    } catch {
      toast({ title: "Erro ao salvar custo", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.")) return;
    try {
      await deleteAppt.mutateAsync({ id: appointment.id });
      toast({ title: "Agendamento excluído" });
      onUpdate();
    } catch {
      toast({ title: "Erro ao excluir agendamento", variant: "destructive" });
    }
  };

  return (
    <div className="flex justify-end gap-2 flex-wrap">
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
                <Input type="number" min="0" step="0.01" value={costStr} onChange={e => setCostStr(e.target.value)} placeholder="Ex: 85.50" />
              </div>
              <Button onClick={handleSaveCost} className="w-full">Salvar Custo</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        title="Excluir agendamento"
        disabled={deleteAppt.isPending}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
