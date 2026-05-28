import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Euro, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { PrivateAccessGate } from "@/components/PrivateAccessGate";
import { getCitasCobradasRango, type Cita } from "@/lib/storage";

const SESSION_KEY = "private_ingresos_unlocked";

export const Route = createFileRoute("/admin/ingresos")({
  head: () => ({
    meta: [
      { title: "Ingresos · Privado" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Ingresos,
});

function Ingresos() {
  const { isAuth, loading } = useAuth();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);
  const [citas, setCitas] = useState<Cita[]>([]);
  const today = new Date().toISOString().slice(0, 10);
  const [vista, setVista] = useState<"dia" | "semana" | "mes">("dia");
  const [anchor, setAnchor] = useState(today);

  const rango = useMemo(() => {
    const ref = parseISO(anchor);
    if (vista === "dia") return { desde: anchor, hasta: anchor };
    if (vista === "semana") {
      return {
        desde: format(startOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        hasta: format(endOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    }
    return {
      desde: format(startOfMonth(ref), "yyyy-MM-dd"),
      hasta: format(endOfMonth(ref), "yyyy-MM-dd"),
    };
  }, [vista, anchor]);

  const rangoLabel = useMemo(() => {
    const d = parseISO(rango.desde);
    const h = parseISO(rango.hasta);
    if (vista === "dia") return format(d, "EEEE d 'de' MMMM yyyy", { locale: es });
    if (vista === "semana")
      return `${format(d, "d MMM", { locale: es })} – ${format(h, "d MMM yyyy", { locale: es })}`;
    return format(d, "MMMM yyyy", { locale: es });
  }, [rango, vista]);

  const shift = (dir: 1 | -1) => {
    const ref = parseISO(anchor);
    const next = vista === "dia" ? addDays(ref, dir) : vista === "semana" ? addWeeks(ref, dir) : addMonths(ref, dir);
    setAnchor(format(next, "yyyy-MM-dd"));
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuth) {
      navigate({ to: "/" });
      return;
    }
  }, [loading, isAuth, navigate]);

  useEffect(() => {
    if (!unlocked) return;
    getCitasCobradasRango(rango.desde, rango.hasta).then(setCitas);
  }, [unlocked, rango]);

  const stats = useMemo(() => {
    const total = citas.reduce((s, c) => s + (c.total || 0), 0);
    const porProfesional = citas.reduce<Record<string, number>>((acc, c) => {
      acc[c.profesional] = (acc[c.profesional] || 0) + (c.total || 0);
      return acc;
    }, {});
    return { total, porProfesional, count: citas.length };
  }, [citas]);

  if (loading || !isAuth) return null;

  if (!unlocked) {
    return <PrivateAccessGate title="Ingresos · Acceso privado" sessionKey={SESSION_KEY} onUnlocked={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-foreground text-background">
      <header className="border-b border-primary/20 bg-foreground/95 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.2em]">
            <ArrowLeft className="size-4" /> Panel
          </Link>
          <h1 className="font-display text-xl">Ingresos</h1>
          <Button
            variant="outline"
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); setUnlocked(false); }}
            className="border-primary/30 text-primary bg-transparent text-xs"
          >
            Bloquear
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-primary/30 bg-background/5 p-1">
            {(["dia", "semana", "mes"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors",
                  vista === v ? "bg-primary text-primary-foreground" : "text-background/70 hover:text-primary"
                )}
              >
                {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-primary/30 bg-background/5">
            <Button variant="ghost" size="icon" onClick={() => shift(-1)} className="rounded-full text-primary hover:bg-primary/10">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-3 text-sm text-background min-w-[240px] text-center capitalize">{rangoLabel}</span>
            <Button variant="ghost" size="icon" onClick={() => shift(1)} className="rounded-full text-primary hover:bg-primary/10">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Input
            type="date"
            value={anchor}
            onChange={(e) => e.target.value && setAnchor(e.target.value)}
            className="bg-background/5 border-primary/30 text-background w-[180px]"
          />
          <Button variant="outline" onClick={() => setAnchor(today)} className="border-primary/30 text-primary bg-transparent">
            Hoy
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card label="Total recaudado" value={`${stats.total}€`} />
          <Card label="Citas cobradas" value={String(stats.count)} />
          <Card
            label="Por profesional"
            value={Object.entries(stats.porProfesional).map(([k, v]) => `${k}: ${v}€`).join(" · ") || "—"}
          />
        </div>

        <div className="glass-dark rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-primary/10 text-primary text-[11px] uppercase tracking-[0.2em]">
              <tr>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Servicios</th>
                <th className="text-left p-3">Hora</th>
                <th className="text-left p-3">Profesional</th>
                <th className="text-right p-3">Importe</th>
              </tr>
            </thead>
            <tbody>
              {citas.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-background/50">Sin cobros en esta fecha.</td></tr>
              ) : citas.map((c) => (
                <tr key={c.id} className="border-t border-primary/10">
                  <td className="p-3">{c.nombre} {c.apellido_1 ?? ""}</td>
                  <td className="p-3 text-background/70">{c.servicios.join(", ")}</td>
                  <td className="p-3">{c.hora}</td>
                  <td className="p-3 capitalize">{c.profesional}</td>
                  <td className="p-3 text-right font-semibold text-primary">
                    <Euro className="inline size-3.5" /> {c.precio_cobrado ?? c.total}€
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-background/40">
          Rango: {rangoLabel}
        </p>
      </main>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-dark rounded-2xl p-5">
      <p className="text-[10px] uppercase tracking-[0.25em] text-primary">{label}</p>
      <p className="font-display text-2xl text-background mt-2 break-words">{value}</p>
    </div>
  );
}