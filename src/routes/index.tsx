import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Award, Sparkles, Flower2, HeartPulse, Zap, Eye, Brush } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookingModal } from "@/components/BookingModal";
import { Button } from "@/components/ui/button";
import { SERVICIOS, type ServiceCategory } from "@/lib/config";
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

const PRICE_ORDER: { key: ServiceCategory; Icon: typeof Flower2 }[] = [
  { key: "facial", Icon: Flower2 },
  { key: "corporal", Icon: HeartPulse },
  { key: "depilacion", Icon: Zap },
  { key: "mirada", Icon: Eye },
  { key: "micropigmentacion", Icon: Brush },
];

function Index() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [category, setCategory] = useState<ServiceCategory | null>(null);

  const openCategory = (c: ServiceCategory) => {
    setCategory(c);
    setBookingOpen(true);
  };

  const openGeneric = () => {
    setCategory("facial");
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
            <Button
              variant="outline"
              onClick={openGeneric}
              className="h-12 px-8 border-primary/50 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs uppercase tracking-[0.25em] rounded-full bg-background/70 backdrop-blur"
            >
              Reservar Ahora
            </Button>
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
                onClick={() => openCategory(s.key)}
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
                      Ver precios <ArrowRight className="size-3" />
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
        <PreciosBloque onBook={openCategory} />

        <div className="max-w-6xl mx-auto px-6 mt-28">
          <div className="text-center mb-16">
            <span className="text-[11px] tracking-[0.4em] text-primary font-semibold uppercase">Ofertas exclusivas</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-foreground">Promociones y Bonos</h2>
            <div className="h-px w-12 bg-primary mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <PromoCard
              badge="Recomendado"
              titulo="Bono Facial VIP"
              descripcion="Pack de 5 sesiones de vitaminas y peeling ultrasónico."
              precio={180}
              antes={225}
              onBook={openGeneric}
            />
            <PromoCard
              titulo="Bono Maderoterapia"
              descripcion="10 sesiones intensivas para reducir y reafirmar."
              precio={350}
              antes={450}
              onBook={openGeneric}
            />
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

      <BookingModal open={bookingOpen} onOpenChange={setBookingOpen} category={null} />
    </div>
  );
}

function PromoCard({
  badge,
  titulo,
  descripcion,
  precio,
  antes,
  onBook,
}: {
  badge?: string;
  titulo: string;
  descripcion: string;
  precio: number;
  antes: number;
  onBook: () => void;
}) {
  return (
    <div className="relative bg-secondary border border-primary/15 rounded-3xl p-10 text-center transition-all duration-500 hover:border-primary hover:-translate-y-2 hover:gold-shadow">
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-[10px] uppercase tracking-[0.25em] font-semibold">
          {badge}
        </span>
      )}
      <h3 className="font-display text-2xl text-foreground">{titulo}</h3>
      <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto">{descripcion}</p>
      <div className="my-7">
        <span className="font-display text-5xl text-foreground">{precio}€</span>
        <span className="text-lg line-through text-muted-foreground/70 ml-3">{antes}€</span>
      </div>
      <Button
        onClick={onBook}
        className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.25em] rounded-full px-8"
      >
        Quiero este bono
      </Button>
    </div>
  );
}

function PreciosBloque({ onBook }: { onBook: (c: ServiceCategory) => void }) {
  return (
    <div id="precios" className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-14">
        <span className="text-[11px] tracking-[0.4em] text-primary font-semibold uppercase">Tarifa oficial</span>
        <h2 className="font-display text-4xl md:text-5xl mt-3 text-foreground">Precios</h2>
        <div className="h-px w-12 bg-primary mx-auto mt-6" />
        <p className="mt-5 text-sm text-muted-foreground max-w-md mx-auto">
          Tratamientos por sesión. Bonos personalizados de láser, faciales y corporales a consultar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRICE_ORDER.map(({ key, Icon }) => {
          const cat = SERVICIOS[key];
          return (
            <div
              key={key}
              className="group relative bg-card border border-primary/15 rounded-3xl p-7 transition-all duration-500 hover:border-primary hover:-translate-y-1 hover:gold-shadow flex flex-col"
            >
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-primary/10">
                <span className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display text-2xl text-foreground">{cat.titulo}</h3>
              </div>
              <ul className="space-y-2.5 text-sm flex-1">
                {cat.treatments.map((t) => (
                  <li key={t.nombre} className="flex items-baseline gap-3">
                    <span className="text-foreground/85">{t.nombre}</span>
                    <span className="flex-1 border-b border-dotted border-primary/25 translate-y-[-3px]" />
                    <span className="font-semibold text-primary whitespace-nowrap">
                      {t.desde && (
                        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mr-1">
                          desde
                        </span>
                      )}
                      {t.precio}€
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => onBook(key)}
                variant="outline"
                className="mt-6 w-full border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground text-[10px] uppercase tracking-[0.25em] rounded-full"
              >
                Reservar {cat.titulo}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
