CREATE TABLE public.tarjetas_regalo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comprador_cliente_id uuid NOT NULL,
  servicios_ids uuid[] NOT NULL DEFAULT '{}',
  servicios_nombres text[] NOT NULL DEFAULT '{}',
  precio numeric NOT NULL DEFAULT 0,
  codigo text NOT NULL UNIQUE,
  estado text NOT NULL DEFAULT 'pendiente',
  fecha_compra timestamptz NOT NULL DEFAULT now(),
  fecha_canje timestamptz,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarjetas_regalo TO authenticated;
GRANT ALL ON public.tarjetas_regalo TO service_role;

ALTER TABLE public.tarjetas_regalo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "autenticados gestionan tarjetas regalo"
ON public.tarjetas_regalo
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_tarjetas_regalo_comprador ON public.tarjetas_regalo(comprador_cliente_id);
CREATE INDEX idx_tarjetas_regalo_estado ON public.tarjetas_regalo(estado);