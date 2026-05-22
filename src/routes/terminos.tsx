import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos Legales · Cristina Cebrián" },
      { name: "description", content: "Aviso legal y política de privacidad de Cristina Cebrián Estética Avanzada." },
      { property: "og:title", content: "Términos Legales · Cristina Cebrián" },
      { property: "og:description", content: "Aviso legal y política de privacidad." },
    ],
  }),
  component: Terminos,
});

function Terminos() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground text-background py-24 text-center">
        <span className="text-[11px] tracking-[0.4em] text-primary font-semibold uppercase">Términos Legales</span>
        <h1 className="font-display text-5xl md:text-6xl mt-4 text-primary">Cristina Cebrián</h1>
        <div className="h-px w-20 bg-primary mx-auto mt-6" />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-20 prose-content">
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary hover:underline mb-10">
          <ArrowLeft className="size-3.5" /> Volver al inicio
        </Link>

        <h2 className="font-display text-3xl mb-6">Aviso Legal</h2>
        <p className="mb-6 text-foreground/80 leading-relaxed">
          La presente página web, <strong>Cristina Cebrián Estética Avanzada</strong>, con domicilio en Calle Venus, 15
          (Posterior), 28925 Alcorcón, Madrid, es propiedad de Cristina Cebrián. El acceso y uso de este sitio web
          implica la aceptación plena de los siguientes términos y condiciones legales.
        </p>

        {SECCIONES.map((s) => (
          <section key={s.titulo} className="mt-8">
            <h3 className="font-display text-xl text-primary mb-3">{s.titulo}</h3>
            <p className="text-foreground/80 leading-relaxed">{s.texto}</p>
          </section>
        ))}

        <p className="mt-10 italic text-muted-foreground text-sm">Última actualización: 04/03/2026</p>
      </main>

      <Footer />
    </div>
  );
}

const SECCIONES = [
  {
    titulo: "1. Propiedad Intelectual",
    texto:
      "Todos los contenidos presentes en este sitio web, incluyendo textos, imágenes, fotografías, logotipos, gráficos y diseño, están protegidos por la legislación vigente en materia de propiedad intelectual y son propiedad de Cristina Cebrián o de terceros que han autorizado su uso. Queda prohibida su reproducción, distribución o modificación sin autorización expresa.",
  },
  {
    titulo: "2. Uso del Sitio Web",
    texto:
      "El usuario se compromete a utilizar la web de manera responsable y conforme a la ley, absteniéndose de realizar actividades que puedan dañar, inutilizar o sobrecargar el sitio. Cristina Cebrián no se responsabiliza de los daños ocasionados por el uso indebido de la página o de sus servicios.",
  },
  {
    titulo: "3. Protección de Datos Personales",
    texto:
      "Los datos personales que el usuario proporcione al realizar reservas, solicitudes de información o contacto, serán tratados de manera confidencial, cumpliendo con el Reglamento (UE) 2016/679 de Protección de Datos (GDPR). Los datos se utilizarán únicamente para la gestión de citas y comunicación con el cliente.",
  },
  {
    titulo: "4. Responsabilidad",
    texto:
      "Cristina Cebrián no se hace responsable de los daños o perjuicios derivados del acceso o uso de la información contenida en esta web. La empresa tampoco garantiza la disponibilidad continua del sitio web, pudiendo interrumpir el servicio por mantenimiento o causas técnicas ajenas a su control.",
  },
  {
    titulo: "5. Enlaces a Terceros",
    texto:
      "El sitio puede contener enlaces a páginas de terceros. Cristina Cebrián no se responsabiliza de los contenidos, políticas de privacidad o prácticas de estos sitios externos.",
  },
  {
    titulo: "6. Modificaciones",
    texto:
      "Los presentes términos legales pueden ser modificados en cualquier momento. Se recomienda a los usuarios revisarlos periódicamente para estar informados de posibles cambios.",
  },
  {
    titulo: "7. Legislación y Jurisdicción",
    texto:
      "Estos términos se rigen por la legislación española. Cualquier controversia será sometida a los juzgados y tribunales competentes de Madrid, salvo que la ley aplicable disponga otra cosa.",
  },
];