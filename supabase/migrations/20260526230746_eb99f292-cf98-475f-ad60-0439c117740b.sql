
ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS profesional text NOT NULL DEFAULT 'cristina',
  ADD COLUMN IF NOT EXISTS recordatorio_enviado boolean NOT NULL DEFAULT false;

ALTER TABLE public.citas
  DROP CONSTRAINT IF EXISTS citas_fecha_hora_key;

DROP INDEX IF EXISTS public.citas_slot_unico_idx;
CREATE UNIQUE INDEX citas_slot_unico_idx
  ON public.citas (fecha, hora, profesional)
  WHERE estado = 'pendiente';
