import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, MessageCircle, Save, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  getClienteById,
  getCitasByCliente,
  getBonosByCliente,
  getFotosCliente,
  uploadFotoCliente,
  deleteFotoCliente,
  updateClienteObservaciones,
  updateCliente,
  deleteCliente,
  type Cliente,
  type Cita,
  type Bono,
  type FotoCliente,
} from "@/lib/storage";
import { openWhatsAppReminder } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/cliente/$id")({
  head: () => ({
    meta: [
      { title: "Ficha de cliente" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ClienteFicha,
});

function ClienteFicha() {
  const { id } = Route.useParams();
  const { isAuth, loading } = useAuth();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [fotos, setFotos] = useState<FotoCliente[]>([]);
  const [obs, setObs] = useState("");
  const [savingObs, setSavingObs] = useState(false);
  const [edit, setEdit] = useState({
    nombre: "",
    apellido_1: "",
    apellido_2: "",
    telefono: "",
    email: "",
    alias: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    Promise.all([
      getClienteById(id),
      getCitasByCliente(id),
      getBonosByCliente(id),
      getFotosCliente(id),
    ]).then(([c, ci, b, f]) => {
      setCliente(c);
      setObs(c?.observaciones ?? "");
      if (c) {
        setEdit({
          nombre: c.nombre ?? "",
          apellido_1: c.apellido_1 ?? "",
          apellido_2: c.apellido_2 ?? "",
          telefono: c.telefono ?? "",
          email: c.email ?? "",
          alias: c.alias ?? "",
        });
      }
      setCitas(ci);
      setBonos(b);
      setFotos(f);
    });
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuth) { navigate({ to: "/" }); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuth, id]);

  if (loading || !isAuth) return null;
  if (!cliente) return <div className="min-h-screen bg-foreground text-background p-10">Cargando…</div>;

  const saveObs = async () => {
    setSavingObs(true);
    const res = await updateClienteObservaciones(id, obs);
    setSavingObs(false);
    if (!res.ok) toast.error(res.error);
    else toast.success("Observaciones guardadas");
  };

  const saveEdit = async () => {
    if (!edit.nombre.trim()) return toast.error("El nombre es obligatorio");
    setSavingEdit(true);
    const res = await updateCliente(id, {
      nombre: edit.nombre.trim(),
      apellido_1: edit.apellido_1.trim() || null,
      apellido_2: edit.apellido_2.trim() || null,
      telefono: edit.telefono.trim() || null,
      email: edit.email.trim() || null,
      alias: edit.alias.trim() || null,
    });
    setSavingEdit(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Cliente actualizado");
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deleteCliente(id);
    setDeleting(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Cliente eliminado");
    navigate({ to: "/admin" });
  };

  const onUpload = async (file: File) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    if (!ok) return toast.error("Formato no permitido (jpg, png, webp)");
    const res = await uploadFotoCliente(id, file);
    if (!res.ok) return toast.error(res.error);
    toast.success("Foto subida");
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const recordatorioCita =
    [...citas]
      .filter((c) => c.estado === "pendiente" && c.fecha >= today)
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))[0] ?? citas[0];

  return (
    <div className="min-h-screen bg-foreground text-background">
      <header className="border-b border-primary/20 sticky top-0 z-30 backdrop-blur-xl bg-foreground/95">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.2em]">
            <ArrowLeft className="size-4" /> Panel
          </Link>
          <h1 className="font-display text-xl">Ficha de cliente</h1>
          <span />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section>
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Cliente</p>
          <h2 className="font-display text-4xl mt-1">
            {cliente.nombre} {cliente.apellido_1 ?? ""} {cliente.apellido_2 ?? ""}
          </h2>
          <p className="text-sm text-background/60 mt-2">
            {cliente.telefono ?? "—"} · {cliente.email ?? "Sin email"}{cliente.alias ? ` · alias: ${cliente.alias}` : ""}
          </p>
        </section>

        <section className="glass-dark rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 className="font-display text-xl">Editar datos del cliente</h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive/50 text-destructive bg-transparent hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="size-4" /> Eliminar cliente
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará <strong>{cliente.nombre} {cliente.apellido_1 ?? ""}</strong> de forma permanente. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Eliminando…" : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-background/70">Nombre</Label>
              <Input value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} className="bg-background/5 border-primary/30 text-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-background/70">Alias</Label>
              <Input value={edit.alias} onChange={(e) => setEdit({ ...edit, alias: e.target.value })} className="bg-background/5 border-primary/30 text-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-background/70">Apellido 1</Label>
              <Input value={edit.apellido_1} onChange={(e) => setEdit({ ...edit, apellido_1: e.target.value })} className="bg-background/5 border-primary/30 text-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-background/70">Apellido 2</Label>
              <Input value={edit.apellido_2} onChange={(e) => setEdit({ ...edit, apellido_2: e.target.value })} className="bg-background/5 border-primary/30 text-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-background/70">Teléfono</Label>
              <Input value={edit.telefono} onChange={(e) => setEdit({ ...edit, telefono: e.target.value })} className="bg-background/5 border-primary/30 text-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-background/70">Email</Label>
              <Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} className="bg-background/5 border-primary/30 text-background" />
            </div>
          </div>
          <Button onClick={saveEdit} disabled={savingEdit} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="size-4" /> {savingEdit ? "Guardando…" : "Guardar cambios"}
          </Button>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="glass-dark rounded-2xl p-5">
            <h3 className="font-display text-xl mb-3">Observaciones internas</h3>
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={6}
              placeholder="Notas privadas sobre el cliente…"
              className="bg-background/5 border-primary/30 text-background"
            />
            <Button onClick={saveObs} disabled={savingObs} className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="size-4" /> {savingObs ? "Guardando…" : "Guardar"}
            </Button>
          </div>

          <div className="glass-dark rounded-2xl p-5">
            <h3 className="font-display text-xl mb-3">Bonos del cliente</h3>
            {bonos.length === 0 ? (
              <p className="text-sm text-background/50">Sin bonos.</p>
            ) : (
              <div className="space-y-2">
                {bonos.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm border-b border-primary/10 py-2">
                    <div>
                      <p className="font-medium">{b.nombre}</p>
                      <p className="text-xs text-background/50">Compra: {format(parseISO(b.fechaCompra), "d MMM yyyy", { locale: es })}</p>
                    </div>
                    <Badge className={b.estado === "agotado" ? "bg-destructive/15 text-destructive border-destructive/40" : "bg-primary/15 text-primary border-primary/40"}>
                      {b.sesionesRestantes}/{b.totalSesiones}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-display text-2xl">Historial de citas ({citas.length})</h3>
            {recordatorioCita && (
              <Button
                type="button"
                onClick={() => openWhatsAppReminder({ telefono: cliente.telefono, fecha: recordatorioCita.fecha, hora: recordatorioCita.hora })}
                className="rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg shadow-whatsapp/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-whatsapp/90 hover:shadow-xl hover:shadow-whatsapp/30"
              >
                <MessageCircle className="size-4" /> WhatsApp próxima cita
              </Button>
            )}
          </div>
          <div className="glass-dark rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-primary/10 text-primary text-[11px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-left p-3">Hora</th>
                  <th className="text-left p-3">Servicios</th>
                  <th className="text-left p-3">Profesional</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-right p-3">Importe</th>
                </tr>
              </thead>
              <tbody>
                {citas.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-background/50">Sin citas registradas.</td></tr>
                ) : citas.map((c) => (
                  <tr key={c.id} className="border-t border-primary/10">
                    <td className="p-3">{format(parseISO(c.fecha), "d MMM yyyy", { locale: es })}</td>
                    <td className="p-3">{c.hora}</td>
                    <td className="p-3 text-background/70">{c.servicios.join(", ")}</td>
                    <td className="p-3 capitalize">{c.profesional}</td>
                    <td className="p-3">
                      <Badge className={c.estado === "realizada" ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/40" : "bg-primary/15 text-primary border-primary/40"}>
                        {c.estado}
                      </Badge>
                    </td>
                    <td className="p-3 text-right text-primary font-semibold">{c.precio_cobrado ?? c.total}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl">Fotos ({fotos.length})</h3>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.currentTarget.value = ""; }}
            />
            <Button onClick={() => fileRef.current?.click()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Upload className="size-4" /> Subir foto
            </Button>
          </div>
          {fotos.length === 0 ? (
            <div className="glass-dark rounded-2xl p-10 text-center text-background/50 flex flex-col items-center gap-2">
              <ImageIcon className="size-8 text-primary/60" /> Sin fotos.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fotos.map((f) => (
                <div key={f.id} className="glass-dark rounded-xl overflow-hidden group relative">
                  {f.url ? (
                    <img src={f.url} alt={f.descripcion ?? "foto cliente"} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-background/5" />
                  )}
                  <div className="p-2 flex items-center justify-between text-xs">
                    <span className="text-background/50">{format(parseISO(f.created_at), "d MMM yyyy", { locale: es })}</span>
                    <button
                      onClick={async () => { await deleteFotoCliente(f); load(); }}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}