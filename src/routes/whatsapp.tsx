import { useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/whatsapp")({
  head: () => ({
    meta: [
      { title: "Abrir WhatsApp · Cristina Cebrián" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: WhatsAppRedirect,
});

function cleanPhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

function WhatsAppRedirect() {
  const whatsapp = useMemo(() => {
    if (typeof window === "undefined") return { phone: "", text: "", url: "" };

    const params = new URLSearchParams(window.location.search);
    const phone = cleanPhone(params.get("phone") ?? "");
    const text = params.get("text") ?? "";
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : "";

    return { phone, text, url };
  }, []);

  useEffect(() => {
    if (!whatsapp.url) return;

    const timer = window.setTimeout(() => {
      window.location.replace(whatsapp.url);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [whatsapp.url]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg shadow-whatsapp/25">
          <MessageCircle className="size-8" />
        </div>
        <h1 className="font-display text-3xl">Abriendo WhatsApp</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Si WhatsApp no se abre automáticamente, pulsa el botón de abajo.
        </p>
        {whatsapp.url ? (
          <Button asChild className="mt-6 rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg shadow-whatsapp/20 hover:bg-whatsapp/90">
            <a href={whatsapp.url} rel="noopener noreferrer">
              <MessageCircle className="size-4" /> Abrir WhatsApp
            </a>
          </Button>
        ) : (
          <p className="mt-6 text-sm text-destructive">Falta el teléfono del cliente.</p>
        )}
        <div className="mt-6">
          <Link to="/admin" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <ArrowLeft className="size-4" /> Volver al panel
          </Link>
        </div>
      </section>
    </main>
  );
}