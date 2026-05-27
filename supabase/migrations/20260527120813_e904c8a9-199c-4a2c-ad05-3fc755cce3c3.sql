DROP INDEX IF EXISTS public.citas_slot_unico;
DROP INDEX IF EXISTS public.citas_slot_unico_idx;
-- Nos quedamos solo con citas_unica_por_profesional (fecha, hora, profesional) WHERE estado='pendiente'