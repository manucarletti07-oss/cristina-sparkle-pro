import { useEffect, useRef, useState } from "react";
import { Loader2, Check, Search, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  comprarBonoCatalogo,
  getBonosCatalogo,
  searchClientes,
  type BonoCatalogo,
  type Cliente,
} from "@/lib/storage";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function BuyBonoAdminModal({ open, onOpenChange }: Props) {
  const [catalogo, setCatalogo] = useState<BonoCatalogo[]>([]);
  const [catalogoId, setCatalogoId] = useState<string>("");
  const [stage, setStage] = useState<"form" | "loading" | "done">("form");

  const [query, setQuery] = useState("");
  const [sugs, setSugs] = useState<Cliente[]>([]);
  const [showSugs, setShowSugs] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStage("form");
      setCatalogoId("");
      setQuery(""); setSugs([]); setCliente(null);
      setNombre(""); setTelefono(""); setEmail("");
      getBonosCatalogo().then((c) => { setCatalogo(c); if (c[0]) setCatalogoId(c[0].id); });
    }
  }, [open]);

  useEffect(() => {
    if (!showSugs) return;
    const t = setTimeout(async () => {
      const list = await searchClientes(query.trim(), 500);
      setSugs(list);
    }, query.trim().length === 0 ? 0 : 180);
    return () => clearTimeout(t);
  }, [query, showSugs]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSugs(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick = (c: Cliente) => {
    setCliente(c);
    const full = [c.nombre, c.apellido_1, c.apellido_2].filter(Boolean).join(" ");
    setQuery(full);
    setNombre(full);
    setTelefono(c.telefono ?? "");
    setEmail(c.email ?? "");
    setShowSugs(false);
  };

  const selected = catalogo.find((c) => c.id === catalogoId);

  const confirm = async () => {
    const finalNombre = (cliente ? nombre : (nombre || query)).trim();
    if (!finalNombre || !telefono.trim() || !catalogoId) {
      return toast.error("Selecciona cliente y bono");
    }
    setStage("loading");
    const res = await comprarBonoCatalogo({
      catalogoId,
      nombre: finalNombre,
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
      <DialogContent className="glass max-w-2xl gold-shadow max-h-[90vh] overflow-y-auto">
        {stage === "done" ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-primary/15 flex items-center justify-center">
              <Check className="size-8 text-primary" />
            </div>
            <h3 className="font-display text-2xl text-foreground">Bono activado</h3>
            <p className="text-sm text-muted-foreground">
              El bono se ha asignado al cliente seleccionado.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-2">Cerrar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-foreground">Comprar bono</DialogTitle>
              <DialogDescription>Selecciona el bono y el cliente al que se le asigna.</DialogDescription>
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

              <div className="space-y-2" ref={wrapRef}>
                <Label>Cliente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none" />
                  <Input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setCliente(null); setShowSugs(true); }}
                    onFocus={() => setShowSugs(true)}
                    placeholder="Buscar cliente por nombre o teléfono…"
                    className="pl-9 pr-9"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => { setQuery(""); setCliente(null); setNombre(""); setTelefono(""); setEmail(""); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                  {showSugs && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-xl border border-primary/30 bg-background shadow-xl">
                      {sugs.length === 0 ? (
                        <div className="p-3 text-xs text-muted-foreground">Sin resultados.</div>
                      ) : sugs.map((c) => {
                        const full = [c.nombre, c.apellido_1, c.apellido_2].filter(Boolean).join(" ");
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => pick(c)}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-primary/10 border-b border-primary/10 last:border-0"
                          >
                            <UserIcon className="size-3.5 text-primary shrink-0" />
                            <span className="flex-1 min-w-0 text-sm truncate">{full || "Sin nombre"}</span>
                            {c.alias && (
                              <span className="text-[11px] uppercase tracking-[0.08em] text-primary/90 border border-primary/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                                {c.alias}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground truncate shrink-0">{c.telefono ?? ""}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="600 000 000" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opcional" />
                </div>
              </div>

              {!cliente && nombre === "" && (
                <p className="text-[11px] text-muted-foreground">
                  Si el cliente es nuevo, escribe su nombre completo en el buscador y completa teléfono.
                </p>
              )}
              {!cliente && query && (
                <div className="space-y-2">
                  <Label>Nombre (cliente nuevo)</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" />
                </div>
              )}

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