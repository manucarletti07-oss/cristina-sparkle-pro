import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, User as UserIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchClientes, type Cliente } from "@/lib/storage";

export function ClienteSearchDropdown() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await searchClientes(term, 12);
      setResults(r);
      setLoading(false);
      setOpen(true);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (c: Cliente) => {
    setOpen(false);
    setQ("");
    navigate({ to: "/admin/cliente/$id", params: { id: c.id } });
  };

  return (
    <div ref={ref} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Buscar cliente por nombre, apellido o teléfono…"
        className="h-12 pl-11 pr-10 bg-background/5 border-primary/30 text-background placeholder:text-background/40 focus-visible:ring-primary"
      />
      {q && (
        <button
          type="button"
          onClick={() => { setQ(""); setResults([]); setOpen(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-background/50 hover:text-primary"
          aria-label="Limpiar"
        >
          <X className="size-4" />
        </button>
      )}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-2 max-h-80 overflow-auto rounded-2xl border border-primary/30 bg-foreground shadow-xl">
          {loading && (
            <div className="p-4 text-xs text-background/60">Buscando…</div>
          )}
          {!loading && results.length === 0 && q.trim().length >= 2 && (
            <div className="p-4 text-xs text-background/60">Sin resultados.</div>
          )}
          {!loading && results.map((c) => {
            const fullName = [c.nombre, c.apellido_1, c.apellido_2].filter(Boolean).join(" ");
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => pick(c)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-primary/10 border-b border-primary/10 last:border-0"
              >
                <span className="size-8 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                  <UserIcon className="size-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-background truncate">{fullName || "Sin nombre"}</span>
                  <span className="block text-xs text-background/55 truncate">
                    {c.telefono ?? "Sin teléfono"}{c.alias ? ` · ${c.alias}` : ""}
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary">Ver ficha</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}