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

export type ServiceCategory = "facial" | "corporal" | "mirada";

export type Treatment = { nombre: string; precio: number };

export const SERVICIOS: Record<
  ServiceCategory,
  { titulo: string; treatments: Treatment[] }
> = {
  facial: {
    titulo: "Faciales",
    treatments: [
      { nombre: "Limpieza facial", precio: 45 },
      { nombre: "Oxigenoterapia", precio: 55 },
      { nombre: "Radiofrecuencia", precio: 65 },
      { nombre: "Dermapen", precio: 70 },
    ],
  },
  corporal: {
    titulo: "Corporales",
    treatments: [
      { nombre: "Maderoterapia (1 sesión)", precio: 50 },
      { nombre: "Radiofrecuencia", precio: 80 },
      { nombre: "Criolipolisis", precio: 100 },
      { nombre: "Presoterapia", precio: 25 },
      { nombre: "Masajes", precio: 30 },
    ],
  },
  mirada: {
    titulo: "Mirada y Manos",
    treatments: [
      { nombre: "Laminado de cejas", precio: 25 },
      { nombre: "Lifting de Pestañas", precio: 40 },
      { nombre: "Manicura permanente", precio: 15 },
    ],
  },
};