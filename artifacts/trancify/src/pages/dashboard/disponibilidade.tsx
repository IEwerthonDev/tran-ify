import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetMyAvailability, useUpdateAvailability } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar as CalendarIcon, Save } from "lucide-react";

const DAYS = [
  { id: 0, name: "Domingo" },
  { id: 1, name: "Segunda" },
  { id: 2, name: "Terça" },
  { id: 3, name: "Quarta" },
  { id: 4, name: "Quinta" },
  { id: 5, name: "Sexta" },
  { id: 6, name: "Sábado" },
];

export default function DisponibilidadePage() {
  const { data: availability, isLoading } = useGetMyAvailability();
  const updateMutation = useUpdateAvailability();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    availableDays: [1,2,3,4,5],
    startTime: "08:00",
    endTime: "18:00",
    slotIntervalMinutes: 60,
    breakAfterMinutes: 30,
    maxAppointmentsPerDay: 4,
  });

  useEffect(() => {
    if (availability) {
      setFormData({
        availableDays: availability.availableDays || [],
        startTime: availability.startTime,
        endTime: availability.endTime,
        slotIntervalMinutes: availability.slotIntervalMinutes,
        breakAfterMinutes: availability.breakAfterMinutes,
        maxAppointmentsPerDay: availability.maxAppointmentsPerDay,
      });
    }
  }, [availability]);

  const handleDayToggle = (dayId: number) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(dayId)
        ? prev.availableDays.filter(d => d !== dayId)
        : [...prev.availableDays, dayId]
    }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ data: formData });
      toast({ title: "Disponibilidade salva com sucesso!" });
    } catch (e) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-96 bg-card rounded-3xl"></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-foreground">Horários e Disponibilidade</h1>
        <p className="text-muted-foreground mt-2 text-lg">Configure quando seus clientes podem agendar.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          
          {/* Days */}
          <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl text-primary"><CalendarIcon className="w-6 h-6"/></div>
              <h2 className="text-2xl font-display font-bold">Dias de Atendimento</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {DAYS.map(day => {
                const isActive = formData.availableDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    onClick={() => handleDayToggle(day.id)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 border-2 ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}
                  >
                    {day.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Times */}
          <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-accent/20 rounded-xl text-accent-foreground"><Clock className="w-6 h-6"/></div>
              <h2 className="text-2xl font-display font-bold">Horários</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-sm font-semibold mb-2 block">Hora de Início</label>
                <Input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="h-14 text-xl font-bold" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Hora de Fim</label>
                <Input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="h-14 text-xl font-bold" />
              </div>
              
              <div className="md:col-span-2 pt-6 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-semibold mb-2 block text-muted-foreground">Intervalo (min)</label>
                  <Input type="number" value={formData.slotIntervalMinutes} onChange={e => setFormData({...formData, slotIntervalMinutes: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block text-muted-foreground">Pausa após trança (min)</label>
                  <Input type="number" value={formData.breakAfterMinutes} onChange={e => setFormData({...formData, breakAfterMinutes: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block text-muted-foreground">Máx. Clientes/Dia</label>
                  <Input type="number" value={formData.maxAppointmentsPerDay} onChange={e => setFormData({...formData, maxAppointmentsPerDay: Number(e.target.value)})} />
                </div>
              </div>
            </div>
          </div>
          
          <Button size="lg" className="w-full sm:w-auto px-12 h-16 text-lg rounded-2xl" onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-5 h-5 mr-2" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Disponibilidade"}
          </Button>

        </div>

        {/* Info Box */}
        <div className="bg-secondary/50 rounded-[2rem] p-8 border border-border">
          <h3 className="text-xl font-display font-bold mb-4">Como funciona?</h3>
          <ul className="space-y-4 text-muted-foreground">
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">1</div>
              <p>O sistema criará horários com base na duração do serviço escolhido pela cliente.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">2</div>
              <p>A "Pausa após trança" é essencial para limpar o salão e descansar as mãos.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">3</div>
              <p>O limite de clientes por dia evita que você tenha overbooking automático.</p>
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
