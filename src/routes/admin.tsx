import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Euro,
  LogOut,
  Phone,
  Trash2,
  User as UserIcon,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { deleteCita, getCitas, updateCita, type Cita } from "@/lib/storage";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de Cristina · Área Interna" },
      { name: "description", content: "Panel privado de gestión de citas." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Admin,
});

type Filter = "todas" | "pendiente" | "realizada";

function Admin() {
  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [filter, setFilter] = useState<Filter>("todas");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    if (!isAuth) {
      navigate({ to: "/" });
      return;
    }
    const load = () => setCitas(getCitas());
    load();
    window.addEventListener("citas-updated", load);
    return () => window.removeEventListener("citas-updated", load);
  }, [isAuth, navigate]);

  const stats = useMemo(() => {
    const pendientes = citas.filter((c) => c.estado === "pendiente");
    const realizadas = citas.filter((c) => c.estado === "realizada");
    const ingresos = realizadas.reduce((s, c) => s + c.total, 0);
    const previstos = pendientes.reduce((s, c) => s + c.total, 0);
    return { total: citas.length, pendientes: pendientes.length, realizadas: realizadas.length, ingresos, previstos };
  }, [citas]);

  const visible = useMemo(
    () => (filter === "todas" ? citas : citas.filter((c) => c.estado === filter)),
    [citas, filter]
  );

  const handleLogout = () => {
    logout();
    toast("Sesión cerrada", { description: "Hasta pronto, Cristina." });
    navigate({ to: "/" });
  };

  const markDone = (c: Cita) => {
    updateCita(c.id, { estado: "realizada" });
    toast.success("Cita marcada como realizada");
  };

  const remove = (c: Cita) => {
    deleteCita(c.id);
    toast("Cita eliminada", { description: `${c.nombre} · ${c.fecha}` });
  };

  if (!ready || !isAuth) return null;

  return (
    <div className="min-h-screen bg-foreground text-background">
      {/* HEADER */}
      <header className="border-b border-primary/20 bg-foreground/95 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Sparkles className="size-5 text-primary" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Panel privado</p>
              <h1 className="font-display text-xl text-background">Cristina Cebrián</h1>
            </div>
          </Link>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.2em]"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* INTRO */}
        <div className="mb-10 animate-fade-up">
          <span className="text-[11px] tracking-[0.4em] text-primary font-semibold uppercase">Bienvenida</span>
          <h2 className="font-display text-4xl md:text-5xl mt-2 text-background">Tu agenda de citas</h2>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total citas" value={String(stats.total)} icon={<CalendarIcon className="size-4" />} />
          <StatCard label="Pendientes" value={String(stats.pendientes)} icon={<Clock className="size-4" />} />
          <StatCard label="Realizadas" value={String(stats.realizadas)} icon={<CheckCircle2 className="size-4" />} />
          <StatCard
            label="Ingresos previstos"
            value={`${stats.previstos + stats.ingresos}€`}
            icon={<Euro className="size-4" />}
          />
        </div>

        {/* FILTERS */}
        <div className="flex gap-2 mb-6">
          {(["todas", "pendiente", "realizada"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors border",
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-background/70 border-primary/30 hover:border-primary hover:text-primary"
              )}
            >
              {f === "todas" ? "Todas" : f === "pendiente" ? "Pendientes" : "Realizadas"}
            </button>
          ))}
        </div>

        {/* LIST */}
        {visible.length === 0 ? (
          <div className="border border-dashed border-primary/30 rounded-3xl p-16 text-center">
            <CalendarIcon className="size-10 text-primary mx-auto mb-4" />
            <p className="font-display text-2xl text-background">Sin citas todavía</p>
            <p className="text-sm text-background/60 mt-2">
              Las reservas de tus clientas aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {visible.map((c) => (
              <CitaCard key={c.id} cita={c} onDone={() => markDone(c)} onDelete={() => remove(c)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass-dark rounded-2xl p-5">
      <div className="flex items-center gap-2 text-primary text-[10px] uppercase tracking-[0.25em]">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-display text-3xl text-background mt-3">{value}</p>
    </div>
  );
}

function CitaCard({ cita, onDone, onDelete }: { cita: Cita; onDone: () => void; onDelete: () => void }) {
  const fechaFmt = (() => {
    try {
      return format(parseISO(cita.fecha), "EEEE d 'de' MMMM yyyy", { locale: es });
    } catch {
      return cita.fecha;
    }
  })();

  return (
    <div className={cn(
      "glass-dark rounded-2xl p-6 transition-all",
      cita.estado === "realizada" && "opacity-70"
    )}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-2xl text-background flex items-center gap-2">
              <UserIcon className="size-4 text-primary" />
              {cita.nombre}
            </h3>
            {cita.estado === "realizada" ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/20">
                Realizada
              </Badge>
            ) : (
              <Badge className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/20">
                Pendiente
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-background/75">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 text-primary" /> {fechaFmt}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" /> {cita.hora}
            </span>
            <a
              href={`tel:${cita.telefono.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 hover:text-primary"
            >
              <Phone className="size-3.5 text-primary" /> {cita.telefono}
            </a>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {cita.servicios.map((s) => (
              <span
                key={s}
                className="text-[11px] px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 lg:flex-col lg:items-end">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary">Total</p>
            <p className="font-display text-3xl text-background">{cita.total}€</p>
          </div>
          <div className="flex gap-2">
            {cita.estado === "pendiente" && (
              <Button
                size="sm"
                onClick={onDone}
                className="bg-emerald-500/90 text-white hover:bg-emerald-500 text-[10px] uppercase tracking-[0.2em]"
              >
                <CheckCircle2 className="size-3.5" /> Realizada
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive bg-transparent hover:bg-destructive hover:text-destructive-foreground text-[10px] uppercase tracking-[0.2em]"
                >
                  <Trash2 className="size-3.5" /> Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">¿Eliminar esta cita?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará la reserva de <strong>{cita.nombre}</strong> ({fechaFmt}, {cita.hora}). Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}