## Resumen

Voy a implementar los 12 puntos por fases para no romper lo que ya funciona. Confirma el plan y lo ejecuto en bloques (cada fase = 1 migración + código).

---

## Fase 1 — Base de datos (1 sola migración grande)

Nuevas tablas / cambios sobre lo existente:

- `servicios` (id, nombre, precio, duracion_min, sala_requerida int|null, requiere_maquina bool, activo)
  → poblar con tus servicios actuales del front. Cristina podrá editar precio.
- `bonos_catalogo` (id, nombre, sesiones, precio) → poblado con los 12 bonos del Excel que subiste (Criolipólisis, Oxigenoterapia, Masaje x5/x10, Láser Diodo, Presoterapia x5/x10, Radiofrecuencia corporal/facial, Maderoterapia, Rejuvenecimiento Láser, Dermapen).
- `bonos` (ya existe) → añadir `catalogo_id`, mantener `nombre/precio/total_sesiones/sesiones_restantes` para histórico.
- `citas` → añadir `servicio_id` (opcional, además de `servicios text[]` actual), `precio_cobrado`, `cobrada bool default false`, `sala int|null`.
- `clientes` → ya tiene `observaciones`. OK.
- `cliente_fotos` (id, cliente_id, storage_path, created_at) + bucket Storage `clientes-fotos` privado, con RLS solo `authenticated`.
- `clientes_excel` import: cargar los 289 clientes del Excel adjunto (nombre/apellido1/apellido2/teléfono/alias) deduplicando por teléfono.
- Constraint nuevo de doble reserva:
  - Por profesional+fecha+hora (ya existe).
  - Por sala+fecha+hora cuando `sala IS NOT NULL` (UNIQUE parcial). Así Máquina/Sala1 bloquea presoterapia y criolipólisis a la misma hora, pero Cristina/Jenny/Nerea pueden tener cita a la vez.
- Profesionales: ampliar el CHECK a `('cristina','jenny','nerea','maquina')`. Migrar registros existentes `jessie → jenny`.

GRANTs + RLS en todas las tablas nuevas (lectura pública mínima para catálogos, escritura solo `authenticated`).

## Fase 2 — Horarios 15 min + agendas

- `src/lib/storage.ts`: `HORARIO` cambia a slots de 15 min con dos bloques 10:00–14:00 y 16:00–20:00.
- `PROFESIONALES` = Cristina, Jenny, Nerea, Máquina.
- `BookingModal`: al elegir un servicio que requiere máquina (Presoterapia/Criolipólisis), forzar profesional = "maquina" y bloquear esa hora en la columna Máquina sin bloquear a las demás.
- Renombrar Jessie → Jenny en toda la UI.

## Fase 3 — Login privado de "Ingresos"

- Ruta nueva `/admin/ingresos` (dentro del layout admin existente).
- Login extra encima del auth de Supabase: usuario `CristinaCerebral.com` + password `ingresos123` validado en cliente (es una segunda capa cosmética sobre el admin ya autenticado). Si quieres que sea seguridad real → guardar el hash en una tabla `admin_secret` y validar; lo dejo así de simple porque ya estás dentro del panel admin autenticado.
- Vista: total del día, lista de citas con `cobrada=true` (servicio, cliente, precio, fecha/hora, profesional). Botón "Marcar cobrada" en cada cita del día desde la agenda.

## Fase 4 — Buscador con desplegable + ficha de cliente

- Componente `ClientSearch` con `Command` (cmdk) y debounce → llama a `searchClientes` ya existente, muestra desplegable con nombre + apellidos + tel.
- Nueva ruta `/admin/cliente/$id`:
  - Datos personales + edición de observaciones internas.
  - Historial COMPLETO de citas (pendientes, realizadas, canceladas) ordenado por fecha desc.
  - Bonos del cliente con sesiones usadas / restantes / fecha compra.
  - Sección "Fotos" con upload múltiple a `clientes-fotos/{cliente_id}/...` y grid con previews.

## Fase 5 — Bonos con desplegable

- `BuyBonoModal`: select con `bonos_catalogo` (los 12 del Excel). Al comprar se crea un `bonos` con datos del catálogo.
- En cada cita de la agenda mostrar badge "Bono · N restantes" si la cita tiene `bono_id`.
- El trigger `consumir_bono` ya existe y seguirá funcionando.

## Fase 6 — Gestión de precios

- Ruta `/admin/precios` (visible solo dentro del admin). Tabla editable de `servicios` con inline edit + guardar. Al cambiar precio se actualiza en el catálogo; las citas futuras que no tengan `precio_cobrado` cogerán el nuevo automáticamente.

## Fase 7 — WhatsApp sin nombre

- En `routes/api/public/hooks/send-reminders.ts` cambiar el texto a: `"Hola, desde Cristina Febrián le recordamos que hoy tiene cita a las {hora}."`
- Igual en el botón "Recordar por WhatsApp" del panel.

## Fase 8 — Realtime

- En el panel admin suscribirse a canal `postgres_changes` de `clientes`, `citas` y `bonos` → `queryClient.invalidateQueries()` para que aparezcan sin F5.

---

## Lo que NO voy a hacer salvo que lo pidas

- No voy a crear tabla separada `usuarios_admin` (uso el auth de Supabase ya configurado + una contraseña adicional sólo para "Ingresos").
- No voy a borrar datos existentes; sólo renombrar `jessie → jenny`.
- Fotos van a Supabase Storage (bucket privado), no a `/uploads/...` del filesystem — en este stack no hay filesystem persistente. Se sirven por URL firmada.

---

## Ejecución

Si das OK, lo hago por fases en este orden: 1 → 2 → 5 → 4 → 3 → 6 → 7 → 8. Después de cada migración te aviso para que la apruebes.

¿Procedo?
