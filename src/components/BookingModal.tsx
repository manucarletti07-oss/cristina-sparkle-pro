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
  PROFESIONALES,
  saveCita,
  type Profesional,
} from "@/lib/storage";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: ServiceCategory | null;
  /** Si se pasa, el modal se abre directo al formulario con ese tratamiento fijado. */
  preselectedTreatment?: (Treatment & { categoria: ServiceCategory }) | null;
};

const HORAS = generarSlots();

const CATEGORIAS: { key: ServiceCategory; label: string; icon: typeof Sparkles; desc: string }[] = [
  { key: "facial", label: "Faciales", icon: Sparkles, desc: "Limpieza, radiofrecuencia, dermapen…" },
  { key: "corporal", label: "Corporales", icon: Waves, desc: "Maderoterapia, criolipolisis, masajes…" },
  { key: "depilacion", label: "Depilación", icon: Scissors, desc: "Láser diodo, hilo…" },
  { key: "mirada", label: "Manicura y Pestañas", icon: Hand, desc: "Lifting, laminado, manicura…" },
  { key: "micropigmentacion", label: "Micropigmentación", icon: Brush, desc: "Microblading, eyeliner, lips…" },
];

export function BookingModal({ open, onOpenChange, category, preselectedTreatment }: Props) {
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

  const data = cat ? SERVICIOS[cat] : null;
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
      if (preselectedTreatment) {
        setCat(preselectedTreatment.categoria);
        setSelected([preselectedTreatment.nombre]);
      } else {
        setCat(category ?? null);
        setSelected([]);
      }
    }
  }, [open, category, preselectedTreatment]);

  const total = useMemo(
    () =>
      (data?.treatments ?? [])
        .filter((t) => selected.includes(t.nombre))
        .reduce((s, t) => s + t.precio, 0),
    [selected, data]
  );

  const fechaIsoSel = fecha ? format(fecha, "yyyy-MM-dd") : "";
  useEffect(() => {
    if (!fechaIsoSel) {
      setOcupadas(new Map());
      return;
    }
    getOcupadasPorFecha(fechaIsoSel).then(setOcupadas);
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
      servicios: selected,
      fecha: fechaIso,
      hora,
      profesional,
      total,
    });
    if (!res.ok) {
      setStage("form");
      return toast.error(res.error, {
        description: "Por favor, elige otro horario disponible.",
      });
    }
    setStage("done");
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
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
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
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
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
                          return (
                            <button
                              key={h}
                              disabled={ocupada}
                              onClick={() => {
                                setHora(h);
                                document.body.click();
                              }}
                              className={cn(
                                "text-xs py-1.5 rounded-md transition-colors relative",
                                ocupada
                                  ? "bg-muted text-muted-foreground/40 line-through cursor-not-allowed"
                                  : hora === h
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-primary/10 text-foreground"
                              )}
                              title={ocupada ? `Ocupada con ${profesional}` : ""}
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

              <div className="flex items-center justify-between bg-foreground text-background rounded-xl px-5 py-4">
                <span className="text-xs uppercase tracking-[0.25em] text-primary">Total</span>
                <span className="font-display text-2xl">{total}€</span>
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