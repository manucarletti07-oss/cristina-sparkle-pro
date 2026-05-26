import { supabase } from "@/integrations/supabase/client";

export type Profesional = "cristina" | "jessie";

export const PROFESIONALES: { key: Profesional; label: string }[] = [
  { key: "cristina", label: "Cristina" },
  { key: "jessie", label: "Jessie" },
];

// Horario: 10:00–20:00, slots de 45 min, parada 14:00–15:00.
export const HORARIO = {
  apertura: "10:00",
  cierre: "20:00",
  comidaInicio: "14:00",
  comidaFin: "15:00",
  duracionMin: 45,
};

function toMin(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}
function toHHMM(m: number) {
  const hh = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function generarSlots(): string[] {
  const slots: string[] = [];
  const start = toMin(HORARIO.apertura);
  const end = toMin(HORARIO.cierre);
  const cInicio = toMin(HORARIO.comidaInicio);
  const cFin = toMin(HORARIO.comidaFin);
  for (let t = start; t + HORARIO.duracionMin <= end; t += HORARIO.duracionMin) {
    const fin = t + HORARIO.duracionMin;
    // excluir slots que se solapan con la comida
    if (fin > cInicio && t < cFin) continue;
    slots.push(toHHMM(t));
  }
  return slots;
}

export type Cita = {
  id: string;
  nombre: string;
  telefono: string;
  email?: string | null;
  observaciones?: string | null;
  clienteId?: string | null;
  servicios: string[];
  fecha: string;
  hora: string;
  profesional: Profesional;
  total: number;
  estado: "pendiente" | "realizada";
  createdAt: string;
};

type Row = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  observaciones: string | null;
  cliente_id: string | null;
  servicios: string[];
  fecha: string;
  hora: string;
  profesional: Profesional;
  total: number;
  estado: "pendiente" | "realizada";
  created_at: string;
};

const toCita = (r: Row): Cita => ({
  id: r.id,
  nombre: r.nombre,
  telefono: r.telefono,
  email: r.email,
  observaciones: r.observaciones,
  clienteId: r.cliente_id,
  servicios: r.servicios ?? [],
  fecha: r.fecha,
  hora: r.hora,
  profesional: (r.profesional ?? "cristina") as Profesional,
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

/**
 * Devuelve, por cada hora del día, el set de profesionales ocupadas.
 */
export async function getOcupadasPorFecha(
  fecha: string
): Promise<Map<string, Set<Profesional>>> {
  const { data, error } = await supabase
    .from("citas")
    .select("hora, profesional")
    .eq("fecha", fecha)
    .eq("estado", "pendiente");
  const map = new Map<string, Set<Profesional>>();
  if (error || !data) return map;
  for (const r of data as { hora: string; profesional: Profesional }[]) {
    const set = map.get(r.hora) ?? new Set<Profesional>();
    set.add(r.profesional);
    map.set(r.hora, set);
  }
  return map;
}

export async function saveCita(
  cita: Omit<Cita, "id" | "createdAt" | "estado">
): Promise<{ ok: true; cita: Cita } | { ok: false; error: string }> {
  // Busca o crea cliente por teléfono
  const tel = cita.telefono.trim();
  let clienteId = cita.clienteId ?? null;
  if (!clienteId && tel) {
    const { data: existing } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefono", tel)
      .maybeSingle();
    if (existing) clienteId = existing.id;
    else {
      const { data: nuevo } = await supabase
        .from("clientes")
        .insert({ nombre: cita.nombre.trim(), telefono: tel, email: cita.email ?? null })
        .select("id")
        .single();
      clienteId = nuevo?.id ?? null;
    }
  }

  const { data, error } = await supabase
    .from("citas")
    .insert({
      nombre: cita.nombre,
      telefono: cita.telefono,
      email: cita.email ?? null,
      observaciones: cita.observaciones ?? null,
      cliente_id: clienteId,
      servicios: cita.servicios,
      fecha: cita.fecha,
      hora: cita.hora,
      profesional: cita.profesional,
      total: cita.total,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Esa hora ya está ocupada con esa profesional" };
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

// ====== CLIENTES ======
export type Cliente = {
  id: string;
  nombre: string;
  apellido_1: string | null;
  apellido_2: string | null;
  telefono: string | null;
  email: string | null;
  alias: string | null;
  observaciones: string | null;
};

export async function searchClientes(q: string, limit = 8): Promise<Cliente[]> {
  const term = q.trim();
  if (!term) return [];
  const { data, error } = await supabase
    .from("clientes")
    .select("id,nombre,apellido_1,apellido_2,telefono,email,alias,observaciones")
    .or(
      `nombre.ilike.%${term}%,alias.ilike.%${term}%,telefono.ilike.%${term}%,apellido_1.ilike.%${term}%`
    )
    .limit(limit);
  if (error) {
    console.error(error);
    return [];
  }
  return (data as Cliente[]) ?? [];
}