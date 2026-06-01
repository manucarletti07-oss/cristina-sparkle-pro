import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, User as UserIcon, X, CalendarCheck, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchClientesConHistorial, type ClienteConHistorial } from "@/lib/storage";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function ClienteSearchDropdown() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ClienteConHistorial[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await searchClientesConHistorial(term, 500);
      setResults(r);
      setLoading(false);
      setOpen(true);
    }, term.length === 0 ? 0 : 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (c: ClienteConHistorial) => {
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
        onFocus={() => setOpen(true)}
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
          {!loading && results.length === 0 && (
            <div className="p-4 text-xs text-background/60">Sin resultados.</div>
          )}
          {!loading && results.map((c) => {
            const fullName = [c.nombre, c.apellido_1, c.apellido_2].filter(Boolean).join(" ");
            const proxima = c.proximaCita
              ? `${format(parseISO(c.proximaCita.fecha), "d MMM", { locale: es })} · ${c.proximaCita.hora}`
              : null;
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
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-sm text-background truncate">{fullName || "Sin nombre"}</span>
                    {c.alias && (
                      <span className="text-[10px] uppercase tracking-[0.15em] text-primary/80 border border-primary/30 rounded-full px-1.5">
                        {c.alias}
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-background/55 truncate">
                    {c.telefono ?? "Sin teléfono"} · ID {c.id.slice(0, 8)}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-300">
                      <CalendarCheck className="size-3" /> {c.futuras} futura{c.futuras === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1 text-background/60">
                      <History className="size-3" /> {c.pasadas} realizada{c.pasadas === 1 ? "" : "s"}
                    </span>
                    {proxima && (
                      <span className="text-primary/80">Próx: {proxima}</span>
                    )}
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