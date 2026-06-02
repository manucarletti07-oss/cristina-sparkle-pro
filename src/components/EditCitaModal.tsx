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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  generarSlots,
  getOcupadasPorFecha,
  getServicios,
  PROFESIONALES,
  updateCita,
  type Cita,
  type Profesional,
  type Servicio,
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
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  useEffect(() => {
    if (open && cita) {
      setNombre(cita.nombre);
      setTelefono(cita.telefono);
      setFecha(parseISO(cita.fecha));
      setHora(cita.hora);
      setProfesional(cita.profesional);
      setSeleccionados(cita.servicios ?? []);
      getServicios().then((s) => setServicios(s.filter((x) => x.activo)));
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
    if (seleccionados.length === 0) return toast.error("Selecciona al menos un tratamiento");
    const total = servicios
      .filter((s) => seleccionados.includes(s.nombre))
      .reduce((acc, s) => acc + Number(s.precio ?? 0), 0);
    setSaving(true);
    const res = await updateCita(cita.id, {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      fecha: fechaIso,
      hora,
      profesional,
      servicios: seleccionados,
      total,
    });
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Cita actualizada");
    onSaved?.();
    onOpenChange(false);
  };

  const toggleServicio = (n: string) =>
    setSeleccionados((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const serviciosPorCategoria = servicios.reduce<Record<string, Servicio[]>>((acc, s) => {
    (acc[s.categoria] ??= []).push(s);
    return acc;
  }, {});

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
            <Label className="text-xs uppercase tracking-[0.2em] text-primary">Tratamientos</Label>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-primary/25 bg-background/40 p-2 space-y-2">
              {Object.keys(serviciosPorCategoria).length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1">Cargando…</p>
              ) : (
                Object.entries(serviciosPorCategoria).map(([cat, lista]) => (
                  <div key={cat}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70 px-1 mb-1">{cat}</p>
                    <div className="space-y-1">
                      {lista.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-primary/5 cursor-pointer text-sm"
                        >
                          <Checkbox
                            checked={seleccionados.includes(s.nombre)}
                            onCheckedChange={() => toggleServicio(s.nombre)}
                          />
                          <span className="flex-1">{s.nombre}</span>
                          <span className="text-xs text-muted-foreground">{s.duracion_min}min · {s.precio}€</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
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