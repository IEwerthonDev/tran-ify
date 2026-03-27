const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY;
const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE;

function isConfigured(): boolean {
  return Boolean(CALLMEBOT_APIKEY && CALLMEBOT_PHONE);
}

async function sendCallMeBot(phone: string, message: string): Promise<void> {
  const encoded = encodeURIComponent(message);
  const clean = phone.replace(/\D/g, "");
  const url = `https://api.callmebot.com/whatsapp.php?phone=${clean}&text=${encoded}&apikey=${CALLMEBOT_APIKEY}`;
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok || body.toLowerCase().includes("error")) {
    throw new Error(`CallMeBot error (${res.status}): ${body.slice(0, 200)}`);
  }
}

export interface BookingNotificationData {
  clientName: string;
  clientPhone?: string | null;
  clientAge?: number | null;
  serviceName: string;
  braidSize: string;
  servicePrice: number;
  paymentMethod: string;
  date: string;
  time: string;
  hairDescription?: string | null;
  referencePhotos?: string[];
  notes?: string | null;
  tenantName: string;
}

function braidSizeLabel(s: string): string {
  return s === "mid_back" ? "Até o meio das costas" : "Até a cintura/bumbum";
}

function paymentLabel(p: string): string {
  const map: Record<string, string> = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };
  return map[p] ?? p;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export async function sendBookingNotification(data: BookingNotificationData): Promise<void> {
  if (!isConfigured()) {
    console.log("[WhatsApp] CALLMEBOT_PHONE ou CALLMEBOT_APIKEY não configurados — notificação ignorada.");
    return;
  }

  const lines: string[] = [
    `✨ Novo agendamento em ${data.tenantName}!`,
    ``,
    `👤 Cliente: ${data.clientName}`,
  ];

  if (data.clientAge) lines.push(`🎂 Idade: ${data.clientAge} anos`);
  if (data.clientPhone) lines.push(`📱 WhatsApp: ${data.clientPhone}`);

  lines.push(
    ``,
    `✂️ Serviço: ${data.serviceName}`,
    `📏 Tamanho: ${braidSizeLabel(data.braidSize)}`,
    `💰 Valor: ${formatPrice(data.servicePrice)}`,
    `💳 Pagamento: ${paymentLabel(data.paymentMethod)}`,
    ``,
    `📅 Data: ${formatDate(data.date)}`,
    `🕐 Horário: ${data.time}`
  );

  if (data.hairDescription) lines.push(``, `💇 Cabelo: ${data.hairDescription}`);
  if (data.notes) lines.push(`📝 Obs: ${data.notes}`);

  const photoCount = data.referencePhotos?.length ?? 0;
  if (photoCount > 0) {
    lines.push(``, `🖼️ ${photoCount} foto(s) de referência foram enviadas pelo sistema.`);
  }

  await sendCallMeBot(CALLMEBOT_PHONE!, lines.join("\n"));
}
