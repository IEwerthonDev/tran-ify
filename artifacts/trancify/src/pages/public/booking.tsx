import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useGetPublicTenant, useGetPublicServices, useGetPublicAvailability, useBookAppointment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Calendar, Clock, User, CheckCircle, ChevronRight, ArrowLeft, ImagePlus, X } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE_MB = 5;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PublicBookingPage() {
  const { slug } = useParams();
  const { toast } = useToast();
  const { data: tenant, isLoading: loadTenant, error: tenantErr } = useGetPublicTenant(slug || "");
  const { data: services } = useGetPublicServices(tenant?.id || "", { query: { enabled: !!tenant?.id } });
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [braidSize, setBraidSize] = useState<"mid_back" | "waist_butt">("mid_back");
  const [selectedDate, setSelectedDate] = useState<string>(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [referencePhotos, setReferencePhotos] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [clientData, setClientData] = useState({
    name: "",
    phone: "",
    age: "",
    hairDesc: "",
    payment: "pix" as "pix" | "card" | "cash"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: availability, isLoading: loadAvail } = useGetPublicAvailability(
    tenant?.id || "", 
    { date: selectedDate, serviceId: selectedService?.id },
    { query: { enabled: step === 3 && !!tenant?.id && !!selectedService } }
  );

  const bookMutation = useBookAppointment();
  const [isSuccess, setIsSuccess] = useState(false);

  if (loadTenant) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse w-16 h-16 bg-primary rounded-2xl" /></div>;
  if (tenantErr || !tenant) return <div className="min-h-screen flex items-center justify-center text-xl">Salão não encontrado.</div>;

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - referencePhotos.length;
    const toProcess = files.slice(0, remaining);

    for (const file of toProcess) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: `Máximo ${MAX_FILE_SIZE_MB}MB por foto.`, variant: "destructive" });
        continue;
      }
      const base64 = await fileToBase64(file);
      setReferencePhotos(prev => [...prev, base64]);
      setPhotoPreviews(prev => [...prev, base64]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePhotoRemove = (index: number) => {
    setReferencePhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateClientData = () => {
    const newErrors: Record<string, string> = {};
    const nameTrimmed = clientData.name.trim();
    if (!nameTrimmed) {
      newErrors.name = "Nome é obrigatório";
    } else if (nameTrimmed.length < 2) {
      newErrors.name = "Nome deve ter pelo menos 2 caracteres";
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(nameTrimmed)) {
      newErrors.name = "Nome deve conter apenas letras";
    }

    const phoneDigits = clientData.phone.replace(/\D/g, "");
    if (!clientData.phone) {
      newErrors.phone = "WhatsApp é obrigatório";
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      newErrors.phone = "Informe um número válido com DDD (ex: 11 99999-0000)";
    }

    if (clientData.age) {
      const ageNum = Number(clientData.age);
      if (isNaN(ageNum) || !Number.isInteger(ageNum)) {
        newErrors.age = "Idade deve ser um número inteiro";
      } else if (ageNum < 13 || ageNum > 90) {
        newErrors.age = "Idade deve ser entre 13 e 90 anos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBook = async () => {
    if (!validateClientData()) return;
    try {
      await bookMutation.mutateAsync({
        data: {
          tenantId: tenant.id,
          serviceId: selectedService.id,
          clientName: clientData.name,
          clientPhone: clientData.phone,
          clientAge: Number(clientData.age) || undefined,
          hairDescription: clientData.hairDesc || undefined,
          referencePhotos,
          paymentMethod: clientData.payment,
          braidSize,
          date: selectedDate,
          time: selectedTime
        }
      });
      setIsSuccess(true);
    } catch {
      toast({ title: "Erro ao agendar", description: "Por favor, tente novamente.", variant: "destructive" });
    }
  };

  const getPrice = () => selectedService ? (braidSize === 'mid_back' ? selectedService.priceSmall : selectedService.priceLarge) : 0;

  if (isSuccess) {
    const wppText = encodeURIComponent(`Olá ${tenant.name}! Acabei de agendar uma trança pelo sistema. Meu nome é ${clientData.name}.`);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-emerald-500/20">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground mb-4">Agendamento Solicitado!</h1>
        <p className="text-lg text-muted-foreground max-w-md mb-8">
          Seu horário para <strong>{format(new Date(selectedDate + "T12:00:00"), "dd/MM/yyyy")} às {selectedTime}</strong> foi reservado. 
          O salão precisa confirmar para validar o agendamento.
        </p>
        {tenant.whatsapp && (
          <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g,'')}?text=${wppText}`} target="_blank" rel="noreferrer" 
             className="bg-[#25D366] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#1EBE5D] transition-all shadow-lg shadow-[#25D366]/30 flex items-center gap-3">
            Avisar no WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border/50 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-20 flex items-center gap-4">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-secondary rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
          )}
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" alt="Logo" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">{tenant.name.charAt(0)}</div>
          )}
          <div>
            <h1 className="text-xl font-bold font-display leading-tight">{tenant.name}</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Agendamento Online</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-secondary w-full">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${(step/4)*100}%` }} />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <AnimatePresence mode="wait">

          {/* STEP 1 — Choose Service */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-display font-bold mb-6">1. Qual serviço você deseja?</h2>
              <div className="space-y-4">
                {services?.filter(s => s.active).map(service => (
                  <div 
                    key={service.id} 
                    onClick={() => { setSelectedService(service); setStep(2); }}
                    className="bg-card p-6 rounded-3xl border-2 border-border/50 hover:border-primary cursor-pointer transition-all shadow-md hover:shadow-xl group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{service.name}</h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{service.description}</p>
                        <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-md">
                          Duração: ~{service.durationHours}h
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">A partir de</span>
                        <span className="text-xl font-bold text-foreground">{formatCurrency(service.priceSmall)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Choose Size */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-display font-bold mb-2">2. Qual o tamanho?</h2>
              <p className="text-muted-foreground mb-8 text-lg">O tamanho influencia no valor e tempo do serviço.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => setBraidSize('mid_back')}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${braidSize === 'mid_back' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border bg-card hover:border-primary/50'}`}
                >
                  <h3 className="text-xl font-bold mb-2">Até o meio das costas</h3>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(selectedService?.priceSmall)}</p>
                </button>
                <button 
                  onClick={() => setBraidSize('waist_butt')}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${braidSize === 'waist_butt' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border bg-card hover:border-primary/50'}`}
                >
                  <h3 className="text-xl font-bold mb-2">Até a cintura / Bumbum</h3>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(selectedService?.priceLarge)}</p>
                </button>
              </div>

              <div className="mt-12 flex justify-end">
                <Button size="lg" className="rounded-full px-8 text-lg" onClick={() => setStep(3)}>
                  Avançar <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Choose Date & Time */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-display font-bold mb-6">3. Escolha Data e Hora</h2>
              
              <div className="bg-card p-6 rounded-3xl border border-border mb-8">
                <label className="text-sm font-bold text-foreground mb-2 block uppercase tracking-wider">Data Desejada</label>
                <Input 
                  type="date" 
                  value={selectedDate} 
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                  className="h-14 text-lg bg-background"
                />
              </div>

              <h3 className="font-bold text-lg mb-4">Horários Disponíveis</h3>
              {loadAvail ? (
                <div className="animate-pulse flex gap-3"><div className="w-24 h-12 bg-secondary rounded-xl"/><div className="w-24 h-12 bg-secondary rounded-xl"/></div>
              ) : availability?.slots?.length === 0 ? (
                <div className="p-8 text-center bg-destructive/10 text-destructive rounded-2xl font-bold">
                  Nenhum horário disponível para esta data.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {availability?.slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`h-12 rounded-xl font-bold transition-all border-2 ${selectedTime === slot ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-105' : 'bg-card border-border hover:border-primary/50'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-12 flex justify-end">
                <Button size="lg" className="rounded-full px-8 text-lg" disabled={!selectedTime} onClick={() => setStep(4)}>
                  Continuar <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4 — Client Data & Photos */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-display font-bold mb-2">4. Seus Dados</h2>
              <p className="text-muted-foreground mb-8 text-lg">Último passo para garantir seu horário.</p>

              <div className="bg-card p-6 sm:p-8 rounded-[2rem] border border-border shadow-xl space-y-6">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Nome Completo <span className="text-destructive">*</span></label>
                  <Input
                    value={clientData.name}
                    onChange={e => { setClientData({...clientData, name: e.target.value}); if (errors.name) setErrors(p => ({...p, name: ""})); }}
                    placeholder="Maria Silva"
                    className={errors.name ? "border-destructive focus:ring-destructive/20" : ""}
                  />
                  {errors.name && <p className="text-destructive text-xs mt-1 font-medium">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">WhatsApp <span className="text-destructive">*</span></label>
                    <Input
                      value={clientData.phone}
                      onChange={e => { setClientData({...clientData, phone: e.target.value}); if (errors.phone) setErrors(p => ({...p, phone: ""})); }}
                      placeholder="(11) 90000-0000"
                      className={errors.phone ? "border-destructive focus:ring-destructive/20" : ""}
                    />
                    {errors.phone && <p className="text-destructive text-xs mt-1 font-medium">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Idade <span className="text-muted-foreground font-normal">(Opcional)</span></label>
                    <Input
                      type="number"
                      value={clientData.age}
                      onChange={e => { setClientData({...clientData, age: e.target.value}); if (errors.age) setErrors(p => ({...p, age: ""})); }}
                      placeholder="25"
                      min={13}
                      max={90}
                      className={errors.age ? "border-destructive focus:ring-destructive/20" : ""}
                    />
                    {errors.age && <p className="text-destructive text-xs mt-1 font-medium">{errors.age}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Condição do seu cabelo <span className="text-muted-foreground font-normal">(Opcional)</span></label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-2 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none" 
                    value={clientData.hairDesc} 
                    onChange={e => setClientData({...clientData, hairDesc: e.target.value})} 
                    placeholder="Tem química, está curto, transição..." 
                  />
                </div>

                {/* ── Reference Photos ── */}
                <div>
                  <label className="text-sm font-semibold mb-1 block flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Fotos de Referência <span className="text-muted-foreground font-normal">(até {MAX_PHOTOS} fotos)</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Envie fotos do estilo de trança que você deseja. Isso ajuda a trancista a se preparar para o seu atendimento.
                  </p>

                  <div className="flex gap-3 flex-wrap">
                    {photoPreviews.map((src, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md group">
                        <img src={src} alt={`Referência ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handlePhotoRemove(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remover foto"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {idx + 1}
                        </div>
                      </div>
                    ))}

                    {referencePhotos.length < MAX_PHOTOS && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-secondary/40 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all group"
                      >
                        <ImagePlus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                          {photoPreviews.length === 0 ? "Adicionar" : "Mais"}
                        </span>
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handlePhotoAdd}
                  />

                  {referencePhotos.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {referencePhotos.length} de {MAX_PHOTOS} foto{referencePhotos.length > 1 ? "s" : ""} adicionada{referencePhotos.length > 1 ? "s" : ""}.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Forma de Pagamento no dia</label>
                  <div className="flex gap-3">
                    {(['pix', 'card', 'cash'] as const).map(method => (
                      <button key={method} onClick={() => setClientData({...clientData, payment: method})} className={`flex-1 py-3 rounded-xl border-2 font-bold uppercase text-sm transition-all ${clientData.payment === method ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-primary/30'}`}>
                        {method === 'pix' ? 'Pix' : method === 'card' ? 'Cartão' : 'Dinheiro'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-8 bg-secondary/50 rounded-3xl p-6 border border-border">
                <h3 className="font-bold text-lg mb-4">Resumo do Agendamento</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Serviço:</span> <span className="font-bold">{selectedService.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tamanho:</span> <span className="font-bold">{braidSize === 'mid_back' ? 'Costas' : 'Cintura'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Data/Hora:</span> <span className="font-bold text-primary">{format(new Date(selectedDate + "T12:00:00"), "dd/MM")} às {selectedTime}</span></div>
                  {referencePhotos.length > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Fotos de referência:</span> <span className="font-bold">{referencePhotos.length} foto{referencePhotos.length > 1 ? "s" : ""}</span></div>
                  )}
                  <div className="pt-4 mt-4 border-t border-border flex justify-between items-center">
                    <span className="text-lg font-bold">Total estimado:</span>
                    <span className="text-2xl font-display font-bold text-primary">{formatCurrency(getPrice())}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <Button size="lg" className="w-full h-16 text-xl rounded-2xl shadow-xl shadow-primary/30" onClick={handleBook} disabled={bookMutation.isPending}>
                  {bookMutation.isPending ? "Agendando..." : "Confirmar Agendamento"}
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
