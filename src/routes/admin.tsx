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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { deleteCita, getCitas, updateCita, type Cita, type Bono } from "@/lib/storage";
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
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [filter, setFilter] = useState<Filter>("todas");
  const today = new Date().toISOString().slice(0, 10);
  const [nameQuery, setNameQuery] = useState("");
  const [dateQuery, setDateQuery] = useState<string>(today);
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
      supabase
        .from("bonos")
        .select("*")
        .then(({ data }) => {
          if (!data) return;
          setBonos(
            data.map((r: any) => ({
              id: r.id,
              clienteId: r.cliente_id,
              nombre: r.nombre,
              totalSesiones: r.total_sesiones,
              sesionesRestantes: r.sesiones_restantes,
              precio: Number(r.precio),
              estado: r.estado,
              fechaCompra: r.fecha_compra,
            }))
          );
        });
    };
    load();
    const channel = supabase
      .channel("citas-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "citas" },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bonos" },
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
      const n = nameQuery.trim().toLowerCase();
      return citas
        .filter((c) => (filter === "todas" ? true : c.estado === filter))
        .filter((c) => (dateQuery ? c.fecha === dateQuery : true))
        .filter((c) => {
          if (!n) return true;
          return (
            c.nombre.toLowerCase().includes(n) ||
            c.telefono.toLowerCase().includes(n)
          );
        });
    },
    [citas, filter, nameQuery, dateQuery]
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

  // Bono activo por cliente (más reciente, con sesiones > 0)
  const bonoActivoByCliente = useMemo(() => {
    const map = new Map<string, Bono>();
    for (const b of bonos) {
      if (b.estado !== "activo" || b.sesionesRestantes <= 0) continue;
      const existing = map.get(b.clienteId);
      if (!existing || b.fechaCompra > existing.fechaCompra) map.set(b.clienteId, b);
    }
    return map;
  }, [bonos]);

  const getBonoForCita = (c: Cita) => (c.clienteId ? bonoActivoByCliente.get(c.clienteId) ?? null : null);

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
        <div className="mb-8 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-primary" />
            <Input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Buscar nombre o teléfono…"
              className="h-12 pl-11 bg-background/5 border-primary/30 text-background placeholder:text-background/40 focus-visible:ring-primary"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-12 border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground justify-start min-w-[210px]"
              >
                <CalendarIcon className="size-4" />
                {dateQuery
                  ? format(parseISO(dateQuery), "EEE d 'de' MMM yyyy", { locale: es })
                  : "Todas las fechas"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="end">
              <Calendar
                mode="single"
                selected={dateQuery ? parseISO(dateQuery) : undefined}
                onSelect={(d) => setDateQuery(d ? format(d, "yyyy-MM-dd") : "")}
                locale={es}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
              <div className="flex gap-2 p-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDateQuery(today)}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDateQuery("")}
                >
                  Todas
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            onClick={() => { setNameQuery(""); setDateQuery(today); }}
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
          <AgendaColumna titulo="Agenda de Cristina" citas={cristinaCitas} onDone={markDone} onDelete={remove} onEdit={setEditing} getBono={getBonoForCita} />
          <AgendaColumna titulo="Agenda de Jessie" citas={jessieCitas} onDone={markDone} onDelete={remove} onEdit={setEditing} getBono={getBonoForCita} />
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
  getBono,
}: {
  titulo: string;
  citas: Cita[];
  onDone: (c: Cita) => void;
  onDelete: (c: Cita) => void;
  onEdit: (c: Cita) => void;
  getBono: (c: Cita) => Bono | null;
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
            <CitaCard key={c.id} cita={c} bono={getBono(c)} onDone={() => onDone(c)} onDelete={() => onDelete(c)} onEdit={() => onEdit(c)} />
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

function CitaCard({ cita, bono, onDone, onDelete, onEdit }: { cita: Cita; bono: Bono | null; onDone: () => void; onDelete: () => void; onEdit: () => void }) {
  const fechaFmt = (() => {
    try {
      return format(parseISO(cita.fecha), "EEEE d 'de' MMMM yyyy", { locale: es });
    } catch {
      return cita.fecha;
    }
  })();

  return (
    <div className={cn(
      "group relative rounded-2xl border border-primary/15 bg-gradient-to-br from-background/[0.07] to-background/[0.02] backdrop-blur-xl p-6 transition-all hover:border-primary/50 hover:shadow-[0_10px_40px_-10px_rgba(212,175,107,0.35)] hover:-translate-y-0.5",
      cita.estado === "realizada" && "opacity-60"
    )}>
      {/* Banda lateral de color según estado */}
      <span className={cn(
        "absolute left-0 top-6 bottom-6 w-1 rounded-r-full",
        cita.estado === "realizada" ? "bg-emerald-400/60" : "bg-primary"
      )} />

      <div className="grid lg:grid-cols-[1fr_auto] gap-6">
        {/* Columna principal */}
        <div className="space-y-3 pl-3">
          {/* Cabecera: nombre + estado + hora destacada */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-2xl text-background leading-tight">
                  {cita.nombre}
                </h3>
                {cita.estado === "realizada" ? (
                  <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/15 text-[10px] uppercase tracking-[0.18em]">
                    Realizada
                  </Badge>
                ) : (
                  <Badge className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/20 text-[10px] uppercase tracking-[0.18em] animate-pulse">
                    Pendiente
                  </Badge>
                )}
              </div>
              <p className="text-xs text-background/55 mt-0.5 capitalize">{fechaFmt}</p>
            </div>

            {/* Hora grande tipo "ticket" */}
            <div className="flex items-center gap-3 rounded-xl bg-foreground/40 border border-primary/30 px-4 py-2">
              <Clock className="size-4 text-primary" />
              <span className="font-display text-2xl text-background leading-none tracking-wide">{cita.hora}</span>
            </div>
          </div>

          {/* Datos de contacto */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-background/75">
            <span className="flex items-center gap-1.5">
              <UserIcon className="size-3.5 text-primary" />
              <span className="capitalize">{cita.profesional}</span>
            </span>
            <a
              href={`tel:${cita.telefono.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Phone className="size-3.5 text-primary" /> {cita.telefono}
            </a>
            <span className="flex items-center gap-1.5 text-primary font-semibold">
              <Euro className="size-3.5" /> {cita.total}€
            </span>
          </div>

          {/* Servicios */}
          <div className="flex flex-wrap gap-1.5">
            {cita.servicios.map((s) => (
              <span
                key={s}
                className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary/90 border border-primary/25"
              >
                {s}
              </span>
            ))}
          </div>

          {/* Bono badges */}
          {(bono || cita.bonoId) && (
            <div className="flex flex-wrap gap-2 text-[11px]">
              {cita.bonoId && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 font-medium">
                  ✓ Pagada con bono
                </span>
              )}
              {bono && (
                <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
                  Bono · {bono.sesionesRestantes}/{bono.totalSesiones} sesiones
                </span>
              )}
            </div>
          )}
        </div>

        {/* Columna de acciones - botones grandes y visibles */}
        <div className="flex lg:flex-col gap-2 lg:min-w-[170px] lg:border-l lg:border-primary/15 lg:pl-5">
          {cita.estado === "pendiente" && (
            <Button
              onClick={onDone}
              className="flex-1 lg:w-full justify-center bg-emerald-500 text-white hover:bg-emerald-600 shadow-md font-semibold"
            >
              <CheckCircle2 className="size-4" /> Realizada
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex-1 lg:w-full justify-center border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground font-medium"
          >
            <Pencil className="size-4" /> Modificar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 lg:w-full justify-center border-destructive/50 text-destructive bg-transparent hover:bg-destructive hover:text-destructive-foreground font-medium"
              >
                <Trash2 className="size-4" /> Eliminar
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
  );
}