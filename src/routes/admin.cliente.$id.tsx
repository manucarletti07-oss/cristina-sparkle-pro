import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Save, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import {
  getClienteById,
  getCitasByCliente,
  getBonosByCliente,
  getFotosCliente,
  uploadFotoCliente,
  deleteFotoCliente,
  updateClienteObservaciones,
  type Cliente,
  type Cita,
  type Bono,
  type FotoCliente,
} from "@/lib/storage";

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

  const onUpload = async (file: File) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    if (!ok) return toast.error("Formato no permitido (jpg, png, webp)");
    const res = await uploadFotoCliente(id, file);
    if (!res.ok) return toast.error(res.error);
    toast.success("Foto subida");
    load();
  };

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
          <h3 className="font-display text-2xl mb-4">Historial de citas ({citas.length})</h3>
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