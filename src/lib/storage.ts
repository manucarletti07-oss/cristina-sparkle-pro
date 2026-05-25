import { supabase } from "@/integrations/supabase/client";

export type Cita = {
  id: string;
  nombre: string;
  telefono: string;
  servicios: string[];
  fecha: string;
  hora: string;
  total: number;
  estado: "pendiente" | "realizada";
  createdAt: string;
};

type Row = {
  id: string;
  nombre: string;
  telefono: string;
  servicios: string[];
  fecha: string;
  hora: string;
  total: number;
  estado: "pendiente" | "realizada";
  created_at: string;
};

const toCita = (r: Row): Cita => ({
  id: r.id,
  nombre: r.nombre,
  telefono: r.telefono,
  servicios: r.servicios ?? [],
  fecha: r.fecha,
  hora: r.hora,
  total: Number(r.total),
  estado: r.estado,
  createdAt: r.created_at,
});

export async function getCitas(): Promise<Cita[]> {
  const { data, error } = await supabase
    .from("citas")
    .select("*")
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return (data as Row[]).map(toCita);
}

export async function getOcupadasPorFecha(fecha: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("citas")
    .select("hora")
    .eq("fecha", fecha)
    .eq("estado", "pendiente");
  if (error || !data) return new Set();
  return new Set(data.map((r: { hora: string }) => r.hora));
}

export async function saveCita(
  cita: Omit<Cita, "id" | "createdAt" | "estado">
): Promise<{ ok: true; cita: Cita } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("citas")
    .insert({
      nombre: cita.nombre,
      telefono: cita.telefono,
      servicios: cita.servicios,
      fecha: cita.fecha,
      hora: cita.hora,
      total: cita.total,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Esa hora ya está ocupada" };
    return { ok: false, error: error.message };
  }
  return { ok: true, cita: toCita(data as Row) };
}

export async function updateCita(id: string, patch: Partial<Pick<Cita, "estado">>) {
  const { error } = await supabase.from("citas").update(patch).eq("id", id);
  if (error) console.error(error);
}

export async function deleteCita(id: string) {
  const { error } = await supabase.from("citas").delete().eq("id", id);
  if (error) console.error(error);
}