
## Contexto

Tu proyecto actual es PHP + MySQL, pero Lovable funciona con **React + TanStack Start + TypeScript**. Voy a reconstruir toda la web manteniendo el diseño dorado/negro/blanco y la identidad de Cristina Cebrián, traduciendo la lógica de PHP a React. No habrá base de datos real: el login es hardcodeado y las citas se guardan en `localStorage` del navegador.

## Estructura de rutas

```
src/routes/
  __root.tsx          → layout + providers (toaster, auth context)
  index.tsx           → landing (hero, servicios, promos, contacto)
  terminos.tsx        → aviso legal (de terminoslegales.html)
  admin.tsx           → panel privado de Cristina (protegido)
```

## Diseño

- **Paleta**: dorado `#bfa37e`, negro `#121212`, blanco, beige `#f9f9f9` (tokens semánticos en `src/styles.css` con `oklch`).
- **Tipografía**: Playfair Display (titulares) + Montserrat (cuerpo) — cargadas desde Google Fonts en `__root.tsx`.
- **Efectos**: glassmorphism en modales (backdrop-blur + borde dorado translúcido), hover dorado sutil en botones/tarjetas, transiciones suaves, skeleton loaders, animación "Cita Confirmada" con check dorado.
- **Responsive**: mobile-first, menú hamburguesa, grid adaptativo.

## Funcionalidades

### 1. Landing (`/`)
- Navbar fijo con logo, links de anclaje, botón "CITA PREVIA" y botón discreto **"Área Interna"** arriba a la derecha que abre el modal de login.
- Hero con tag dorado, título Playfair, divisor y CTA.
- Sección Servicios: tarjetas (Faciales, Corporales, etc.) que abren modal de precios con selección múltiple.
- Sección Promociones, Sobre Mí, Contacto, Footer con link a `/terminos`.

### 2. Modal Login ("Área Interna")
- Diseño glassmorphism, formulario con email + contraseña.
- Credenciales hardcodeadas: `cristina.cebrian@gmail.com` / `12345`.
- Auth guardada en `localStorage` (`auth-cristina`) + React Context.
- Al éxito: toast dorado "Bienvenida, Cristina" y redirige a `/admin`.
- Toasts elegantes (sonner) en vez de `alert()`.

### 3. Reserva Premium (cliente)
Flujo en el modal de cita:
1. Selecciona servicios (checkboxes con precio).
2. Elige fecha (datepicker shadcn) y hora.
3. Introduce nombre + teléfono.
4. Al confirmar:
   - Spinner dorado mientras "procesa".
   - Guarda la cita en `localStorage` (clave `citas-cristina`, array de objetos `{id, nombre, telefono, servicios, fecha, hora, total, estado: 'pendiente', createdAt}`).
   - Muestra animación **"Cita Confirmada"** (check dorado animado + texto Playfair).
   - Tras 1,5s abre WhatsApp en pestaña nueva con mensaje preformateado.
- **Nota**: no diste número de WhatsApp — usaré un placeholder `+34 600 000 000` que podrás editar después en un solo lugar (`src/lib/config.ts`).

### 4. Panel Admin (`/admin`)
- Protegido: si no hay sesión, redirige a `/` y abre el login.
- Header con saludo "Panel de Cristina" + botón **Cerrar Sesión**.
- Stats rápidas: total citas, pendientes, realizadas, ingresos previstos.
- Lista/tabla de citas con: cliente, teléfono, fecha, hora, servicios (badges dorados), total €, estado.
- Acciones por cita: **Marcar como realizada** (badge verde) / **Eliminar** (con confirmación).
- Filtros: todas / pendientes / realizadas.
- Estética premium: fondo negro suave, tarjetas con borde dorado, tipografía Playfair en titulares.

### 5. Términos Legales (`/terminos`)
- Página con el contenido del HTML aportado, maquetada con el sistema de diseño.

## Imágenes (generadas con IA)

Genero ~6 imágenes premium para `src/assets/`:
- Hero (mujer recibiendo tratamiento facial, estética lujosa, tonos cálidos dorados).
- Faciales, Corporales, Manicura, Depilación, Promoción especial.

Estilo: fotografía editorial, iluminación suave, paleta beige/dorado/negro, look spa de alta gama.

## Detalles técnicos

- Toasts: `sonner` (ya integrado).
- Modales: shadcn `Dialog` con clases custom para glassmorphism.
- Datepicker: shadcn `Calendar` + `Popover`.
- Validación: `zod` + `react-hook-form` para el formulario de cita.
- Sin backend, sin Lovable Cloud, sin PHP — todo cliente.
- Tokens de diseño centralizados en `src/styles.css`.

## Lo que NO se hace (por tu elección)

- No hay base de datos real: si la cliente borra cookies/cache, las citas se pierden. Si quieres persistencia real más adelante, podemos activar **Lovable Cloud** (5 min) y migrar.
- No hay seguridad real en el login: las credenciales están en el código del cliente. Suficiente para demo, **no apto para producción real**.

¿Confirmas para construir, o quieres ajustar algo (p. ej. darme el número de WhatsApp real ahora)?
