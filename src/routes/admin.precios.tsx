import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2, Pencil, X, Check, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrivateAccessGate } from "@/components/PrivateAccessGate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import {
  getServicios,
  updateServicio,
  createServicio,
  deleteServicio,
  getBonosCatalogo,
  updateBonoCatalogo,
  createBonoCatalogo,
  deleteBonoCatalogo,
  type Servicio,
  type BonoCatalogo,
} from "@/lib/storage";

const SESSION_KEY = "private_precios_unlocked";

export const Route = createFileRoute("/admin/precios")({
  head: () => ({
    meta: [
      { title: "Gestión de precios · Panel" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Precios,
});

function Precios() {
  const { isAuth, loading } = useAuth();
  const navigate = useNavigate();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [bonos, setBonos] = useState<BonoCatalogo[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBonoId, setEditingBonoId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ nombre: string; categoria: string; precio: string; duracion: string; agenda: "unica" | "compartida" }>({
    nombre: "",
    categoria: "",
    precio: "",
    duracion: "",
    agenda: "unica",
  });
  const [nuevo, setNuevo] = useState<{ nombre: string; categoria: string; precio: string; duracion: string; agenda: "unica" | "compartida" }>({
    nombre: "",
    categoria: "",
    precio: "",
    duracion: "",
    agenda: "unica",
  });
  const [draftBono, setDraftBono] = useState<{ nombre: string; sesiones: string; precio: string }>({
    nombre: "",
    sesiones: "",
    precio: "",
  });
  const [nuevoBono, setNuevoBono] = useState<{ nombre: string; sesiones: string; precio: string }>({
    nombre: "",
    sesiones: "",
    precio: "",
  });

  useEffect(() => {
    if (loading) return;
    if (!isAuth) { navigate({ to: "/" }); return; }
  }, [loading, isAuth, navigate]);

  useEffect(() => {
    if (!unlocked) return;
    getServicios().then(setServicios);
    getBonosCatalogo().then(setBonos);
  }, [unlocked]);

  const startEdit = (s: Servicio) => {
    setEditingId(s.id);
    setDraft({ nombre: s.nombre, categoria: s.categoria, precio: String(s.precio), duracion: String(s.duracion_min ?? 45), agenda: s.agenda ?? "unica" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ nombre: "", categoria: "", precio: "", duracion: "", agenda: "unica" });
  };

  const saveEdit = async (s: Servicio) => {
    const precio = Number(draft.precio);
    const duracion_min = Number(draft.duracion);
    if (!draft.nombre.trim()) return toast.error("Nombre obligatorio");
    if (!draft.categoria.trim()) return toast.error("Categoría obligatoria");
    if (Number.isNaN(precio) || precio < 0) return toast.error("Precio inválido");
    if (!Number.isInteger(duracion_min) || duracion_min <= 0) return toast.error("Duración inválida");
    const res = await updateServicio(s.id, {
      nombre: draft.nombre.trim(),
      categoria: draft.categoria.trim().toLowerCase(),
      precio,
      duracion_min,
      agenda: draft.agenda,
    });
    if (!res.ok) return toast.error(res.error);
    toast.success("Servicio actualizado");
    setServicios((arr) =>
      arr.map((x) => (x.id === s.id ? { ...x, nombre: draft.nombre.trim(), categoria: draft.categoria.trim().toLowerCase(), precio, duracion_min, agenda: draft.agenda } : x))
    );
    cancelEdit();
  };

  const remove = async (s: Servicio) => {
    const res = await deleteServicio(s.id);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Eliminado: ${s.nombre}`);
    setServicios((arr) => arr.filter((x) => x.id !== s.id));
  };

  const create = async () => {
    const precio = Number(nuevo.precio);
    const duracion_min = Number(nuevo.duracion);
    if (!nuevo.nombre.trim()) return toast.error("Nombre obligatorio");
    if (!nuevo.categoria.trim()) return toast.error("Categoría obligatoria");
    if (Number.isNaN(precio) || precio < 0) return toast.error("Precio inválido");
    if (!Number.isInteger(duracion_min) || duracion_min <= 0) return toast.error("Duración inválida");
    const res = await createServicio({
      nombre: nuevo.nombre,
      categoria: nuevo.categoria,
      precio,
      duracion_min,
      agenda: nuevo.agenda,
    });
    if (!res.ok) return toast.error(res.error);
    toast.success("Servicio creado");
    setServicios((arr) => [...arr, res.servicio]);
    setNuevo({ nombre: "", categoria: "", precio: "", duracion: "", agenda: "unica" });
  };

  const startEditBono = (b: BonoCatalogo) => {
    setEditingBonoId(b.id);
    setDraftBono({ nombre: b.nombre, sesiones: String(b.sesiones), precio: String(b.precio) });
  };

  const cancelEditBono = () => {
    setEditingBonoId(null);
    setDraftBono({ nombre: "", sesiones: "", precio: "" });
  };

  const saveBono = async (b: BonoCatalogo) => {
    const sesiones = Number(draftBono.sesiones);
    const precio = Number(draftBono.precio);
    if (!draftBono.nombre.trim()) return toast.error("Nombre obligatorio");
    if (!Number.isInteger(sesiones) || sesiones <= 0) return toast.error("Sesiones inválidas");
    if (Number.isNaN(precio) || precio < 0) return toast.error("Precio inválido");
    const res = await updateBonoCatalogo(b.id, { nombre: draftBono.nombre.trim(), sesiones, precio });
    if (!res.ok) return toast.error(res.error);
    toast.success("Bono actualizado");
    setBonos((arr) => arr.map((x) => (x.id === b.id ? { ...x, nombre: draftBono.nombre.trim(), sesiones, precio } : x)));
    cancelEditBono();
  };

  const createBono = async () => {
    const sesiones = Number(nuevoBono.sesiones);
    const precio = Number(nuevoBono.precio);
    if (!nuevoBono.nombre.trim()) return toast.error("Nombre obligatorio");
    if (!Number.isInteger(sesiones) || sesiones <= 0) return toast.error("Sesiones inválidas");
    if (Number.isNaN(precio) || precio < 0) return toast.error("Precio inválido");
    const res = await createBonoCatalogo({ nombre: nuevoBono.nombre.trim(), sesiones, precio });
    if (!res.ok) return toast.error(res.error);
    toast.success("Bono creado");
    setBonos((arr) => [...arr, res.bono]);
    setNuevoBono({ nombre: "", sesiones: "", precio: "" });
  };

  const removeBono = async (b: BonoCatalogo) => {
    const res = await deleteBonoCatalogo(b.id);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Bono eliminado: ${b.nombre}`);
    setBonos((arr) => arr.filter((x) => x.id !== b.id));
  };

  if (loading || !isAuth) return null;

  if (!unlocked) {
    return <PrivateAccessGate title="Precios · Acceso privado" sessionKey={SESSION_KEY} onUnlocked={() => setUnlocked(true)} />;
  }

  const byCat = servicios.reduce<Record<string, Servicio[]>>((acc, s) => {
    (acc[s.categoria] = acc[s.categoria] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-foreground text-background">
      <header className="border-b border-primary/20 sticky top-0 z-30 backdrop-blur-xl bg-foreground/95">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.2em]">
            <ArrowLeft className="size-4" /> Panel
          </Link>
          <h1 className="font-display text-xl">Gestión de precios</h1>
          <span />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <section className="glass-dark rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Gift className="size-5 text-primary" /> Bonos
          </h2>
          <div className="grid sm:grid-cols-[1fr_120px_140px_auto] gap-3 items-end">
            <Input value={nuevoBono.nombre} onChange={(e) => setNuevoBono((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del bono" className="bg-background/5 border-primary/30 text-background" />
            <Input type="number" min={1} value={nuevoBono.sesiones} onChange={(e) => setNuevoBono((p) => ({ ...p, sesiones: e.target.value }))} placeholder="Sesiones" className="bg-background/5 border-primary/30 text-background" />
            <Input type="number" min={0} value={nuevoBono.precio} onChange={(e) => setNuevoBono((p) => ({ ...p, precio: e.target.value }))} placeholder="Precio" className="bg-background/5 border-primary/30 text-background" />
            <Button onClick={createBono} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10"><Plus className="size-4" /> Crear</Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-primary/10">
            <table className="w-full text-sm">
              <thead className="bg-primary/10 text-primary text-[11px] uppercase tracking-[0.2em]"><tr><th className="text-left p-3">Bono</th><th className="text-left p-3">Sesiones</th><th className="text-left p-3">Precio</th><th className="text-right p-3"></th></tr></thead>
              <tbody>
                {bonos.map((b) => {
                  const isEditing = editingBonoId === b.id;
                  return (
                    <tr key={b.id} className="border-t border-primary/10">
                      <td className="p-3">{isEditing ? <Input value={draftBono.nombre} onChange={(e) => setDraftBono((p) => ({ ...p, nombre: e.target.value }))} className="bg-background/5 border-primary/30 text-background h-9" /> : b.nombre}</td>
                      <td className="p-3">{isEditing ? <Input type="number" min={1} value={draftBono.sesiones} onChange={(e) => setDraftBono((p) => ({ ...p, sesiones: e.target.value }))} className="bg-background/5 border-primary/30 text-background h-9" /> : b.sesiones}</td>
                      <td className="p-3">{isEditing ? <Input type="number" min={0} value={draftBono.precio} onChange={(e) => setDraftBono((p) => ({ ...p, precio: e.target.value }))} className="bg-background/5 border-primary/30 text-background h-9" /> : `${b.precio}€`}</td>
                      <td className="p-3 text-right"><div className="flex justify-end gap-2">{isEditing ? <><Button size="sm" onClick={() => saveBono(b)} className="bg-primary text-primary-foreground hover:bg-primary/90"><Check className="size-4" /> Guardar</Button><Button size="sm" variant="outline" onClick={cancelEditBono} className="border-primary/30 text-primary bg-transparent"><X className="size-4" /></Button></> : <><Button size="sm" variant="outline" onClick={() => startEditBono(b)} className="border-primary/30 text-primary bg-transparent"><Pencil className="size-4" /> Modificar</Button><Button size="sm" variant="outline" onClick={() => removeBono(b)} className="border-destructive/40 text-destructive bg-transparent hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="size-4" /></Button></>}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* NUEVO SERVICIO */}
        <section className="glass-dark rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Plus className="size-5 text-primary" /> Añadir servicio
          </h2>
          <div className="grid sm:grid-cols-[1fr_1fr_120px_120px_140px_auto] gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-background/70 text-[10px] uppercase tracking-[0.2em]">Nombre</Label>
              <Input
                value={nuevo.nombre}
                onChange={(e) => setNuevo((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej. Limpieza facial"
                className="bg-background/5 border-primary/30 text-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-background/70 text-[10px] uppercase tracking-[0.2em]">Categoría</Label>
              <Input
                value={nuevo.categoria}
                onChange={(e) => setNuevo((p) => ({ ...p, categoria: e.target.value }))}
                placeholder="Ej. facial"
                className="bg-background/5 border-primary/30 text-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-background/70 text-[10px] uppercase tracking-[0.2em]">Precio (€)</Label>
              <Input
                type="number"
                min={0}
                value={nuevo.precio}
                onChange={(e) => setNuevo((p) => ({ ...p, precio: e.target.value }))}
                className="bg-background/5 border-primary/30 text-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-background/70 text-[10px] uppercase tracking-[0.2em]">Duración (min)</Label>
              <Input
                type="number"
                min={1}
                value={nuevo.duracion}
                onChange={(e) => setNuevo((p) => ({ ...p, duracion: e.target.value }))}
                placeholder="45"
                className="bg-background/5 border-primary/30 text-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-background/70 text-[10px] uppercase tracking-[0.2em]">Agenda</Label>
              <Select value={nuevo.agenda} onValueChange={(v) => setNuevo((p) => ({ ...p, agenda: v as "unica" | "compartida" }))}>
                <SelectTrigger className="bg-background/5 border-primary/30 text-background h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unica">Única</SelectItem>
                  <SelectItem value="compartida">Compartida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={create} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10">
              <Plus className="size-4" /> Crear
            </Button>
          </div>
        </section>

        {Object.entries(byCat).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="font-display text-2xl mb-4 capitalize">{cat}</h2>
            <div className="glass-dark rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-primary/10 text-primary text-[11px] uppercase tracking-[0.2em]">
                  <tr>
                    <th className="text-left p-3">Servicio</th>
                    <th className="text-left p-3 w-[160px]">Categoría</th>
                    <th className="text-left p-3 w-[160px]">Precio (€)</th>
                    <th className="text-left p-3 w-[140px]">Duración (min)</th>
                    <th className="text-left p-3 w-[140px]">Agenda</th>
                    <th className="text-right p-3 w-[200px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => {
                    const isEditing = editingId === s.id;
                    return (
                      <tr key={s.id} className="border-t border-primary/10">
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={draft.nombre}
                              onChange={(e) => setDraft((p) => ({ ...p, nombre: e.target.value }))}
                              className="bg-background/5 border-primary/30 text-background h-9"
                            />
                          ) : (
                            s.nombre
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={draft.categoria}
                              onChange={(e) => setDraft((p) => ({ ...p, categoria: e.target.value }))}
                              className="bg-background/5 border-primary/30 text-background h-9"
                            />
                          ) : (
                            <span className="capitalize text-background/70">{s.categoria}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              min={0}
                              value={draft.precio}
                              onChange={(e) => setDraft((p) => ({ ...p, precio: e.target.value }))}
                              className="bg-background/5 border-primary/30 text-background h-9"
                            />
                          ) : (
                            <span>{s.precio}€</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              min={1}
                              value={draft.duracion}
                              onChange={(e) => setDraft((p) => ({ ...p, duracion: e.target.value }))}
                              className="bg-background/5 border-primary/30 text-background h-9"
                            />
                          ) : (
                            <span>{s.duracion_min} min</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Select value={draft.agenda} onValueChange={(v) => setDraft((p) => ({ ...p, agenda: v as "unica" | "compartida" }))}>
                              <SelectTrigger className="bg-background/5 border-primary/30 text-background h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unica">Única</SelectItem>
                                <SelectItem value="compartida">Compartida</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="capitalize text-background/70">{s.agenda === "compartida" ? "Compartida" : "Única"}</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button size="sm" onClick={() => saveEdit(s)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                  <Check className="size-4" /> Guardar
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit} className="border-primary/30 text-primary bg-transparent">
                                  <X className="size-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => startEdit(s)} className="border-primary/30 text-primary bg-transparent">
                                  <Pencil className="size-4" /> Editar
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="border-destructive/40 text-destructive bg-transparent hover:bg-destructive hover:text-destructive-foreground">
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Eliminar “{s.nombre}”</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => remove(s)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {servicios.length === 0 && (
          <p className="text-center text-background/50 text-sm">Aún no hay servicios. Crea el primero arriba.</p>
        )}
      </main>
    </div>
  );
}