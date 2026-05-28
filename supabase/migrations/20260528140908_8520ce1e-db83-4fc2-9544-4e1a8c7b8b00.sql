-- Unique index on telefono (only when not null/empty) to block future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS clientes_telefono_unique
  ON public.clientes (telefono)
  WHERE telefono IS NOT NULL AND length(trim(telefono)) > 0;
