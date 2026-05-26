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
  Search,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";
import { BookingModal } from "@/components/BookingModal";
import { EditCitaModal } from "@/components/EditCitaModal";

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
  const today = new Date().toISOString().slice(0, 10);
  const [query, setQuery] = useState(today);
  const [ready, setReady] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Cita | null>(null);

  useEffect(() => {
    setReady(true);
    if (!isAuth) {
      navigate({ to: "/" });
      return;
    }
    const load = () => {
      getCitas().then(setCitas);
    };
    load();
    const channel = supabase
      .channel("citas-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "citas" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuth, navigate]);

  const stats = useMemo(() => {
    const pendientes = citas.filter((c) => c.estado === "pendiente");
    const realizadas = citas.filter((c) => c.estado === "realizada");
    const ingresos = realizadas.reduce((s, c) => s + c.total, 0);
    const previstos = pendientes.reduce((s, c) => s + c.total, 0);
    return { total: citas.length, pendientes: pendientes.length, realizadas: realizadas.length, ingresos, previstos };
  }, [citas]);

  const visible = useMemo(
    () => {
      const q = query.trim().toLowerCase();
      return citas
        .filter((c) => (filter === "todas" ? true : c.estado === filter))
        .filter((c) => {
          if (!q) return true;
          return (
            c.nombre.toLowerCase().includes(q) ||
            c.telefono.toLowerCase().includes(q) ||
            c.fecha.includes(q) ||
            c.profesional.toLowerCase().includes(q)
          );
        });
    },
    [citas, filter, query]
  );

  const handleLogout = async () => {
    await logout();
    toast("Sesión cerrada", { description: "Hasta pronto, Cristina." });
    navigate({ to: "/" });
  };

  const markDone = async (c: Cita) => {
    await updateCita(c.id, { estado: "realizada" });
    toast.success("Cita marcada como realizada");
  };

  const remove = async (c: Cita) => {
    await deleteCita(c.id);
    toast("Cita eliminada", { description: `${c.nombre} · ${c.fecha}` });
  };

  if (!ready || !isAuth) return null;

  const cristinaCitas = visible.filter((c) => c.profesional === "cristina");
  const jessieCitas = visible.filter((c) => c.profesional === "jessie");

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

        {/* SEARCH */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono, fecha (2026-05-30) o profesional…"
              className="h-12 pl-11 bg-background/5 border-primary/30 text-background placeholder:text-background/40 focus-visible:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setQuery(today)}
              variant="outline"
              className="h-12 border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.2em]"
            >
              Hoy
            </Button>
            <Button
              onClick={() => setOpenNew(true)}
              className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-[0.2em]"
            >
              <Plus className="size-4" /> Nueva cita
            </Button>
          </div>
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
        <div className="grid lg:grid-cols-2 gap-8">
          <AgendaColumna titulo="Agenda de Cristina" citas={cristinaCitas} onDone={markDone} onDelete={remove} onEdit={setEditing} />
          <AgendaColumna titulo="Agenda de Jessie" citas={jessieCitas} onDone={markDone} onDelete={remove} onEdit={setEditing} />
        </div>
      </main>

      <BookingModal open={openNew} onOpenChange={setOpenNew} category={null} />
      <EditCitaModal cita={editing} open={!!editing} onOpenChange={(v) => !v && setEditing(null)} />
    </div>
  );
}

function AgendaColumna({
  titulo,
  citas,
  onDone,
  onDelete,
  onEdit,
}: {
  titulo: string;
  citas: Cita[];
  onDone: (c: Cita) => void;
  onDelete: (c: Cita) => void;
  onEdit: (c: Cita) => void;
}) {
  const ordenadas = [...citas].sort((a, b) =>
    a.fecha === b.fecha ? a.hora.localeCompare(b.hora) : a.fecha.localeCompare(b.fecha)
  );
  return (
    <section>
      <h3 className="font-display text-2xl text-background mb-4 flex items-center gap-2">
        <span className="size-2 rounded-full bg-primary" />
        {titulo}
        <span className="text-xs uppercase tracking-[0.2em] text-primary/70">({ordenadas.length})</span>
      </h3>
      {ordenadas.length === 0 ? (
        <div className="border border-dashed border-primary/20 rounded-2xl p-10 text-center">
          <p className="text-sm text-background/60">Sin citas en esta vista.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {ordenadas.map((c) => (
            <CitaCard key={c.id} cita={c} onDone={() => onDone(c)} onDelete={() => onDelete(c)} onEdit={() => onEdit(c)} />
          ))}
        </div>
      )}
    </section>
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

function CitaCard({ cita, onDone, onDelete, onEdit }: { cita: Cita; onDone: () => void; onDelete: () => void; onEdit: () => void }) {
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
            <span className="flex items-center gap-1.5">
              <UserIcon className="size-3.5 text-primary" />
              {cita.profesional === "cristina" ? "Cristina" : "Jessie"}
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
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground text-[10px] uppercase tracking-[0.2em]"
            >
              <Pencil className="size-3.5" /> Modificar
            </Button>
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