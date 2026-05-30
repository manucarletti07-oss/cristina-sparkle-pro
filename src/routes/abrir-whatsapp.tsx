import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/abrir-whatsapp")({
  head: () => ({
    meta: [
      { title: "Abriendo WhatsApp" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AbrirWhatsApp,
});

function AbrirWhatsApp() {
  return (
    <main className="min-h-screen bg-background text-foreground grid place-items-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-display text-3xl">Abriendo WhatsApp…</h1>
        <p className="text-muted-foreground">Si no se abre automáticamente, pulse el botón verde.</p>
        <a
          id="whatsapp-link"
          className="inline-flex items-center justify-center rounded-full bg-whatsapp px-6 py-3 font-semibold text-whatsapp-foreground shadow-lg shadow-whatsapp/20"
          href="#"
        >
          Abrir WhatsApp Web
        </a>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const params = new URLSearchParams(window.location.search);
            const phone = params.get('phone') || '';
            const text = params.get('text') || '';
            const target = 'https://web.whatsapp.com/send?phone=' + encodeURIComponent(phone) + '&text=' + encodeURIComponent(text);
            const link = document.getElementById('whatsapp-link');
            if (link) link.href = target;
            if (phone) window.location.replace(target);
          `,
        }}
      />
    </main>
  );
}