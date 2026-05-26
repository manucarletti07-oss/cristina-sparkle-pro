
CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  apellido_1 text,
  apellido_2 text,
  telefono text,
  email text,
  alias text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT INSERT ON public.clientes TO anon;
GRANT ALL ON public.clientes TO service_role;

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "autenticados gestionan clientes" ON public.clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "publico puede crear cliente" ON public.clientes
  FOR INSERT TO anon WITH CHECK (true);

CREATE INDEX clientes_telefono_idx ON public.clientes (telefono);
CREATE INDEX clientes_nombre_idx ON public.clientes (lower(nombre));

ALTER TABLE public.citas
  ADD COLUMN cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD COLUMN email text,
  ADD COLUMN observaciones text;

CREATE INDEX citas_fecha_idx ON public.citas (fecha);
CREATE INDEX citas_cliente_idx ON public.citas (cliente_id);
