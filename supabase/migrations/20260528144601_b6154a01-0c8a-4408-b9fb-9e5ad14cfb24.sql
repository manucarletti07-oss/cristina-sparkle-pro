CREATE UNIQUE INDEX IF NOT EXISTS clientes_alias_unique_ci
ON public.clientes (lower(trim(alias)))
WHERE alias IS NOT NULL AND trim(alias) <> '';