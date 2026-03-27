import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetMyAvailability, useUpdateAvailability } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, isToday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export default function DisponibilidadePage() {
  const { data: availability, isLoading } = useGetMyAvailability();
  const updateMutation = useUpdateAvailability();
  const { toast } = useToast();

  const now = new Date();
  const currentMonthStart = startOfMonth(now);

  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [timeSettings, setTimeSettings] = useState({
    startTime: "08:00",
    endTime: "17:00",
    slotIntervalMinutes: 60,
    breakAfterMinutes: 30,
    maxAppointmentsPerDay: 2,
  });

  useEffect(() => {
    if (availability) {
      const dates = (availability as any).availableDates as string[] | undefined;
      setSelectedDates(dates ?? []);
      setTimeSettings({
        startTime: availability.startTime,
        endTime: availability.endTime,
        slotIntervalMinutes: availability.slotIntervalMinutes,
        breakAfterMinutes: availability.breakAfterMinutes,
        maxAppointmentsPerDay: availability.maxAppointmentsPerDay,
      });
    }
  }, [availability]);

  const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: endOfMonth(now) });
  const firstDayOfWeek = getDay(currentMonthStart);
  const today = startOfDay(now);

  const toggleDate = (dateStr: string, dayDate: Date) => {
    if (isBefore(startOfDay(dayDate), today)) return;
    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        data: {
          ...timeSettings,
          availableDates: selectedDates,
        } as any,
      });
      toast({ title: "Disponibilidade salva!", description: `${selectedDates.length} dia(s) disponíveis este mês.` });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const monthLabel = format(now, "MMMM 'de' yyyy", { locale: ptBR });
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-card rounded-2xl w-64" />
          <div className="h-96 bg-card rounded-3xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-foreground">Disponibilidade</h1>
        <p className="text-muted-foreground mt-2 text-lg">Selecione os dias que você atende este mês.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">

          {/* Calendar Card */}
          <div className="bg-card rounded-[2rem] border border-border/50 shadow-xl shadow-black/5 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border/50">
              <h2 className="text-2xl font-display font-bold">{capitalizedMonth}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/60 px-4 py-2 rounded-xl">
                <div className="w-3 h-3 rounded-sm" style={{ background: "#7D2535" }} />
                <span>{selectedDates.length} dia{selectedDates.length !== 1 ? "s" : ""} selecionado{selectedDates.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 px-4 pt-4">
              {WEEK_DAYS.map(d => (
                <div key={d} className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 p-4">
              {/* Empty cells for days before the 1st */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {daysInMonth.map(day => {
                const dateStr = toDateStr(day);
                const isPast = isBefore(startOfDay(day), today);
                const isSelected = selectedDates.includes(dateStr);
                const isTodayDay = isToday(day);

                return (
                  <button
                    key={dateStr}
                    onClick={() => toggleDate(dateStr, day)}
                    disabled={isPast}
                    className={`
                      relative aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-150
                      ${isPast
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : isSelected
                          ? "text-white shadow-lg scale-105 hover:opacity-90"
                          : isTodayDay
                            ? "ring-2 ring-primary text-foreground hover:bg-primary/10"
                            : "text-foreground hover:bg-secondary cursor-pointer"
                      }
                    `}
                    style={isSelected ? { background: "#7D2535" } : undefined}
                  >
                    {format(day, "d")}
                    {isTodayDay && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="px-8 pb-6 flex items-center gap-4 text-sm text-muted-foreground border-t border-border/40 pt-4">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-sm inline-block" style={{ background: "#7D2535" }} />
                Dias selecionados
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-sm bg-secondary inline-block" />
                Disponíveis
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-sm bg-muted-foreground/20 inline-block" />
                Passados
              </span>
            </div>
          </div>

          {/* Time Settings */}
          <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-accent/20 rounded-xl text-accent-foreground">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-bold">Horários de Atendimento</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-sm font-semibold mb-2 block">Hora de Início</label>
                <Input
                  type="time"
                  value={timeSettings.startTime}
                  onChange={e => setTimeSettings({ ...timeSettings, startTime: e.target.value })}
                  className="h-14 text-xl font-bold"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Hora de Fim</label>
                <Input
                  type="time"
                  value={timeSettings.endTime}
                  onChange={e => setTimeSettings({ ...timeSettings, endTime: e.target.value })}
                  className="h-14 text-xl font-bold"
                />
              </div>

              <div className="md:col-span-2 pt-6 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-semibold mb-2 block text-muted-foreground">Intervalo entre slots (min)</label>
                  <Input
                    type="number"
                    min={30}
                    max={240}
                    value={timeSettings.slotIntervalMinutes}
                    onChange={e => setTimeSettings({ ...timeSettings, slotIntervalMinutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block text-muted-foreground">Pausa após trança (min)</label>
                  <Input
                    type="number"
                    min={0}
                    max={180}
                    value={timeSettings.breakAfterMinutes}
                    onChange={e => setTimeSettings({ ...timeSettings, breakAfterMinutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block text-muted-foreground">Máx. clientes/dia</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={timeSettings.maxAppointmentsPerDay}
                    onChange={e => setTimeSettings({ ...timeSettings, maxAppointmentsPerDay: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto px-12 h-16 text-lg rounded-2xl"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            <Save className="w-5 h-5 mr-2" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Disponibilidade"}
          </Button>
        </div>

        {/* Info Box */}
        <div className="space-y-6">
          <div className="bg-secondary/50 rounded-[2rem] p-8 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-display font-bold">Como funciona?</h3>
            </div>
            <ul className="space-y-4 text-muted-foreground text-sm">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                <p>Clique nos dias do mês atual que você vai atender. Os dias ficam em vinho quando selecionados.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                <p>Apenas os dias deste mês podem ser configurados. No próximo mês, você seleciona novamente.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                <p>Os horários de atendimento e o intervalo entre clientes definem os slots disponíveis em cada dia.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</div>
                <p>Clique em um dia selecionado para desmarcá-lo e remover a disponibilidade.</p>
              </li>
            </ul>
          </div>

          {selectedDates.length > 0 && (
            <div className="bg-card rounded-[2rem] p-6 border border-border/50">
              <h3 className="font-bold text-base mb-3 text-foreground">Dias selecionados</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDates
                  .slice()
                  .sort()
                  .map(d => {
                    const [, , day] = d.split("-");
                    return (
                      <span key={d} className="text-xs font-bold text-white px-2.5 py-1 rounded-lg" style={{ background: "#7D2535" }}>
                        {parseInt(day, 10)}
                      </span>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
