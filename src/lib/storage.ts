import { supabase } from "@/integrations/supabase/client";

export type Profesional = "cristina" | "jenny" | "nerea" | "maquina";

export const PROFESIONALES: { key: Profesional; label: string }[] = [
  { key: "cristina", label: "Cristina" },
  { key: "jenny", label: "Jenny" },
  { key: "nerea", label: "Nerea" },
  { key: "maquina", label: "Máquina (Sala 1)" },
];

// Horario: mañana 10:00–14:00, tarde 16:00–20:00, slots de 15 min.
export const HORARIO = {
  bloques: [
    { inicio: "10:00", fin: "14:00" },
    { inicio: "16:00", fin: "20:00" },
  ],
  duracionMin: 15,
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
  for (const b of HORARIO.bloques) {
    const start = toMin(b.inicio);
    const end = toMin(b.fin);
    for (let t = start; t < end; t += HORARIO.duracionMin) {
      slots.push(toHHMM(t));
    }
  }
  return slots;
}

export type Cita = {
  id: string;
  nombre: string;
  apellido_1: string | null;
  apellido_2: string | null;
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
  bonoId?: string | null;
  createdAt: string;
  cobrada?: boolean;
  precio_cobrado?: number | null;
  fecha_cobro?: string | null;
};

type ClienteJoin = {
  nombre: string;
  apellido_1: string | null;
  apellido_2: string | null;
  telefono: string | null;
  email: string | null;
  alias: string | null;
  observaciones: string | null;
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
  bono_id: string | null;
  created_at: string;
  cobrada?: boolean;
  precio_cobrado?: number | null;
  fecha_cobro?: string | null;
  clientes: ClienteJoin | null;
};

const toCita = (r: Row): Cita => ({
  id: r.id,
  nombre: r.nombre,
  apellido_1: r.clientes?.apellido_1 ?? null,
  apellido_2: r.clientes?.apellido_2 ?? null,
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
  bonoId: r.bono_id,
  createdAt: r.created_at,
  cobrada: r.cobrada ?? false,
  precio_cobrado: r.precio_cobrado ?? null,
  fecha_cobro: r.fecha_cobro ?? null,
});

export async function getCitas(): Promise<Cita[]> {
  const { data, error } = await supabase
    .from("citas")
    .select("*, clientes(nombre, apellido_1, apellido_2, telefono, email, alias, observaciones)")
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
  cita: Omit<Cita, "id" | "createdAt" | "estado" | "apellido_1" | "apellido_2">
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
      bono_id: cita.bonoId ?? null,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Esa hora ya está ocupada con esa profesional" };
    return { ok: false, error: error.message };
  }
  return { ok: true, cita: toCita({ ...(data as any), clientes: null } as Row) };
}

export async function updateCita(
  id: string,
  patch: Partial<Pick<Cita, "estado" | "fecha" | "hora" | "profesional" | "nombre" | "telefono" | "email" | "observaciones">>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from("citas").update(patch).eq("id", id);
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Esa profesional ya tiene una cita a esa hora" };
    return { ok: false, error: error.message };
  }
  return { ok: true };
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
  // Coincidencia desde el INICIO del texto (case insensitive) en nombre/apellidos/alias.
  // El teléfono se busca por contiene (para encontrar por dígitos sueltos).
  // Sanitizamos el término para evitar romper el filtro PostgREST (sin comas ni paréntesis).
  const safe = term.replace(/[(),]/g, " ").trim();
  if (!safe) return [];
  const tokens = safe.split(/\s+/).slice(0, 3); // hasta 3 palabras (ej. "Maria Garcia Lopez")
  let query = supabase
    .from("clientes")
    .select("id,nombre,apellido_1,apellido_2,telefono,email,alias,observaciones");
  // Cada token debe empezar alguno de los campos de nombre o estar en el teléfono.
  for (const t of tokens) {
    const pat = `${t}%`;
    query = query.or(
      `nombre.ilike.${pat},apellido_1.ilike.${pat},apellido_2.ilike.${pat},alias.ilike.${pat},telefono.ilike.%${t}%`
    );
  }
  const { data, error } = await query.order("nombre").limit(limit);
  if (error) {
    console.error(error);
    return [];
  }
  return (data as Cliente[]) ?? [];
}

export type ClienteConHistorial = Cliente & {
  pasadas: number;
  futuras: number;
  proximaCita: { fecha: string; hora: string } | null;
};

export async function searchClientesConHistorial(
  q: string,
  limit = 10
): Promise<ClienteConHistorial[]> {
  const base = await searchClientes(q, limit);
  if (base.length === 0) return [];
  const ids = base.map((c) => c.id);
  const today = new Date().toISOString().slice(0, 10);
  const { data: citas } = await supabase
    .from("citas")
    .select("cliente_id,fecha,hora,estado")
    .in("cliente_id", ids);
  const byCli = new Map<string, { pasadas: number; futuras: number; proxima: { fecha: string; hora: string } | null }>();
  for (const row of (citas ?? []) as { cliente_id: string; fecha: string; hora: string; estado: string }[]) {
    if (!row.cliente_id) continue;
    const entry = byCli.get(row.cliente_id) ?? { pasadas: 0, futuras: 0, proxima: null };
    if (row.fecha < today || row.estado === "realizada") {
      entry.pasadas += 1;
    } else {
      entry.futuras += 1;
      const cur = entry.proxima;
      if (!cur || row.fecha < cur.fecha || (row.fecha === cur.fecha && row.hora < cur.hora)) {
        entry.proxima = { fecha: row.fecha, hora: row.hora };
      }
    }
    byCli.set(row.cliente_id, entry);
  }
  return base.map((c) => {
    const s = byCli.get(c.id);
    return {
      ...c,
      pasadas: s?.pasadas ?? 0,
      futuras: s?.futuras ?? 0,
      proximaCita: s?.proxima ?? null,
    };
  });
}

// ====== INGRESOS POR RANGO ======
export async function getCitasCobradasRango(desde: string, hasta: string): Promise<Cita[]> {
  const { data, error } = await supabase
    .from("citas")
    .select("*, clientes(nombre, apellido_1, apellido_2, telefono, email, alias, observaciones)")
    .eq("cobrada", true)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });
  if (error) return [];
  return (data as Row[]).map(toCita);
}

// ====== BONOS ======
export type Bono = {
  id: string;
  clienteId: string;
  cliente?: Cliente | null;
  nombre: string;
  totalSesiones: number;
  sesionesRestantes: number;
  precio: number;
  estado: "activo" | "agotado";
  fechaCompra: string;
};

type BonoRow = {
  id: string;
  cliente_id: string;
  clientes?: Cliente | null;
  nombre: string;
  total_sesiones: number;
  sesiones_restantes: number;
  precio: number;
  estado: "activo" | "agotado";
  fecha_compra: string;
};

const toBono = (r: BonoRow): Bono => ({
  id: r.id,
  clienteId: r.cliente_id,
  cliente: r.clientes ?? null,
  nombre: r.nombre,
  totalSesiones: r.total_sesiones,
  sesionesRestantes: r.sesiones_restantes,
  precio: Number(r.precio),
  estado: r.estado,
  fechaCompra: r.fecha_compra,
});

/** Busca/crea cliente por teléfono y devuelve su id. */
async function ensureClienteByTelefono(nombre: string, telefono: string, email?: string | null) {
  const tel = telefono.trim();
  if (!tel) return null;
  const { data: existing } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefono", tel)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data: nuevo } = await supabase
    .from("clientes")
    .insert({ nombre: nombre.trim(), telefono: tel, email: email ?? null })
    .select("id")
    .single();
  return (nuevo?.id as string) ?? null;
}

export async function comprarBono(input: {
  nombre: string;
  telefono: string;
  email?: string | null;
}): Promise<{ ok: true; bono: Bono } | { ok: false; error: string }> {
  const clienteId = await ensureClienteByTelefono(input.nombre, input.telefono, input.email);
  if (!clienteId) return { ok: false, error: "Indica nombre y teléfono" };
  const { data, error } = await supabase
    .from("bonos")
    .insert({ cliente_id: clienteId })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, bono: toBono(data as BonoRow) };
}

/** Bono activo del cliente identificado por teléfono. */
export async function getBonoActivoByTelefono(telefono: string): Promise<Bono | null> {
  const tel = telefono.trim();
  if (!tel) return null;
  const { data: cli } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefono", tel)
    .maybeSingle();
  if (!cli) return null;
  const { data } = await supabase
    .from("bonos")
    .select("*")
    .eq("cliente_id", cli.id)
    .eq("estado", "activo")
    .gt("sesiones_restantes", 0)
    .order("fecha_compra", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toBono(data as BonoRow) : null;
}

export async function getBonosByCliente(clienteId: string): Promise<Bono[]> {
  const { data, error } = await supabase
    .from("bonos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("fecha_compra", { ascending: false });
  if (error) return [];
  return (data as BonoRow[]).map(toBono);
}

export async function getBonosPanel(): Promise<Bono[]> {
  const { data, error } = await supabase
    .from("bonos")
    .select("*, clientes(id,nombre,apellido_1,apellido_2,telefono,email,alias,observaciones)")
    .order("fecha_compra", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return (data as BonoRow[]).map(toBono);
}

// ====== SERVICIOS / PRECIOS ======
export type Servicio = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  duracion_min: number;
  requiere_maquina: boolean;
  sala_requerida: number | null;
  activo: boolean;
};

export async function getServicios(): Promise<Servicio[]> {
  const { data, error } = await supabase
    .from("servicios")
    .select("id,nombre,categoria,precio,duracion_min,requiere_maquina,sala_requerida,activo")
    .order("categoria")
    .order("nombre");
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as Servicio[];
}

export async function updateServicioPrecio(id: string, precio: number) {
  const { error } = await supabase.from("servicios").update({ precio }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function updateServicio(id: string, patch: Partial<Omit<Servicio, "id">>) {
  const { error } = await supabase.from("servicios").update(patch).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function createServicio(input: {
  nombre: string;
  categoria: string;
  precio: number;
  duracion_min?: number;
  requiere_maquina?: boolean;
  sala_requerida?: number | null;
}): Promise<{ ok: true; servicio: Servicio } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("servicios")
    .insert({
      nombre: input.nombre.trim(),
      categoria: input.categoria.trim().toLowerCase(),
      precio: input.precio,
      duracion_min: input.duracion_min ?? 45,
      requiere_maquina: input.requiere_maquina ?? false,
      sala_requerida: input.sala_requerida ?? null,
      activo: true,
    })
    .select("id,nombre,categoria,precio,duracion_min,requiere_maquina,sala_requerida,activo")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, servicio: data as Servicio };
}

export async function deleteServicio(id: string) {
  const { error } = await supabase.from("servicios").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// ====== CATÁLOGO DE BONOS ======
export type BonoCatalogo = {
  id: string;
  nombre: string;
  sesiones: number;
  precio: number;
};

export async function getBonosCatalogo(): Promise<BonoCatalogo[]> {
  const { data, error } = await supabase
    .from("bonos_catalogo")
    .select("id,nombre,sesiones,precio")
    .eq("activo", true)
    .order("nombre");
  if (error) return [];
  return (data ?? []) as BonoCatalogo[];
}

export async function comprarBonoCatalogo(input: {
  catalogoId: string;
  nombre: string;
  telefono: string;
  email?: string | null;
}): Promise<{ ok: true; bono: Bono } | { ok: false; error: string }> {
  const clienteId = await ensureClienteByTelefono(input.nombre, input.telefono, input.email);
  if (!clienteId) return { ok: false, error: "Indica nombre y teléfono" };
  const { data: cat, error: catErr } = await supabase
    .from("bonos_catalogo")
    .select("id,nombre,sesiones,precio")
    .eq("id", input.catalogoId)
    .single();
  if (catErr || !cat) return { ok: false, error: "Bono no encontrado" };
  const { data, error } = await supabase
    .from("bonos")
    .insert({
      cliente_id: clienteId,
      catalogo_id: cat.id,
      nombre: cat.nombre,
      total_sesiones: cat.sesiones,
      sesiones_restantes: cat.sesiones,
      precio: cat.precio,
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, bono: toBono(data as BonoRow) };
}

// ====== CLIENTE FICHA ======
export async function getClienteById(id: string): Promise<Cliente | null> {
  const { data } = await supabase
    .from("clientes")
    .select("id,nombre,apellido_1,apellido_2,telefono,email,alias,observaciones")
    .eq("id", id)
    .maybeSingle();
  return (data as Cliente) ?? null;
}

export async function getCitasByCliente(clienteId: string): Promise<Cita[]> {
  const { data, error } = await supabase
    .from("citas")
    .select("*, clientes(nombre, apellido_1, apellido_2, telefono, email, alias, observaciones)")
    .eq("cliente_id", clienteId)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });
  if (error) return [];
  return (data as Row[]).map(toCita);
}

export async function updateClienteObservaciones(id: string, observaciones: string) {
  const { error } = await supabase.from("clientes").update({ observaciones }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// ====== COBROS / INGRESOS ======
export async function marcarCitaCobrada(id: string, precio: number) {
  const { error } = await supabase
    .from("citas")
    .update({ cobrada: true, precio_cobrado: precio, fecha_cobro: new Date().toISOString(), estado: "realizada" })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function getCitasCobradas(fecha?: string): Promise<Cita[]> {
  let q = supabase
    .from("citas")
    .select("*, clientes(nombre, apellido_1, apellido_2, telefono, email, alias, observaciones)")
    .eq("cobrada", true)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });
  if (fecha) q = q.eq("fecha", fecha);
  const { data, error } = await q;
  if (error) return [];
  return (data as Row[]).map(toCita);
}

// ====== FOTOS CLIENTE ======
export type FotoCliente = {
  id: string;
  cliente_id: string;
  storage_path: string;
  descripcion: string | null;
  created_at: string;
  url?: string;
};

export async function getFotosCliente(clienteId: string): Promise<FotoCliente[]> {
  const { data, error } = await supabase
    .from("cliente_fotos")
    .select("id,cliente_id,storage_path,descripcion,created_at")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const fotos = data as FotoCliente[];
  const withUrls = await Promise.all(
    fotos.map(async (f) => {
      const { data: signed } = await supabase.storage
        .from("clientes-fotos")
        .createSignedUrl(f.storage_path, 60 * 60);
      return { ...f, url: signed?.signedUrl };
    })
  );
  return withUrls;
}

export async function uploadFotoCliente(clienteId: string, file: File, descripcion?: string) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${clienteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("clientes-fotos")
    .upload(path, file, { contentType: file.type });
  if (upErr) return { ok: false as const, error: upErr.message };
  const { error: insErr } = await supabase
    .from("cliente_fotos")
    .insert({ cliente_id: clienteId, storage_path: path, descripcion: descripcion ?? null });
  if (insErr) return { ok: false as const, error: insErr.message };
  return { ok: true as const };
}

export async function deleteFotoCliente(foto: FotoCliente) {
  await supabase.storage.from("clientes-fotos").remove([foto.storage_path]);
  await supabase.from("cliente_fotos").delete().eq("id", foto.id);
}