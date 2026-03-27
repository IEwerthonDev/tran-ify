const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

function isConfigured(): boolean {
  return Boolean(ZAPI_INSTANCE_ID && ZAPI_TOKEN);
}

async function sendZApi(phone: string, message: string): Promise<void> {
  const clean = phone.replace(/\D/g, "");
  const phoneWithCountry = clean.startsWith("55") ? clean : `55${clean}`;

  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (ZAPI_CLIENT_TOKEN) {
    headers["Client-Token"] = ZAPI_CLIENT_TOKEN;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ phone: phoneWithCountry, message }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Z-API error (${res.status}): ${body.slice(0, 200)}`);
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
  tenantPhone?: string | null;
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
    console.log("[WhatsApp] ZAPI_INSTANCE_ID ou ZAPI_TOKEN não configurados — notificação ignorada.");
    return;
  }

  const targetPhone = data.tenantPhone || process.env.ZAPI_DEFAULT_PHONE;
  if (!targetPhone) {
    console.log("[WhatsApp] Nenhum número de destino configurado — notificação ignorada.");
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
    lines.push(``, `🖼️ ${photoCount} foto(s) de referência enviadas pelo sistema.`);
  }

  await sendZApi(targetPhone, lines.join("\n"));
}
