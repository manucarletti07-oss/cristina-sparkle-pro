import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Endpoint llamado por pg_cron una vez al día. Recorre las citas pendientes
// que ocurren mañana y envía un recordatorio por WhatsApp via Twilio.
//
// Para activarlo:
//  1. Conectar el connector "Twilio" en Lovable.
//  2. Añadir el secreto TWILIO_WHATSAPP_FROM (ej: "whatsapp:+14155238886").
//  3. Programar pg_cron diariamente para llamar a esta ruta.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

function mensaje(profesional: string, hora: string, servicios: string[]) {
  const quien = profesional === "jessie" ? "Jessie" : "Cristina Cebrián";
  const serv = servicios.join(", ") || "tu tratamiento";
  return `Hola, soy ${quien}. Vengo a recordarte que mañana tienes tu cita a las ${hora} para ${serv}. Te esperamos.`;
}

function normalizarTelefono(t: string) {
  const clean = t.replace(/[^\d+]/g, "");
  if (clean.startsWith("+")) return clean;
  if (clean.startsWith("00")) return "+" + clean.slice(2);
  // Asumir España si llega sin prefijo
  if (clean.length === 9) return "+34" + clean;
  return "+" + clean;
}

export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async () => {
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
        const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

        if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_WHATSAPP_FROM) {
          return Response.json(
            {
              skipped: true,
              reason:
                "Twilio no está configurado. Conecta Twilio y añade el secreto TWILIO_WHATSAPP_FROM.",
            },
            { status: 200 }
          );
        }

        // Calcular fecha de mañana en YYYY-MM-DD
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const fechaIso = manana.toISOString().slice(0, 10);

        const { data, error } = await supabaseAdmin
          .from("citas")
          .select("*")
          .eq("fecha", fechaIso)
          .eq("estado", "pendiente")
          .eq("recordatorio_enviado", false);

        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        const results: { id: string; ok: boolean; error?: string }[] = [];

        for (const cita of data ?? []) {
          const to = `whatsapp:${normalizarTelefono(cita.telefono)}`;
          const body = mensaje(cita.profesional, cita.hora, cita.servicios);
          try {
            const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "X-Connection-Api-Key": TWILIO_API_KEY,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: to,
                From: TWILIO_WHATSAPP_FROM,
                Body: body,
              }),
            });
            if (!res.ok) {
              const txt = await res.text();
              results.push({ id: cita.id, ok: false, error: txt.slice(0, 200) });
              continue;
            }
            await supabaseAdmin
              .from("citas")
              .update({ recordatorio_enviado: true })
              .eq("id", cita.id);
            results.push({ id: cita.id, ok: true });
          } catch (e) {
            results.push({
              id: cita.id,
              ok: false,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }

        return Response.json({ fecha: fechaIso, enviados: results.length, results });
      },
    },
  },
});