import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  generarSlots,
  getOcupadasPorFecha,
  PROFESIONALES,
  updateCita,
  type Cita,
  type Profesional,
} from "@/lib/storage";

const HORAS = generarSlots();

type Props = {
  cita: Cita | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
};

export function EditCitaModal({ cita, open, onOpenChange, onSaved }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState<Date | undefined>();
  const [hora, setHora] = useState("");
  const [profesional, setProfesional] = useState<Profesional>("cristina");
  const [ocupadas, setOcupadas] = useState<Map<string, Set<Profesional>>>(new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && cita) {
      setNombre(cita.nombre);
      setTelefono(cita.telefono);
      setFecha(parseISO(cita.fecha));
      setHora(cita.hora);
      setProfesional(cita.profesional);
    }
  }, [open, cita]);

  const fechaIso = fecha ? format(fecha, "yyyy-MM-dd") : "";
  useEffect(() => {
    if (!fechaIso) return;
    getOcupadasPorFecha(fechaIso).then(setOcupadas);
  }, [fechaIso]);

  const guardar = async () => {
    if (!cita) return;
    if (!fecha || !hora) return toast.error("Selecciona fecha y hora");
    setSaving(true);
    const res = await updateCita(cita.id, {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      fecha: fechaIso,
      hora,
      profesional,
    });
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Cita actualizada");
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Modificar cita</DialogTitle>
          <DialogDescription>Ajusta fecha, hora o profesional</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.2em] text-primary">Profesional</Label>
            <div className="grid grid-cols-2 gap-2">
              {PROFESIONALES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setProfesional(p.key)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                    profesional === p.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/25 bg-background/40 hover:border-primary/60"
                  )}
                >
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
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="size-4" />
                    {fecha ? format(fecha, "d MMM yyyy", { locale: es }) : "Elige día"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fecha} onSelect={setFecha} locale={es} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">{hora || "Hora"}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto">
                    {HORAS.map((h) => {
                      const ocupada = ocupadas.get(h)?.has(profesional) && !(cita && cita.hora === h && cita.profesional === profesional && cita.fecha === fechaIso);
                      return (
                        <button
                          key={h}
                          disabled={ocupada}
                          onClick={() => { setHora(h); document.body.click(); }}
                          className={cn(
                            "text-xs py-1.5 rounded-md transition-colors",
                            ocupada ? "bg-muted text-muted-foreground/40 line-through cursor-not-allowed"
                            : hora === h ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                          )}
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
          <Button onClick={guardar} disabled={saving} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-[0.25em]">
            {saving ? <><Loader2 className="size-4 animate-spin" /> Guardando…</> : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}