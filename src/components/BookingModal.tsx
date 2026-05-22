import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SERVICIOS, type ServiceCategory } from "@/lib/config";
import { getCitas, isSlotTaken, saveCita } from "@/lib/storage";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: ServiceCategory | null;
};

const HORAS = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

export function BookingModal({ open, onOpenChange, category }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [fecha, setFecha] = useState<Date | undefined>();
  const [hora, setHora] = useState<string>("");
  const [stage, setStage] = useState<"form" | "loading" | "done">("form");

  const cat = category ?? "facial";
  const data = SERVICIOS[cat];

  useEffect(() => {
    if (open) {
      setStage("form");
      setSelected([]);
      setNombre("");
      setTelefono("");
      setFecha(undefined);
      setHora("");
    }
  }, [open, category]);

  const total = useMemo(
    () =>
      data.treatments
        .filter((t) => selected.includes(t.nombre))
        .reduce((s, t) => s + t.precio, 0),
    [selected, data]
  );

  const fechaIsoSel = fecha ? format(fecha, "yyyy-MM-dd") : "";
  const horasOcupadas = useMemo(() => {
    if (!fechaIsoSel) return new Set<string>();
    return new Set(
      getCitas()
        .filter((c) => c.fecha === fechaIsoSel && c.estado !== "realizada")
        .map((c) => c.hora)
    );
  }, [fechaIsoSel, open]);

  const toggle = (n: string) =>
    setSelected((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const confirm = async () => {
    if (!nombre.trim()) return toast.error("Indica tu nombre");
    if (!telefono.trim()) return toast.error("Indica tu teléfono");
    if (!fecha) return toast.error("Selecciona una fecha");
    if (!hora) return toast.error("Selecciona una hora");
    if (selected.length === 0) return toast.error("Selecciona al menos un tratamiento");

    const fechaIso = format(fecha, "yyyy-MM-dd");
    if (isSlotTaken(fechaIso, hora)) {
      return toast.error("Esa hora ya está ocupada", {
        description: "Por favor, elige otro horario disponible.",
      });
    }

    setStage("loading");
    await new Promise((r) => setTimeout(r, 900));

    saveCita({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      servicios: selected,
      fecha: fechaIso,
      hora,
      total,
    });

    setStage("done");
    toast.success("Cita confirmada", {
      description: `${format(fecha, "d 'de' MMMM", { locale: es })} · ${hora}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg max-h-[92vh] overflow-y-auto gold-shadow">
        {stage === "done" ? (
          <ConfirmAnimation onClose={() => onOpenChange(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-3xl text-foreground">
                Reserva tu Cita
              </DialogTitle>
              <DialogDescription>
                {data.titulo} · selecciona tratamientos y elige fecha
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
                          const ocupada = horasOcupadas.has(h);
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
                              title={ocupada ? "Hora ocupada" : ""}
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
                <div className="divide-y divide-primary/15 rounded-xl border border-primary/15 bg-background/40">
                  {data.treatments.map((t) => {
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