export type Cita = {
  id: string;
  nombre: string;
  telefono: string;
  servicios: string[];
  fecha: string; // ISO date yyyy-mm-dd
  hora: string; // HH:mm
  total: number;
  estado: "pendiente" | "realizada";
  createdAt: string;
};

const CITAS_KEY = "citas-cristina";
const AUTH_KEY = "auth-cristina";

function safeWindow(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getCitas(): Cita[] {
  const ls = safeWindow();
  if (!ls) return [];
  try {
    return JSON.parse(ls.getItem(CITAS_KEY) ?? "[]") as Cita[];
  } catch {
    return [];
  }
}

export function saveCita(cita: Omit<Cita, "id" | "createdAt" | "estado">): Cita {
  const ls = safeWindow();
  const full: Cita = {
    ...cita,
    id: crypto.randomUUID(),
    estado: "pendiente",
    createdAt: new Date().toISOString(),
  };
  if (ls) {
    const all = getCitas();
    all.unshift(full);
    ls.setItem(CITAS_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("citas-updated"));
  }
  return full;
}

export function updateCita(id: string, patch: Partial<Cita>) {
  const ls = safeWindow();
  if (!ls) return;
  const all = getCitas().map((c) => (c.id === id ? { ...c, ...patch } : c));
  ls.setItem(CITAS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("citas-updated"));
}

export function deleteCita(id: string) {
  const ls = safeWindow();
  if (!ls) return;
  const all = getCitas().filter((c) => c.id !== id);
  ls.setItem(CITAS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("citas-updated"));
}

export function getAuth(): boolean {
  const ls = safeWindow();
  if (!ls) return false;
  return ls.getItem(AUTH_KEY) === "1";
}

export function setAuth(v: boolean) {
  const ls = safeWindow();
  if (!ls) return;
  if (v) ls.setItem(AUTH_KEY, "1");
  else ls.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event("auth-updated"));
}