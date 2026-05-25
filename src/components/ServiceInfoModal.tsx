import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { SERVICIOS, type ServiceCategory } from "@/lib/config";

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
  onBook: () => void;
};

export function ServiceInfoModal({ open, onOpenChange, category, onBook }: Props) {
  const data = category ? SERVICIOS[category] : null;
  if (!data || !category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg max-h-[92vh] overflow-y-auto gold-shadow">
        <DialogHeader>
          <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
            <Sparkles className="size-3" /> Información
          </span>
          <DialogTitle className="font-display text-3xl text-foreground">
            {data.titulo}
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground/75 leading-relaxed pt-1">
            {DESCRIPCIONES[category]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <p className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold">
            Lo que incluye
          </p>
          <ul className="divide-y divide-primary/15 rounded-xl border border-primary/15 bg-background/40">
            {data.treatments.map((t) => (
              <li key={t.nombre} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-foreground">{t.nombre}</span>
                <span className="text-xs text-muted-foreground">Disponible</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground italic pt-1">
            Para ver precios y reservar, pulsa el botón de cita previa.
          </p>
        </div>

        <Button
          onClick={() => {
            onOpenChange(false);
            onBook();
          }}
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-[0.25em] font-semibold mt-4"
        >
          Pedir cita previa
        </Button>
      </DialogContent>
    </Dialog>
  );
}