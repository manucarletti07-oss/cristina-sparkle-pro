import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CalendarPlus } from "lucide-react";
import { SERVICIOS, type ServiceCategory, type Treatment } from "@/lib/config";
import { getServicios } from "@/lib/storage";

const DESCRIPCIONES: Record<ServiceCategory, string> = {
  facial: "Tratamientos faciales avanzados para revitalizar, limpiar y rejuvenecer tu piel. Cada protocolo se diseña a medida según las necesidades de tu rostro.",
  corporal: "Tecnología y técnicas manuales para remodelar, reafirmar y relajar. Resultados visibles combinando aparatología avanzada con masaje terapéutico.",
  depilacion: "Métodos eficaces y duraderos para una piel suave. Láser diodo de última generación e hilo tradicional para zonas delicadas.",
  mirada: "Pequeños detalles que transforman tu mirada y tus manos. Acabados naturales, duraderos y de salón profesional.",
  micropigmentacion: "Técnicas avanzadas de micropigmentación para realzar tu rostro con resultados duraderos y naturales.",
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: ServiceCategory | null;
  onBook?: (treatment: Treatment & { categoria: ServiceCategory }) => void;
};

export function ServiceInfoModal({ open, onOpenChange, category, onBook }: Props) {
  const [serviciosDb, setServiciosDb] = useState<(Treatment & { categoria: string })[]>([]);
  useEffect(() => {
    if (open) getServicios().then((items) => setServiciosDb(items.map((s) => ({ nombre: s.nombre, precio: s.precio, categoria: s.categoria }))));
  }, [open]);
  const dbTreatments = category
    ? serviciosDb.filter(
        (s) => s.categoria === category && s.nombre.trim().toLowerCase() !== "presoterapia extra",
      )
    : [];
  const data = category ? { ...SERVICIOS[category], treatments: dbTreatments } : null;
  if (!data || !category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg max-h-[92vh] overflow-y-auto gold-shadow">
        <DialogHeader>
          <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
            <Sparkles className="size-3" /> Tratamientos disponibles
          </span>
          <DialogTitle className="font-display text-3xl text-foreground">
            {data.titulo}
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground/75 leading-relaxed pt-1">
            {DESCRIPCIONES[category]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <ul className="space-y-2">
            {data.treatments.length === 0 && (
              <li className="rounded-xl border border-primary/15 bg-background/40 px-4 py-3 text-xs text-muted-foreground">
                No hay tratamientos disponibles en esta categoría.
              </li>
            )}
            {data.treatments.map((t) => (
              <li
                key={t.nombre}
                className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-background/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{t.nombre}</p>
                  <p className="text-xs text-primary font-semibold mt-0.5">
                    {t.desde ? "desde " : ""}{t.precio}€
                  </p>
                </div>
                {onBook && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onBook({ ...t, categoria: category });
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] uppercase tracking-[0.2em] shrink-0"
                  >
                    <CalendarPlus className="size-3.5" /> Reservar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}