import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarIcon, Check, Loader2, Sparkles, Waves, Scissors, Hand, Brush, User } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SERVICIOS, type ServiceCategory, type Treatment } from "@/lib/config";
import {
  generarSlots,
  getOcupadasPorFecha,
  getServiciosOcupadosPorFecha,
  PROFESIONALES,
  saveCita,
  getBonoActivoByTelefono,
  getTarjetaRegaloActivaByTelefono,
  canjearTarjetaRegalo,
  getServicios,
  searchClientes,
  type Cliente,
  type Bono,
  type TarjetaRegalo,
  type Profesional,
} from "@/lib/storage";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: ServiceCategory | null;
  /** Si se pasa, el modal se abre directo al formulario con ese tratamiento fijado. */
  preselectedTreatment?: (Treatment & { categoria: ServiceCategory }) | null;
  /** Se llama tras guardar una cita correctamente. Útil para refrescar listas. */
  onSuccess?: () => void;
};

const HORAS = generarSlots();
const SLOT_MIN = 15;
const horasSet = new Set(HORAS);
const toMin = (h: string) => {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
};
const toHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const CATEGORIAS: { key: ServiceCategory; label: string; icon: typeof Sparkles; desc: string }[] = [
  { key: "facial", label: "Faciales", icon: Sparkles, desc: "Limpieza, radiofrecuencia, dermapen…" },
  { key: "corporal", label: "Corporales", icon: Waves, desc: "Maderoterapia, criolipolisis, masajes…" },
  { key: "depilacion", label: "Depilación", icon: Scissors, desc: "Láser diodo, hilo…" },
  { key: "mirada", label: "Manicura y Pestañas", icon: Hand, desc: "Lifting, laminado, manicura…" },
  { key: "micropigmentacion", label: "Micropigmentación", icon: Brush, desc: "Microblading, eyeliner, lips…" },
];

export function BookingModal({ open, onOpenChange, category, preselectedTreatment, onSuccess }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [fecha, setFecha] = useState<Date | undefined>();
  const [hora, setHora] = useState<string>("");
  const [profesional, setProfesional] = useState<Profesional>("cristina");
  const [stage, setStage] = useState<"form" | "loading" | "done">("form");
  const [cat, setCat] = useState<ServiceCategory | null>(null);
  const [ocupadas, setOcupadas] = useState<Map<string, Set<Profesional>>>(new Map());
  const [serviciosOcupados, setServiciosOcupados] = useState<Map<string, Set<string>>>(new Map());
  const [bonoActivo, setBonoActivo] = useState<Bono | null>(null);
  const [usarBono, setUsarBono] = useState(false);
  const [tarjetaActiva, setTarjetaActiva] = useState<TarjetaRegalo | null>(null);
  const [usarTarjeta, setUsarTarjeta] = useState(false);
  const [serviciosDb, setServiciosDb] = useState<Treatment[]>([]);
  const [clienteSugs, setClienteSugs] = useState<Cliente[]>([]);
  const [showSugs, setShowSugs] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);

  const data = cat ? {
    titulo: SERVICIOS[cat].titulo,
    treatments: serviciosDb.filter((s) => (s as Treatment & { categoria?: string }).categoria === cat),
  } : null;
  const fixedTreatment = preselectedTreatment ?? null;

  useEffect(() => {
    if (open) {
      setStage("form");
      setNombre("");
      setTelefono("");
      setEmail("");
      setObservaciones("");
      setFecha(undefined);
      setHora("");
      setProfesional("cristina");
      setBonoActivo(null);
      setUsarBono(false);
      setTarjetaActiva(null);
      setUsarTarjeta(false);
      setClienteSugs([]);
      setShowSugs(false);
      setClienteId(null);
      if (preselectedTreatment) {
        setCat(preselectedTreatment.categoria);
        setSelected([preselectedTreatment.nombre]);
      } else {
        setCat(category ?? null);
        setSelected([]);
      }
      getServicios().then((items) => {
        setServiciosDb(items.map((s) => ({ nombre: s.nombre, precio: s.precio, categoria: s.categoria } as Treatment & { categoria: string })));
      });
    }
  }, [open, category, preselectedTreatment]);

  // Autocompletar clientes mientras se escribe el nombre (prefijo)
  useEffect(() => {
    if (!showSugs) return;
    const t = setTimeout(async () => {
      const list = await searchClientes(nombre.trim(), 500);
      setClienteSugs(list);
    }, nombre.trim().length === 0 ? 0 : 180);
    return () => clearTimeout(t);
  }, [nombre, showSugs]);

  const pickCliente = (c: Cliente) => {
    const full = [c.nombre, c.apellido_1, c.apellido_2].filter(Boolean).join(" ");
    setNombre(full);
    if (c.telefono) setTelefono(c.telefono);
    if (c.email) setEmail(c.email);
    setClienteId(c.id);
    setShowSugs(false);
  };

  const total = useMemo(
    () =>
      (data?.treatments ?? [])
        .filter((t) => selected.includes(t.nombre))
        .reduce((s, t) => s + t.precio, 0),
    [selected, data]
  );

  // Buscar bono activo cuando hay teléfono
  useEffect(() => {
    const t = telefono.trim();
    if (t.length < 6) {
      setBonoActivo(null);
      setUsarBono(false);
      setTarjetaActiva(null);
      setUsarTarjeta(false);
      return;
    }
    let cancel = false;
    getBonoActivoByTelefono(t).then((b) => {
      if (!cancel) setBonoActivo(b);
    });
    getTarjetaRegaloActivaByTelefono(t).then((tr) => {
      if (!cancel) setTarjetaActiva(tr);
    });
    return () => { cancel = true; };
  }, [telefono]);

  const fechaIsoSel = fecha ? format(fecha, "yyyy-MM-dd") : "";
  useEffect(() => {
    if (!fechaIsoSel) {
      setOcupadas(new Map());
      setServiciosOcupados(new Map());
      return;
    }
    getOcupadasPorFecha(fechaIsoSel).then(setOcupadas);
    getServiciosOcupadosPorFecha(fechaIsoSel).then(setServiciosOcupados);
  }, [fechaIsoSel]);

  // Si cambia profesional u hora y deja de estar disponible, limpiar hora.
  useEffect(() => {
    if (hora && ocupadas.get(hora)?.has(profesional)) {
      setHora("");
    }
  }, [profesional, ocupadas, hora]);

  const toggle = (n: string) =>
    setSelected((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const confirm = async () => {
    if (!nombre.trim()) return toast.error("Indica tu nombre");
    if (!telefono.trim()) return toast.error("Indica tu teléfono");
    if (!fecha) return toast.error("Selecciona una fecha");
    if (!hora) return toast.error("Selecciona una hora");
    if (selected.length === 0) return toast.error("Selecciona al menos un tratamiento");

    const fechaIso = format(fecha, "yyyy-MM-dd");
    setStage("loading");
    const res = await saveCita({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim() || null,
      observaciones: observaciones.trim() || null,
      clienteId: clienteId,
      servicios: selected,
      fecha: fechaIso,
      hora,
      profesional,
      total: (usarBono && bonoActivo) || (usarTarjeta && tarjetaActiva) ? 0 : total,
      bonoId: usarBono && bonoActivo ? bonoActivo.id : null,
    });
    if (!res.ok) {
      setStage("form");
      return toast.error(res.error, {
        description: "Por favor, elige otro horario disponible.",
      });
    }
    if (usarTarjeta && tarjetaActiva) {
      await canjearTarjetaRegalo(tarjetaActiva.id);
    }
    setStage("done");
    onSuccess?.();
    toast.success("Cita confirmada", {
      description: `${format(fecha, "d 'de' MMMM", { locale: es })} · ${hora} · ${
        profesional === "cristina" ? "Cristina" : "Jessie"
      }`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg max-h-[92vh] overflow-y-auto gold-shadow">
        {stage === "done" ? (
          <ConfirmAnimation onClose={() => onOpenChange(false)} />
        ) : (!cat || !data) && !fixedTreatment ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-3xl text-foreground">
                Reserva tu Cita
              </DialogTitle>
              <DialogDescription>
                Elige la categoría de tratamiento para continuar
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 pt-2">
              {CATEGORIAS.map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  onClick={() => setCat(key)}
                  className="group flex items-center gap-4 rounded-xl border border-primary/20 bg-background/40 px-5 py-4 text-left transition-all hover:border-primary hover:bg-primary/5 hover:translate-x-1"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="size-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-lg text-foreground">{label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{desc}</span>
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Elegir
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {!fixedTreatment && (
                  <button
                    onClick={() => { setCat(null); setSelected([]); }}
                    className="p-1.5 -ml-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Volver"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                )}
                <DialogTitle className="font-display text-3xl text-foreground">
                  Reserva tu Cita
                </DialogTitle>
              </div>
              <DialogDescription>
                {fixedTreatment ? `${fixedTreatment.nombre}` : `${data?.titulo} · selecciona tratamientos`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <div className="relative">
                    <Input
                      value={nombre}
                      onChange={(e) => { setNombre(e.target.value); setShowSugs(true); setClienteId(null); }}
                      onFocus={() => setShowSugs(true)}
                      onBlur={() => setTimeout(() => setShowSugs(false), 150)}
                      placeholder="Tu nombre"
                      autoComplete="off"
                    />
                    {showSugs && clienteSugs.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border border-primary/30 bg-popover shadow-xl">
                        {clienteSugs.map((c) => {
                          const full = [c.nombre, c.apellido_1, c.apellido_2].filter(Boolean).join(" ");
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); pickCliente(c); }}
                              className="w-full text-left px-3 py-2 hover:bg-primary/10 border-b border-primary/10 last:border-0"
                            >
                              <span className="block text-sm text-foreground truncate">
                                {full || "Sin nombre"}
                                {c.alias && <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-primary">({c.alias})</span>}
                              </span>
                              <span className="block text-[11px] text-muted-foreground truncate">
                                {c.telefono ?? "Sin teléfono"}{c.email ? ` · ${c.email}` : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="600 000 000" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email <span className="text-muted-foreground font-normal">(opcional, para recordatorio)</span></Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-primary">Profesional / Cabina</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PROFESIONALES.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setProfesional(p.key)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                        profesional === p.key
                          ? "border-primary bg-primary text-primary-foreground shadow"
                          : "border-primary/25 bg-background/40 text-foreground hover:border-primary/60 hover:bg-primary/5"
                      )}
                    >
                      <User className="size-4" />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start font-normal", !fecha && "text-muted-foreground")}>
                        <CalendarIcon className="size-4" />
                        {fecha ? format(fecha, "d MMM yyyy", { locale: es }) : "Elige día"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fecha}
                        onSelect={setFecha}
                        locale={es}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start font-normal", !hora && "text-muted-foreground")}>
                        {hora || "Elige hora"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="start">
                      <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto">
                        {HORAS.map((h) => {
                          const ocupada = ocupadas.get(h)?.has(profesional) ?? false;
                          const servSet = serviciosOcupados.get(h);
                          const choca = !!servSet && selected.some((s) => servSet.has(s));
                          // Duración requerida según tratamientos seleccionados
                          const durRequerida = selected.length === 0
                            ? SLOT_MIN
                            : Math.max(
                                SLOT_MIN,
                                ...selected.map((n) => {
                                  const s = serviciosDb.find((x) => x.nombre === n) as (Treatment & { duracion_min?: number }) | undefined;
                                  return s?.duracion_min ?? 45;
                                })
                              );
                          // No cabe si algún slot consecutivo está fuera de horario u ocupado
                          let noCabe = false;
                          const startMin = toMin(h);
                          for (let t = startMin; t < startMin + durRequerida; t += SLOT_MIN) {
                            const hh = toHHMM(t);
                            if (!horasSet.has(hh)) { noCabe = true; break; }
                            if (t !== startMin && ocupadas.get(hh)?.has(profesional)) { noCabe = true; break; }
                          }
                          const bloqueada = ocupada || choca || noCabe;
                          return (
                            <button
                              key={h}
                              disabled={bloqueada}
                              onClick={() => {
                                setHora(h);
                                document.body.click();
                              }}
                              className={cn(
                                "text-xs py-1.5 rounded-md transition-colors relative",
                                bloqueada
                                  ? "bg-muted text-muted-foreground/40 line-through cursor-not-allowed"
                                  : hora === h
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-primary/10 text-foreground"
                              )}
                              title={
                                choca
                                  ? "Tratamiento ya reservado a esta hora"
                                  : ocupada
                                  ? `Ocupada con ${profesional}`
                                  : noCabe
                                  ? "No hay tiempo suficiente para este tratamiento"
                                  : ""
                              }
                            >
                              {h}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-primary">Tratamientos</Label>
                {fixedTreatment ? (
                  <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                    <span className="text-sm text-foreground">{fixedTreatment.nombre}</span>
                    <span className="font-semibold text-primary">
                      {fixedTreatment.desde ? "desde " : ""}{fixedTreatment.precio}€
                    </span>
                  </div>
                ) : (
                  <div className="divide-y divide-primary/15 rounded-xl border border-primary/15 bg-background/40">
                    {data!.treatments.length === 0 && (
                      <div className="px-4 py-3 text-xs text-muted-foreground">
                        No hay tratamientos en esta categoría. Añádelos desde Precios.
                      </div>
                    )}
                    {data!.treatments.map((t) => {
                      const checked = selected.includes(t.nombre);
                      return (
                        <label
                          key={t.nombre}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors",
                            checked ? "bg-primary/10" : "hover:bg-primary/5"
                          )}
                        >
                          <span className="flex items-center gap-3 text-sm">
                            <Checkbox checked={checked} onCheckedChange={() => toggle(t.nombre)} />
                            {t.nombre}
                          </span>
                          <span className="font-semibold text-primary">{t.precio}€</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Observaciones <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Alguna alergia, preferencia o nota para Cristina…"
                  rows={2}
                />
              </div>

              {bonoActivo && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
                    Bono disponible
                  </p>
                  <p className="text-sm text-foreground">
                    {bonoActivo.nombre} · <strong>{bonoActivo.sesionesRestantes}</strong> sesiones restantes
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={usarBono}
                      onCheckedChange={(v) => { setUsarBono(!!v); if (v) setUsarTarjeta(false); }}
                    />
                    Usar 1 sesión del bono en esta cita
                  </label>
                </div>
              )}

              {tarjetaActiva && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
                    Tarjeta regalo disponible
                  </p>
                  <p className="text-sm text-foreground">
                    {tarjetaActiva.codigo} · {tarjetaActiva.servicios_nombres.join(", ")}
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={usarTarjeta}
                      onCheckedChange={(v) => { setUsarTarjeta(!!v); if (v) setUsarBono(false); }}
                    />
                    Pagar esta cita con la tarjeta regalo
                  </label>
                </div>
              )}

              <div className="flex items-center justify-between bg-foreground text-background rounded-xl px-5 py-4">
                <span className="text-xs uppercase tracking-[0.25em] text-primary">Total</span>
                <span className="font-display text-2xl">
                  {usarBono && bonoActivo ? "Bono" : usarTarjeta && tarjetaActiva ? "Tarjeta regalo" : `${total}€`}
                </span>
              </div>

              <Button
                onClick={confirm}
                disabled={stage === "loading"}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-[0.25em] font-semibold"
              >
                {stage === "loading" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Procesando…
                  </>
                ) : (
                  "Confirmar Cita"
                )}
              </Button>

              {stage === "loading" && (
                <div className="space-y-2">
                  <div className="h-2 rounded-full skeleton-shimmer" />
                  <div className="h-2 rounded-full skeleton-shimmer w-2/3" />
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConfirmAnimation({ onClose }: { onClose: () => void }) {
  return (
    <div className="py-10 flex flex-col items-center text-center animate-fade-up">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120" className="text-primary">
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="confirm-circle"
          />
          <path
            d="M40 62 L55 78 L82 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="confirm-check"
          />
        </svg>
      </div>
      <h3 className="font-display text-3xl mt-6 text-foreground">Cita Confirmada</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        Tu cita ha sido registrada correctamente. Cristina te esperará el día reservado.
      </p>
      <div className="flex gap-2 mt-6">
        <Check className="size-4 text-primary" />
        <span className="text-xs uppercase tracking-[0.2em] text-primary">Reserva registrada</span>
      </div>
      <Button
        onClick={onClose}
        variant="outline"
        className="mt-8 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
      >
        Cerrar
      </Button>
    </div>
  );
}