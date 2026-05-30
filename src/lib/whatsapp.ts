import { toast } from "sonner";

type ReminderData = {
  telefono?: string | null;
  fecha: string;
  hora: string;
};

function cleanSpanishPhone(phone?: string | null) {
  let clean = (phone ?? "").replace(/[^\d]/g, "");
  if (clean.startsWith("00")) clean = clean.slice(2);
  return clean.length === 9 ? `34${clean}` : clean;
}

function formatSpanishDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function buildWhatsAppReminder({ telefono, fecha, hora }: ReminderData) {
  const phone = cleanSpanishPhone(telefono);
  const message = `Hola, desde Cristina Cebrián Estética le recordamos su cita el ${formatSpanishDate(fecha)} a las ${hora}. Le esperamos.`;
  const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "";

  return { phone, message, url };
}

export function openWhatsAppReminder(data: ReminderData) {
  const { phone, message, url } = buildWhatsAppReminder(data);

  if (!phone) {
    toast.error("Este cliente no tiene teléfono para WhatsApp");
    return;
  }

  navigator.clipboard?.writeText(message).catch(() => undefined);
  const redirectUrl = new URL("/whatsapp", window.location.origin);
  redirectUrl.searchParams.set("phone", phone);
  redirectUrl.searchParams.set("text", message);

  const popup = window.open("about:blank", "_blank");
  if (popup) {
    popup.opener = null;
    popup.location.href = redirectUrl.toString();
  } else {
    const link = document.createElement("a");
    link.href = redirectUrl.toString();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  toast.success("Abriendo WhatsApp", {
    description: "Si no aparece, usa la pestaña nueva. El mensaje ya está copiado.",
  });
}