const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const TOKEN = process.env.ZAPI_TOKEN;
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

function isConfigured(): boolean {
  return Boolean(INSTANCE_ID && TOKEN);
}

function baseUrl(): string {
  return `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}`;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (CLIENT_TOKEN) h["client-token"] = CLIENT_TOKEN;
  return h;
}

async function sendText(phone: string, message: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/send-text`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ phone, message }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Z-API send-text failed ${res.status}: ${body}`);
  }
}

async function sendImage(phone: string, image: string, caption?: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/send-image`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ phone, image, caption: caption ?? "" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Z-API send-image failed ${res.status}: ${body}`);
  }
}

export interface BookingNotificationData {
  tenantPhone: string;
  tenantName: string;
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
    console.log("[WhatsApp] Not configured — skipping notification (set ZAPI_INSTANCE_ID, ZAPI_TOKEN)");
    return;
  }

  const phone = data.tenantPhone.replace(/\D/g, "");

  const lines: string[] = [
    `✨ *Novo agendamento em ${data.tenantName}!*`,
    "",
    `👤 *Cliente:* ${data.clientName}`,
  ];

  if (data.clientAge) lines.push(`🎂 *Idade:* ${data.clientAge} anos`);
  if (data.clientPhone) lines.push(`📱 *WhatsApp:* ${data.clientPhone}`);

  lines.push(
    "",
    `✂️ *Serviço:* ${data.serviceName}`,
    `📏 *Tamanho:* ${braidSizeLabel(data.braidSize)}`,
    `💰 *Valor:* ${formatPrice(data.servicePrice)}`,
    `💳 *Pagamento:* ${paymentLabel(data.paymentMethod)}`,
    "",
    `📅 *Data:* ${formatDate(data.date)}`,
    `🕐 *Horário:* ${data.time}`
  );

  if (data.hairDescription) lines.push(``, `💇 *Cabelo:* ${data.hairDescription}`);
  if (data.notes) lines.push(`📝 *Obs:* ${data.notes}`);

  const photoCount = data.referencePhotos?.length ?? 0;
  if (photoCount > 0) {
    lines.push(``, `🖼️ ${photoCount} foto(s) de referência enviada(s) abaixo.`);
  }

  await sendText(phone, lines.join("\n"));

  if (data.referencePhotos && data.referencePhotos.length > 0) {
    for (let i = 0; i < data.referencePhotos.length; i++) {
      const photo = data.referencePhotos[i];
      if (!photo) continue;
      try {
        const imageData = photo.startsWith("data:") ? photo.split(",")[1] ?? photo : photo;
        await sendImage(phone, imageData, `Foto de referência ${i + 1} — ${data.clientName}`);
      } catch (err) {
        console.warn(`[WhatsApp] Failed to send photo ${i + 1}:`, err);
      }
    }
  }
}
