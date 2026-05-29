import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link, Outlet, useLocation } from "@tanstack/react-router";
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
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Euro,
  Gift,
  IdCard,
  LogOut,
  MessageCircle,
  Moon,
  Phone,
  Sun,
  Trash2,
  User as UserIcon,
  Sparkles,
  Search,
  Pencil,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useTheme } from "@/lib/theme-context";
import { deleteCita, getBonosPanel, getCitas, marcarCitaCobrada, PROFESIONALES, updateCita, type Cita, type Bono, type Profesional } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { BookingModal } from "@/components/BookingModal";
import { EditCitaModal } from "@/components/EditCitaModal";
import { ClienteSearchDropdown } from "@/components/ClienteSearchDropdown";
import { BuyBonoAdminModal } from "@/components/BuyBonoAdminModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
type Vista = "dia" | "semana" | "mes";
type ClienteExport = {
  nombre: string | null;
  apellido_1: string | null;
  apellido_2: string | null;
  telefono: string | null;
  email: string | null;
  alias: string | null;
  observaciones: string | null;
  created_at: string | null;
};
type CitaExport = {
  fecha: string;
  hora: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  profesional: string;
  servicios: string[] | null;
  total: number;
  estado: string;
  cobrada: boolean;
  precio_cobrado: number | null;
  observaciones: string | null;
};

function whatsappData(cita: Cita) {
  let phone = (cita.telefono ?? "").replace(/[^\d]/g, "");
  if (phone.startsWith("00")) phone = phone.slice(2);
  const clean = phone.length === 9 ? `34${phone}` : phone;
  const text = `Hola ${cita.nombre}, desde Cristina Cebrián le recordamos su cita el ${cita.fecha} a las ${cita.hora}.`;
  return { phone: clean, text, url: clean ? `whatsapp://send?phone=${clean}&text=${encodeURIComponent(text)}` : "" };
}

function openWhatsAppReminder(cita: Cita) {
  const { phone, text, url } = whatsappData(cita);
  if (!phone) {
    toast.error("Esta cita no tiene teléfono para WhatsApp");
    return;
  }

  navigator.clipboard?.writeText(text).catch(() => undefined);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Abriendo WhatsApp", { description: "Si el navegador no lo abre, el mensaje ya está copiado para pegarlo." });
}

function Admin() {
  const { isAuth, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [filter, setFilter] = useState<Filter>("todas");
  const [profesionalQuery, setProfesionalQuery] = useState<"todas" | Profesional>("todas");
  const today = new Date().toISOString().slice(0, 10);
  const [nameQuery, setNameQuery] = useState("");
  const [vista, setVista] = useState<Vista>("dia");
  const [anchorDate, setAnchorDate] = useState<string>(today);
  const [ready, setReady] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [openBono, setOpenBono] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [editing, setEditing] = useState<Cita | null>(null);

  useEffect(() => {
    if (authLoading) return;
    setReady(true);
    if (!isAuth) {
      navigate({ to: "/" });
      return;
    }
    const load = () => {
      getCitas().then(setCitas);
      getBonosPanel().then(setBonos);
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clientes" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, isAuth, navigate]);

  // Rango actual según vista (día / semana / mes)
  const rango = useMemo(() => {
    const ref = parseISO(anchorDate);
    if (vista === "dia") return { desde: anchorDate, hasta: anchorDate };
    if (vista === "semana") {
      const ini = startOfWeek(ref, { weekStartsOn: 1 });
      const fin = endOfWeek(ref, { weekStartsOn: 1 });
      return { desde: format(ini, "yyyy-MM-dd"), hasta: format(fin, "yyyy-MM-dd") };
    }
    const ini = startOfMonth(ref);
    const fin = endOfMonth(ref);
    return { desde: format(ini, "yyyy-MM-dd"), hasta: format(fin, "yyyy-MM-dd") };
  }, [vista, anchorDate]);

  const rangoLabel = useMemo(() => {
    const desde = parseISO(rango.desde);
    const hasta = parseISO(rango.hasta);
    if (vista === "dia") return format(desde, "EEEE d 'de' MMMM yyyy", { locale: es });
    if (vista === "semana")
      return `${format(desde, "d MMM", { locale: es })} – ${format(hasta, "d MMM yyyy", { locale: es })}`;
    return format(desde, "MMMM yyyy", { locale: es });
  }, [rango, vista]);

  const shift = (dir: 1 | -1) => {
    const ref = parseISO(anchorDate);
    const next =
      vista === "dia" ? addDays(ref, dir) : vista === "semana" ? addWeeks(ref, dir) : addMonths(ref, dir);
    setAnchorDate(format(next, "yyyy-MM-dd"));
  };

  // Citas dentro del rango seleccionado (sin filtros de estado/nombre todavía)
  const citasDelRango = useMemo(() => {
    const base = citas.filter((c) => c.fecha >= rango.desde && c.fecha <= rango.hasta);
    return profesionalQuery === "todas" ? base : base.filter((c) => c.profesional === profesionalQuery);
  }, [citas, rango, profesionalQuery]);

  const stats = useMemo(() => {
    const pendientes = citasDelRango.filter((c) => c.estado === "pendiente");
    const realizadas = citasDelRango.filter((c) => c.estado === "realizada");
    const ingresos = realizadas.reduce((s, c) => s + c.total, 0);
    const previstos = pendientes.reduce((s, c) => s + c.total, 0);
    return {
      total: citasDelRango.length,
      pendientes: pendientes.length,
      realizadas: realizadas.length,
      ingresos,
      previstos,
    };
  }, [citasDelRango]);

  const visible = useMemo(() => {
    const n = nameQuery.trim().toLowerCase();
    const base = n
      ? (profesionalQuery === "todas" ? citas : citas.filter((c) => c.profesional === profesionalQuery))
      : citasDelRango;
    return base
      .filter((c) => (filter === "todas" ? true : c.estado === filter))
      .filter((c) => {
        if (!n) return true;
        // Coincidencia por inicio en nombre / apellidos. Teléfono = contiene.
        return (
          c.nombre.toLowerCase().startsWith(n) ||
          (c.apellido_1?.toLowerCase().startsWith(n) ?? false) ||
          (c.apellido_2?.toLowerCase().startsWith(n) ?? false) ||
          c.telefono.toLowerCase().includes(n)
        );
      });
  }, [citas, citasDelRango, filter, nameQuery, profesionalQuery]);

  const bonosVisibles = useMemo(() => {
    const n = nameQuery.trim().toLowerCase();
    return bonos.filter((b) => {
      if (!n) return true;
      const cliente = b.cliente;
      const startsFields = [cliente?.nombre, cliente?.apellido_1, cliente?.apellido_2, cliente?.alias]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().startsWith(n));
      const phoneMatch = (cliente?.telefono ?? "").toLowerCase().includes(n);
      return startsFields || phoneMatch;
    });
  }, [bonos, nameQuery]);

  const handleLogout = async () => {
    await logout();
    toast("Sesión cerrada", { description: "Hasta pronto, Cristina." });
    navigate({ to: "/" });
  };

  const markDone = async (c: Cita) => {
    // Marcar como realizada implica registrar cobro (entra en Ingresos)
    const res = await marcarCitaCobrada(c.id, c.total);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Cita realizada · ${c.total}€ registrados en ingresos`);
  };

  const remove = async (c: Cita) => {
    await deleteCita(c.id);
    toast("Cita eliminada", { description: `${c.nombre} · ${c.fecha}` });
  };

  const cobrar = async (c: Cita) => {
    const res = await marcarCitaCobrada(c.id, c.total);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Cobro registrado · ${c.total}€`);
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

  if (!ready || authLoading || !isAuth) return null;

  if (location.pathname !== "/admin") return <Outlet />;

  const cristinaCitas = visible.filter((c) => c.profesional === "cristina");
  const jennyCitas = visible.filter((c) => c.profesional === "jenny");
  const nereaCitas = visible.filter((c) => c.profesional === "nerea");
  const maquinaCitas = visible.filter((c) => c.profesional === "maquina");

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
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.2em]">
              <Link to="/admin/ingresos">Ingresos</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.2em]">
              <Link to="/admin/precios">Precios</Link>
            </Button>
            <Button
              onClick={() => setOpenBono(true)}
              variant="outline"
              className="border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.2em]"
            >
              <Gift className="size-4" /> Comprar bono
            </Button>
            <Button
              onClick={() => setOpenExport(true)}
              variant="outline"
              className="border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.2em]"
            >
              <Download className="size-4" /> Exportar datos
            </Button>
            <Button
              onClick={toggleTheme}
              variant="outline"
              className="border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.2em]"
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.2em]"
            >
              <LogOut className="size-4" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* INTRO */}
        <div className="mb-10 animate-fade-up">
          <span className="text-[11px] tracking-[0.4em] text-primary font-semibold uppercase">Bienvenida</span>
          <h2 className="font-display text-4xl md:text-5xl mt-2 text-background">Tu agenda de citas</h2>
        </div>

        {/* SEARCH */}
        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-primary" />
            <Input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Buscar nombre, apellido o teléfono…"
              className="h-12 pl-11 bg-background/5 border-primary/30 text-background placeholder:text-background/40 focus-visible:ring-primary"
            />
          </div>
          <Select value={profesionalQuery} onValueChange={(v) => setProfesionalQuery(v as "todas" | Profesional)}>
            <SelectTrigger className="h-12 border-primary/40 bg-background/5 text-background focus:ring-primary">
              <SelectValue placeholder="Trabajadora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {PROFESIONALES.map((p) => (
                <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setOpenNew(true)}
            className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-[0.2em]"
          >
            <Plus className="size-4" /> Nueva cita
          </Button>
        </div>

        {/* VISTA: DÍA / SEMANA / MES */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-primary/30 bg-background/5 p-1">
            {(["dia", "semana", "mes"] as Vista[]).map((v) => (
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="text-background hover:bg-primary/10 min-w-[260px] capitalize">
                  <CalendarIcon className="size-4 text-primary" /> {rangoLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="center">
                <Calendar
                  mode="single"
                  selected={parseISO(anchorDate)}
                  onSelect={(d) => d && setAnchorDate(format(d, "yyyy-MM-dd"))}
                  locale={es}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={() => shift(1)} className="rounded-full text-primary hover:bg-primary/10">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button
            onClick={() => setAnchorDate(today)}
            variant="outline"
            className="h-9 border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.2em]"
          >
            Hoy
          </Button>
        </div>

        {/* BUSCADOR DE FICHAS */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary mb-2">Buscar ficha de cliente</p>
          <ClienteSearchDropdown />
        </div>

        {/* STATS (sin ingresos: ver en sección privada) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            label={vista === "dia" ? "Citas del día" : vista === "semana" ? "Citas de la semana" : "Citas del mes"}
            value={String(stats.total)}
            icon={<CalendarIcon className="size-4" />}
          />
          <StatCard label="Por hacer" value={String(stats.pendientes)} icon={<Clock className="size-4" />} />
          <StatCard label="Realizadas" value={String(stats.realizadas)} icon={<CheckCircle2 className="size-4" />} />
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
          <AgendaColumna titulo="Agenda de Cristina" citas={cristinaCitas} onDone={markDone} onDelete={remove} onEdit={setEditing} onCobrar={cobrar} getBono={getBonoForCita} />
          <AgendaColumna titulo="Agenda de Jenny" citas={jennyCitas} onDone={markDone} onDelete={remove} onEdit={setEditing} onCobrar={cobrar} getBono={getBonoForCita} />
          <AgendaColumna titulo="Agenda de Nerea" citas={nereaCitas} onDone={markDone} onDelete={remove} onEdit={setEditing} onCobrar={cobrar} getBono={getBonoForCita} />
          <AgendaColumna titulo="Agenda Máquina (Sala 1)" citas={maquinaCitas} onDone={markDone} onDelete={remove} onEdit={setEditing} onCobrar={cobrar} getBono={getBonoForCita} />
        </div>

        <BonosPanel bonos={bonosVisibles} />
      </main>

      <BookingModal open={openNew} onOpenChange={setOpenNew} category={null} />
      <EditCitaModal cita={editing} open={!!editing} onOpenChange={(v) => !v && setEditing(null)} />
      <BuyBonoAdminModal open={openBono} onOpenChange={setOpenBono} />
      <ExportModal open={openExport} onOpenChange={setOpenExport} />
    </div>
  );
}

function AgendaColumna({
  titulo,
  citas,
  onDone,
  onDelete,
  onEdit,
  onCobrar,
  getBono,
}: {
  titulo: string;
  citas: Cita[];
  onDone: (c: Cita) => void;
  onDelete: (c: Cita) => void;
  onEdit: (c: Cita) => void;
  onCobrar: (c: Cita) => void;
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
            <CitaCard key={c.id} cita={c} bono={getBono(c)} onDone={() => onDone(c)} onDelete={() => onDelete(c)} onEdit={() => onEdit(c)} onCobrar={() => onCobrar(c)} />
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

function BonosPanel({ bonos }: { bonos: Bono[] }) {
  const [selectedCli, setSelectedCli] = useState<string>("");
  const clientes = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const b of bonos) {
      const label = [b.cliente?.nombre, b.cliente?.apellido_1].filter(Boolean).join(" ") || b.clienteId.slice(0, 8);
      if (!map.has(b.clienteId)) map.set(b.clienteId, { id: b.clienteId, label });
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [bonos]);
  const filtered = useMemo(
    () => (selectedCli ? bonos.filter((b) => b.clienteId === selectedCli) : []),
    [bonos, selectedCli]
  );
  return (
    <section className="mt-12">
      <h3 className="font-display text-2xl text-background mb-4 flex items-center gap-2">
        <Gift className="size-5 text-primary" /> Bonos comprados
        <span className="text-xs uppercase tracking-[0.2em] text-primary/70">({bonos.length})</span>
      </h3>
      <div className="mb-5 max-w-sm">
        <Select value={selectedCli} onValueChange={setSelectedCli}>
          <SelectTrigger className="h-11 border-primary/40 bg-background/5 text-background">
            <SelectValue placeholder="Selecciona un cliente para ver sus bonos" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!selectedCli ? (
        <div className="border border-dashed border-primary/20 rounded-2xl p-8 text-center">
          <p className="text-sm text-background/60">Selecciona un cliente para ver los bonos que compró.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-primary/20 rounded-2xl p-8 text-center">
          <p className="text-sm text-background/60">Este cliente no tiene bonos.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((b) => {
            const usadas = b.totalSesiones - b.sesionesRestantes;
            const cliente = b.cliente;
            return (
              <div key={b.id} className="glass-dark rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl text-background">{cliente?.nombre ?? "Cliente"}</p>
                    <p className="text-xs text-background/55">{cliente?.telefono ?? "Sin teléfono"}</p>
                    <p className="text-sm text-primary mt-1">{b.nombre}</p>
                  </div>
                  <Badge className={cn("border text-[10px] uppercase tracking-[0.18em]", b.estado === "agotado" ? "bg-destructive/15 text-destructive border-destructive/40" : "bg-primary/15 text-primary border-primary/40")}>
                    {b.estado === "agotado" ? "Agotado" : "Activo"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-background/5 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-primary">Restan</p><p className="font-display text-2xl text-background">{b.sesionesRestantes}</p></div>
                  <div className="rounded-xl bg-background/5 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-primary">Usadas</p><p className="font-display text-2xl text-background">{usadas}</p></div>
                  <div className="rounded-xl bg-background/5 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-primary">Total</p><p className="font-display text-2xl text-background">{b.totalSesiones}</p></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-background/60">
                  <IdCard className="size-3.5 text-primary" /> ID cliente: {b.clienteId.slice(0, 8)}
                </div>
                <p className="text-xs text-background/55">Compra: {format(parseISO(b.fechaCompra), "d MMM yyyy", { locale: es })}</p>
                <p className="text-xs text-background/55">Precio: {b.precio}€</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CitaCard({ cita, bono, onDone, onDelete, onEdit, onCobrar }: { cita: Cita; bono: Bono | null; onDone: () => void; onDelete: () => void; onEdit: () => void; onCobrar: () => void }) {
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
                  {cita.nombre} {cita.apellido_1} {cita.apellido_2}
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
          {!cita.cobrada && (
            <Button
              onClick={onCobrar}
              variant="outline"
              className="flex-1 lg:w-full justify-center border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground font-medium"
            >
              <Euro className="size-4" /> Cobrar {cita.total}€
            </Button>
          )}
          {cita.clienteId && (
            <Button
              asChild
              variant="outline"
              className="flex-1 lg:w-full justify-center border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground font-medium"
            >
              <Link to="/admin/cliente/$id" params={{ id: cita.clienteId }}>
                <UserIcon className="size-4" /> Ver ficha
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex-1 lg:w-full justify-center border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground font-medium"
          >
            <Pencil className="size-4" /> Modificar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const { phone, text, url } = whatsappData(cita);
              if (!phone) return toast.error("Esta cita no tiene teléfono para WhatsApp");
              const win = window.open(url, "_blank");
              if (!win) {
                navigator.clipboard?.writeText(text);
                toast.success("Mensaje copiado", { description: "Abre WhatsApp y pégalo en el chat del cliente." });
              }
            }}
            className="flex-1 lg:w-full justify-center rounded-full border-whatsapp/30 bg-whatsapp text-whatsapp-foreground shadow-lg shadow-whatsapp/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-whatsapp/90 hover:shadow-xl hover:shadow-whatsapp/30 font-semibold"
          >
            <MessageCircle className="size-4" /> WhatsApp
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

function ExportModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [rango, setRango] = useState<"dia" | "semana" | "mes" | "todo">("mes");
  const [busy, setBusy] = useState(false);

  const calcRango = () => {
    const ref = parseISO(today);
    if (rango === "dia") return { desde: today, hasta: today };
    if (rango === "semana") {
      return {
        desde: format(startOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        hasta: format(endOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    }
    if (rango === "mes") {
      return {
        desde: format(startOfMonth(ref), "yyyy-MM-dd"),
        hasta: format(endOfMonth(ref), "yyyy-MM-dd"),
      };
    }
    return { desde: "1900-01-01", hasta: "2999-12-31" };
  };

  const toExcelXml = (sheets: { name: string; headers: string[]; rows: Record<string, unknown>[] }[]) => {
    const esc = (v: unknown) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const sheetXml = sheets
      .map(({ name, headers, rows }) => {
        const headerRow = `<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join("")}</Row>`;
        const bodyRows = rows
          .map((row) => `<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${esc(row[h])}</Data></Cell>`).join("")}</Row>`)
          .join("");
        return `<Worksheet ss:Name="${esc(name)}"><Table>${headerRow}${bodyRows}</Table></Worksheet>`;
      })
      .join("");
    return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheetXml}</Workbook>`;
  };

  const downloadExcel = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchAllRows = async <T,>(queryFactory: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) => {
    const all: T[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await queryFactory(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      const page = data ?? [];
      all.push(...page);
      if (page.length < pageSize) break;
    }
    return all;
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const { desde, hasta } = calcRango();
      const now = new Date();
      const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
      const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      const getWeek = (d: Date) => {
        const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const day = t.getUTCDay() || 7;
        t.setUTCDate(t.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
        return Math.ceil(((+t - +yearStart) / 86400000 + 1) / 7);
      };
      const stamp = `${dias[now.getDay()]}-${String(now.getDate()).padStart(2, "0")}-${meses[now.getMonth()]}-${now.getFullYear()}-semana${getWeek(now)}-${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}${String(now.getSeconds()).padStart(2,"0")}`;
      const tag = stamp;

      // CLIENTES (todos siempre, es la "copia de seguridad")
      const cli = await fetchAllRows<ClienteExport>((from, to) =>
        supabase
          .from("clientes")
          .select("nombre,apellido_1,apellido_2,telefono,email,alias,observaciones,created_at")
          .order("nombre")
          .range(from, to)
      );
      const cliRows = (cli ?? []).map((c) => ({
        Nombre: c.nombre ?? "",
        Apellido1: c.apellido_1 ?? "",
        Apellido2: c.apellido_2 ?? "",
        Telefono: c.telefono ?? "",
        Email: c.email ?? "",
        Alias: c.alias ?? "",
        Observaciones: c.observaciones ?? "",
        Alta: c.created_at ?? "",
      }));

      // CITAS (rango seleccionado)
      const cit = await fetchAllRows<CitaExport>((from, to) =>
        supabase
          .from("citas")
          .select("fecha,hora,nombre,telefono,email,profesional,servicios,total,estado,cobrada,precio_cobrado,observaciones")
          .gte("fecha", desde)
          .lte("fecha", hasta)
          .order("fecha", { ascending: true })
          .order("hora", { ascending: true })
          .range(from, to)
      );
      const citRows = (cit ?? []).map((c) => ({
        Fecha: c.fecha,
        Hora: c.hora,
        Cliente: c.nombre,
        Telefono: c.telefono ?? "",
        Email: c.email ?? "",
        Profesional: c.profesional,
        Tratamientos: (c.servicios ?? []).join(" | "),
        Total: c.total,
        Estado: c.estado,
        Cobrada: c.cobrada ? "Sí" : "No",
        PrecioCobrado: c.precio_cobrado ?? "",
        Observaciones: c.observaciones ?? "",
      }));
      downloadExcel(
        `clientes_cristina_${tag}.xls`,
        toExcelXml([{ name: "Clientes", headers: ["Nombre", "Apellido1", "Apellido2", "Telefono", "Email", "Alias", "Observaciones", "Alta"], rows: cliRows }])
      );
      downloadExcel(
        `citas_cristina_${rango}_${tag}.xls`,
        toExcelXml([{ name: "Citas", headers: ["Fecha", "Hora", "Cliente", "Telefono", "Email", "Profesional", "Tratamientos", "Total", "Estado", "Cobrada", "PrecioCobrado", "Observaciones"], rows: citRows }])
      );

      toast.success("Exportación completada", {
        description: `${cliRows.length} clientes · ${citRows.length} citas`,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error("No se pudo exportar", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Exportar datos</DialogTitle>
          <DialogDescription>
            Descarga una copia de seguridad de tus clientes y del historial de citas en formato Excel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Rango de citas</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { k: "dia", l: "Hoy" },
              { k: "semana", l: "Esta semana" },
              { k: "mes", l: "Este mes" },
              { k: "todo", l: "Todo el historial" },
            ] as const).map((o) => (
              <button
                key={o.k}
                onClick={() => setRango(o.k)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm transition-colors",
                  rango === o.k
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-primary/30 hover:border-primary"
                )}
              >
                {o.l}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Se descargarán 2 archivos: <strong>clientes</strong> (todos) y <strong>citas</strong> (rango seleccionado).
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="size-4" /> {busy ? "Generando…" : "Descargar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}