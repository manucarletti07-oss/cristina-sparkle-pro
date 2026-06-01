import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Check, Search, User as UserIcon, X, Gift } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  comprarTarjetaRegalo,
  getServicios,
  searchClientes,
  type Servicio,
  type Cliente,
} from "@/lib/storage";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function BuyTarjetaRegaloModal({ open, onOpenChange }: Props) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [seleccion, setSeleccion] = useState<Record<string, boolean>>({});
  const [filtro, setFiltro] = useState("");
  const [stage, setStage] = useState<"form" | "loading" | "done">("form");
  const [codigoGenerado, setCodigoGenerado] = useState<string>("");

  const [query, setQuery] = useState("");
  const [sugs, setSugs] = useState<Cliente[]>([]);
  const [showSugs, setShowSugs] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [precioCustom, setPrecioCustom] = useState<string>("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStage("form");
      setSeleccion({});
      setFiltro("");
      setQuery(""); setSugs([]); setCliente(null);
      setNombre(""); setTelefono(""); setEmail("");
      setObservaciones(""); setPrecioCustom(""); setCodigoGenerado("");
      getServicios().then((s) => setServicios(s.filter((x) => x.activo)));
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

  const seleccionados = useMemo(() => servicios.filter((s) => seleccion[s.id]), [servicios, seleccion]);
  const totalCalc = seleccionados.reduce((s, x) => s + Number(x.precio || 0), 0);
  const precioFinal = precioCustom.trim() !== "" ? Number(precioCustom) : totalCalc;

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return servicios;
    return servicios.filter((s) => s.nombre.toLowerCase().includes(q) || s.categoria.toLowerCase().includes(q));
  }, [servicios, filtro]);

  const porCategoria = useMemo(() => {
    return visibles.reduce<Record<string, Servicio[]>>((acc, s) => {
      (acc[s.categoria] = acc[s.categoria] || []).push(s);
      return acc;
    }, {});
  }, [visibles]);

  const confirm = async () => {
    const finalNombre = (cliente ? nombre : (nombre || query)).trim();
    if (!finalNombre || !telefono.trim()) return toast.error("Indica nombre y teléfono del comprador");
    if (seleccionados.length === 0) return toast.error("Selecciona al menos un tratamiento");
    if (!Number.isFinite(precioFinal) || precioFinal < 0) return toast.error("Precio inválido");
    setStage("loading");
    const res = await comprarTarjetaRegalo({
      nombre: finalNombre,
      telefono: telefono.trim(),
      email: email.trim() || null,
      servicios: seleccionados.map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precio })),
      precio: precioFinal,
      observaciones: observaciones.trim() || null,
    });
    if (!res.ok) {
      setStage("form");
      return toast.error(res.error);
    }
    setCodigoGenerado(res.tarjeta.codigo);
    setStage("done");
    toast.success("Tarjeta regalo creada", { description: `Código: ${res.tarjeta.codigo}` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-2xl gold-shadow max-h-[90vh] overflow-y-auto">
        {stage === "done" ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-primary/15 flex items-center justify-center">
              <Check className="size-8 text-primary" />
            </div>
            <h3 className="font-display text-2xl text-foreground">Tarjeta regalo creada</h3>
            <p className="text-sm text-muted-foreground">Comparte este código con la persona destinataria.</p>
            <div className="mx-auto inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-5 py-3 font-mono text-lg tracking-widest text-primary">
              <Gift className="size-5" /> {codigoGenerado}
            </div>
            <div>
              <Button onClick={() => onOpenChange(false)} className="mt-2">Cerrar</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-foreground flex items-center gap-2">
                <Gift className="size-5 text-primary" /> Comprar tarjeta regalo
              </DialogTitle>
              <DialogDescription>Selecciona los tratamientos incluidos y el cliente que la compra.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Tratamientos incluidos</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none" />
                  <Input
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    placeholder="Filtrar por nombre o categoría…"
                    className="pl-9"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-primary/20 divide-y divide-primary/10">
                  {Object.keys(porCategoria).length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground">Sin resultados.</div>
                  ) : Object.entries(porCategoria).map(([cat, items]) => (
                    <div key={cat} className="py-1">
                      <div className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary/70">{cat}</div>
                      {items.map((s) => (
                        <label key={s.id} className="flex items-center gap-3 px-3 py-1.5 hover:bg-primary/5 cursor-pointer">
                          <Checkbox
                            checked={!!seleccion[s.id]}
                            onCheckedChange={(v) => setSeleccion((p) => ({ ...p, [s.id]: !!v }))}
                          />
                          <span className="flex-1 text-sm">{s.nombre}</span>
                          <span className="text-xs text-muted-foreground">{s.duracion_min} min</span>
                          <span className="text-sm font-medium tabular-nums">{s.precio}€</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                {seleccionados.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {seleccionados.length} tratamiento{seleccionados.length === 1 ? "" : "s"} · suma {totalCalc}€
                  </p>
                )}
              </div>

              <div className="space-y-2" ref={wrapRef}>
                <Label>Cliente comprador</Label>
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
                            <UserIcon className="size-3.5 text-primary" />
                            <span className="flex-1 min-w-0 text-sm truncate">{full || "Sin nombre"}</span>
                            <span className="text-xs text-muted-foreground truncate">{c.telefono ?? ""}</span>
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

              {!cliente && query && (
                <div className="space-y-2">
                  <Label>Nombre (cliente nuevo)</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Precio final (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={precioCustom}
                    onChange={(e) => setPrecioCustom(e.target.value)}
                    placeholder={`${totalCalc} (suma)`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Destinatario, dedicatoria…"
                    className="min-h-[40px] h-10"
                  />
                </div>
              </div>

              <Button
                onClick={confirm}
                disabled={stage === "loading"}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-[0.25em]"
              >
                {stage === "loading" ? (
                  <><Loader2 className="size-4 animate-spin" /> Procesando…</>
                ) : (
                  `Crear tarjeta · ${precioFinal || 0}€`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}