import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Award, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookingModal } from "@/components/BookingModal";
import { ServiceInfoModal } from "@/components/ServiceInfoModal";
import { BuyBonoModal } from "@/components/BuyBonoModal";
import { Button } from "@/components/ui/button";
import { SERVICIOS, type ServiceCategory, type Treatment } from "@/lib/config";
import { getBonosCatalogo, type BonoCatalogo } from "@/lib/storage";
import heroImg from "@/assets/momento.jpg";
import facialImg from "@/assets/facial-trabajo.jpg";
import corporalImg from "@/assets/cabina.jpg";
import miradaImg from "@/assets/tratamiento-facial.jpg";
import cristinaImg from "@/assets/cristina.jpg";
import equipoImg from "@/assets/equipo.jpg";
import fachadaImg from "@/assets/fachada.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cristina Cebrián · Estética Avanzada en Alcorcón" },
      {
        name: "description",
        content:
          "Tratamientos faciales, corporales y de mirada en Alcorcón. Reserva tu cita previa online con Cristina Cebrián.",
      },
      { property: "og:title", content: "Cristina Cebrián · Estética Avanzada" },
      { property: "og:description", content: "Cuidamos tu esencia, resaltamos tu belleza." },
    ],
  }),
  component: Index,
});

const SERVICE_CARDS: { key: ServiceCategory; img: string; phrase: string }[] = [
  { key: "facial", img: facialImg, phrase: "Realza tu belleza natural. Un rostro radiante empieza aquí." },
  { key: "corporal", img: corporalImg, phrase: "Redefine tu cuerpo: tratamientos corporales que transforman." },
  { key: "mirada", img: miradaImg, phrase: "Mirada y manos: detalles que marcan la diferencia." },
];


function Index() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoCategory, setInfoCategory] = useState<ServiceCategory | null>(null);
  const [preselected, setPreselected] = useState<(Treatment & { categoria: ServiceCategory }) | null>(null);
  const [buyBonoOpen, setBuyBonoOpen] = useState(false);
  const [bonoPrincipal, setBonoPrincipal] = useState<BonoCatalogo | null>(null);

  useEffect(() => {
    getBonosCatalogo().then((bonos) => setBonoPrincipal(bonos[0] ?? null));
  }, []);

  const openInfo = (c: ServiceCategory) => {
    setInfoCategory(c);
    setInfoOpen(true);
  };

  const openGeneric = () => {
    setPreselected(null);
    setBookingOpen(true);
  };

  const openBookingFor = (t: Treatment & { categoria: ServiceCategory }) => {
    setPreselected(t);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookClick={openGeneric} />

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src={heroImg}
          alt="Cristina Cebrián Estética Avanzada"
          width={1920}
          height={1280}
          className="absolute inset-0 size-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/30 to-background/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

        <div className="relative z-10 max-w-3xl text-center px-6 animate-fade-up">
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.4em] text-primary font-semibold uppercase">
            <Sparkles className="size-3.5" /> Estética Avanzada · Alcorcón
          </span>
          <h1 className="font-display text-6xl md:text-8xl text-foreground mt-6 leading-[0.95] text-balance">
            Cristina
            <span className="block italic text-primary">Cebrián</span>
          </h1>
          <div className="h-px w-20 bg-primary mx-auto my-8" />
          <p className="font-display italic text-xl md:text-2xl text-foreground/85 max-w-xl mx-auto">
            Cuidamos tu esencia, resaltamos tu belleza.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <a href="#servicios">
              <Button className="h-12 px-8 bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.25em] rounded-full gold-pulse">
                Ver Tratamientos <ArrowRight className="size-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-28 bg-secondary">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] tracking-[0.4em] text-primary font-semibold uppercase">Nuestros servicios</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-foreground">Tratamientos a medida</h2>
            <div className="h-px w-12 bg-primary mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {SERVICE_CARDS.map((s) => (
              <button
                key={s.key}
                onClick={() => openInfo(s.key)}
                className="group text-left transition-transform duration-500 hover:-translate-y-2"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl gold-shadow">
                  <img
                    src={s.img}
                    alt={SERVICIOS[s.key].titulo}
                    width={800}
                    height={1024}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-background">
                    <h3 className="font-display text-3xl">{SERVICIOS[s.key].titulo}</h3>
                    <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Más información <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>
                <p className="mt-5 italic font-display text-foreground/75 text-base">{s.phrase}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PROMOCIONES */}
      <section id="promociones" className="py-28 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] tracking-[0.4em] text-primary font-semibold uppercase">Bonos exclusivos</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-foreground">Promociones y Bonos</h2>
            <div className="h-px w-12 bg-primary mx-auto mt-6" />
          </div>

          <div className="max-w-md mx-auto">
            <div className="relative bg-secondary border border-primary/15 rounded-3xl p-10 text-center transition-all duration-500 hover:border-primary hover:-translate-y-2 hover:gold-shadow">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-[10px] uppercase tracking-[0.25em] font-semibold">
                Más vendido
              </span>
              <h3 className="font-display text-3xl text-foreground">{bonoPrincipal?.nombre ?? "Bono de 10 sesiones"}</h3>
              <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto">
                Reserva cualquier tratamiento y aplica una sesión del bono al pagar. Se descuenta automáticamente.
              </p>
              <div className="my-7">
                <span className="font-display text-6xl text-foreground">{bonoPrincipal?.precio ?? 150}€</span>
              </div>
              <ul className="text-sm text-foreground/75 mb-7 space-y-1">
                <li>{bonoPrincipal?.sesiones ?? 10} sesiones a tu nombre</li>
                <li>Válido para cualquier tratamiento</li>
                <li>Vinculado a tu teléfono</li>
              </ul>
              <Button
                onClick={() => setBuyBonoOpen(true)}
                className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.25em] rounded-full px-8"
              >
                Comprar bono
              </Button>
            </div>
          </div>
        </div>
      </section>



      {/* SOBRE */}
      <section id="sobre" className="py-28 bg-secondary">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img
              src={cristinaImg}
              alt="Cristina Cebrián en su centro de estética avanzada"
              width={900}
              height={1200}
              className="rounded-3xl gold-shadow object-cover aspect-[3/4] w-full"
              loading="lazy"
            />
            <div className="absolute -bottom-6 -right-4 md:-right-8 bg-background border border-primary/25 rounded-2xl px-5 py-4 shadow-xl flex items-center gap-3">
              <Award className="size-5 text-primary" />
              <div className="text-left leading-tight">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Comercio</p>
                <p className="font-display text-sm text-foreground">Recomendado en Alcorcón</p>
              </div>
            </div>
          </div>
          <div>
            <span className="text-[11px] tracking-[0.4em] text-primary font-semibold uppercase">Sobre mí</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-foreground">
              Estética es el arte de potenciar <em className="text-primary">tu belleza</em>
            </h2>
            <div className="h-px w-12 bg-primary my-8" />
            <p className="text-base md:text-lg leading-relaxed text-foreground/75">
              Soy <span className="font-semibold text-primary">Cristina Cebrián</span>, esteticista en Alcorcón con más de
              una década dedicada al cuidado integral de la piel y el cuerpo. Cada tratamiento se diseña a medida,
              combinando tecnología avanzada (radiofrecuencia, criolipolisis, t-dynamics) con un enfoque cálido y cercano.
            </p>
            <p className="mt-4 italic font-display text-foreground/70">
              "Tu momento es ahora. Regálate el cuidado que mereces."
            </p>
          </div>
        </div>
      </section>

      {/* GALERÍA */}
      <section id="galeria" className="py-28 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[11px] tracking-[0.4em] text-primary font-semibold uppercase">Nuestro espacio</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-foreground">Un refugio en Alcorcón</h2>
            <div className="h-px w-12 bg-primary mx-auto mt-6" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[fachadaImg, equipoImg, corporalImg, miradaImg].map((src, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl group ${
                  i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square"
                }`}
              >
                <img
                  src={src}
                  alt="Centro Cristina Cebrián"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <BookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        category={null}
        preselectedTreatment={preselected}
      />
      <ServiceInfoModal
        open={infoOpen}
        onOpenChange={setInfoOpen}
        category={infoCategory}
        onBook={openBookingFor}
      />
      <BuyBonoModal open={buyBonoOpen} onOpenChange={setBuyBonoOpen} />
    </div>
  );
}

