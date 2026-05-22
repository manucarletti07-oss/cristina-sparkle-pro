// Editable site config. Cambia el WhatsApp aquí cuando lo tengas.
export const SITE = {
  name: "Cristina Cebrián",
  tagline: "Estética Avanzada",
  phone: "+34 614 34 52 00",
  whatsapp: "34614345200", // sin "+" ni espacios
  instagram: "https://www.instagram.com/cristinaesteticaavanzada/",
  address: "Calle Venus, 15 (Posterior), 28925 Alcorcón, Madrid",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Calle+Venus+15+28925+Alcorcón+Madrid",
};

// Credenciales hardcodeadas (solo demo, frontend-only).
export const ADMIN_CREDENTIALS = {
  email: "cristina.cebrian@gmail.com",
  password: "12345",
};

export type ServiceCategory = "facial" | "corporal" | "depilacion" | "mirada" | "micropigmentacion";

export type Treatment = { nombre: string; precio: number; desde?: boolean };

export const SERVICIOS: Record<
  ServiceCategory,
  { titulo: string; treatments: Treatment[] }
> = {
  facial: {
    titulo: "Faciales",
    treatments: [
      { nombre: "Limpieza facial", precio: 45, desde: true },
      { nombre: "Oxigenoterapia", precio: 55 },
      { nombre: "Radiofrecuencia", precio: 65 },
      { nombre: "Dermapen", precio: 70 },
      { nombre: "Rejuvenecimiento con láser", precio: 30 },
      { nombre: "Mesoterapia virtual", precio: 70 },
      { nombre: "Peeling químico medio profundo", precio: 65 },
    ],
  },
  corporal: {
    titulo: "Corporales",
    treatments: [
      { nombre: "Maderoterapia", precio: 50 },
      { nombre: "Radiofrecuencia corporal", precio: 80 },
      { nombre: "Criolipolisis", precio: 100, desde: true },
      { nombre: "Presoterapia", precio: 25 },
      { nombre: "Masajes", precio: 30, desde: true },
    ],
  },
  depilacion: {
    titulo: "Depilación",
    treatments: [
      { nombre: "Láser diodo", precio: 20, desde: true },
      { nombre: "Hilo", precio: 10, desde: true },
    ],
  },
  mirada: {
    titulo: "Manicura y Pestañas",
    treatments: [
      { nombre: "Lifting de pestañas", precio: 40 },
      { nombre: "Laminado de cejas", precio: 25 },
      { nombre: "Manicura permanente", precio: 15 },
    ],
  },
  micropigmentacion: {
    titulo: "Micropigmentación",
    treatments: [
      { nombre: "Microblading", precio: 300 },
      { nombre: "Sombreado de cejas", precio: 300 },
      { nombre: "Acuarela lips", precio: 300 },
      { nombre: "Eyeliner clásico", precio: 300 },
      { nombre: "Eyeliner inferior", precio: 180 },
    ],
  },
};