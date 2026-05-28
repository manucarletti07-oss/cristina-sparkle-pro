import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { getServicios, updateServicioPrecio, type Servicio } from "@/lib/storage";

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
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading) return;
    if (!isAuth) { navigate({ to: "/" }); return; }
    getServicios().then(setServicios);
  }, [loading, isAuth, navigate]);

  const save = async (s: Servicio) => {
    const raw = edits[s.id];
    if (raw === undefined) return;
    const precio = Number(raw);
    if (Number.isNaN(precio) || precio < 0) return toast.error("Precio inválido");
    const res = await updateServicioPrecio(s.id, precio);
    if (!res.ok) return toast.error(res.error);
    toast.success(`${s.nombre}: ${precio}€`);
    setServicios((arr) => arr.map((x) => (x.id === s.id ? { ...x, precio } : x)));
    setEdits((e) => { const n = { ...e }; delete n[s.id]; return n; });
  };

  if (loading || !isAuth) return null;

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
        {Object.entries(byCat).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="font-display text-2xl mb-4 capitalize">{cat}</h2>
            <div className="glass-dark rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-primary/10 text-primary text-[11px] uppercase tracking-[0.2em]">
                  <tr>
                    <th className="text-left p-3">Servicio</th>
                    <th className="text-left p-3 w-[160px]">Precio (€)</th>
                    <th className="text-right p-3 w-[120px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id} className="border-t border-primary/10">
                      <td className="p-3">{s.nombre}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min={0}
                          value={edits[s.id] ?? String(s.precio)}
                          onChange={(e) => setEdits((p) => ({ ...p, [s.id]: e.target.value }))}
                          className="bg-background/5 border-primary/30 text-background h-9"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => save(s)}
                          disabled={edits[s.id] === undefined || edits[s.id] === String(s.precio)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Save className="size-4" /> Guardar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}