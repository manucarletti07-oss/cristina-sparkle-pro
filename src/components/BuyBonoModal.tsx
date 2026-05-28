import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { comprarBonoCatalogo, getBonosCatalogo, type BonoCatalogo } from "@/lib/storage";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function BuyBonoModal({ open, onOpenChange }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"form" | "loading" | "done">("form");
  const [catalogo, setCatalogo] = useState<BonoCatalogo[]>([]);
  const [catalogoId, setCatalogoId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setStage("form");
      setNombre("");
      setTelefono("");
      setEmail("");
      setCatalogoId("");
      getBonosCatalogo().then((c) => { setCatalogo(c); if (c[0]) setCatalogoId(c[0].id); });
    }
  }, [open]);

  const selected = catalogo.find((c) => c.id === catalogoId);

  const confirm = async () => {
    if (!nombre.trim() || !telefono.trim() || !catalogoId) {
      return toast.error("Indica nombre y teléfono");
    }
    setStage("loading");
    const res = await comprarBonoCatalogo({
      catalogoId,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim() || null,
    });
    if (!res.ok) {
      setStage("form");
      return toast.error(res.error);
    }
    setStage("done");
    toast.success("Bono comprado", { description: `${selected?.sesiones ?? ""} sesiones añadidas.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md gold-shadow">
        {stage === "done" ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-primary/15 flex items-center justify-center">
              <Check className="size-8 text-primary" />
            </div>
            <h3 className="font-display text-2xl text-foreground">Bono activado</h3>
            <p className="text-sm text-muted-foreground">
              Ya puedes usar tus sesiones al reservar cualquier cita con el mismo teléfono.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-2">Cerrar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-foreground">
                Comprar bono
              </DialogTitle>
              <DialogDescription>
                Elige el bono y aplícalo al reservar con tu teléfono.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Bono</Label>
                <Select value={catalogoId} onValueChange={setCatalogoId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un bono" /></SelectTrigger>
                  <SelectContent>
                    {catalogo.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} · {c.sesiones} sesiones · {c.precio}€
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="600 000 000" />
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
              </div>
              <Button
                onClick={confirm}
                disabled={stage === "loading"}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-[0.25em]"
              >
                {stage === "loading" ? (
                  <><Loader2 className="size-4 animate-spin" /> Procesando…</>
                ) : (
                  selected ? `Comprar · ${selected.precio}€` : "Comprar bono"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}