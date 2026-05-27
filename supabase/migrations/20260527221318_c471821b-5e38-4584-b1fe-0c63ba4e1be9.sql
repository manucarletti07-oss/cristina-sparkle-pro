
UPDATE public.citas SET profesional = 'jenny' WHERE profesional = 'jessie';

ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS sala smallint,
  ADD COLUMN IF NOT EXISTS cobrada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS precio_cobrado numeric,
  ADD COLUMN IF NOT EXISTS fecha_cobro timestamptz;

DROP POLICY IF EXISTS "publico puede crear citas" ON public.citas;
CREATE POLICY "publico puede crear citas"
ON public.citas FOR INSERT TO anon, authenticated
WITH CHECK (
  length(TRIM(BOTH FROM nombre)) >= 2
  AND length(regexp_replace(telefono, '[^0-9+]'::text, ''::text, 'g'::text)) >= 6
  AND fecha >= CURRENT_DATE
  AND profesional = ANY (ARRAY['cristina','jenny','nerea','maquina']::text[])
  AND estado = 'pendiente'
);

DROP INDEX IF EXISTS public.citas_sala_unica;
CREATE UNIQUE INDEX citas_sala_unica
  ON public.citas (fecha, hora, sala)
  WHERE sala IS NOT NULL AND estado = 'pendiente';

CREATE TABLE IF NOT EXISTS public.servicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  categoria text NOT NULL,
  precio numeric NOT NULL DEFAULT 0,
  duracion_min integer NOT NULL DEFAULT 45,
  requiere_maquina boolean NOT NULL DEFAULT false,
  sala_requerida smallint,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.servicios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicios TO authenticated;
GRANT ALL ON public.servicios TO service_role;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "publico lee servicios" ON public.servicios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "autenticados gestionan servicios" ON public.servicios FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

INSERT INTO public.servicios (nombre, categoria, precio, requiere_maquina, sala_requerida) VALUES
  ('Limpieza facial','facial',45,false,NULL),
  ('Oxigenoterapia','facial',55,false,NULL),
  ('Radiofrecuencia','facial',65,false,NULL),
  ('Dermapen','facial',70,false,NULL),
  ('Rejuvenecimiento con láser','facial',30,false,NULL),
  ('Mesoterapia virtual','facial',70,false,NULL),
  ('Peeling químico medio profundo','facial',65,false,NULL),
  ('Maderoterapia','corporal',50,false,NULL),
  ('Radiofrecuencia corporal','corporal',80,false,NULL),
  ('Criolipolisis','corporal',100,true,1),
  ('Presoterapia','corporal',25,true,1),
  ('Masajes','corporal',30,false,NULL),
  ('Láser diodo','depilacion',20,false,NULL),
  ('Hilo','depilacion',10,false,NULL),
  ('Lifting de pestañas','mirada',40,false,NULL),
  ('Laminado de cejas','mirada',25,false,NULL),
  ('Manicura permanente','mirada',15,false,NULL),
  ('Microblading','micropigmentacion',300,false,NULL),
  ('Sombreado de cejas','micropigmentacion',300,false,NULL),
  ('Acuarela lips','micropigmentacion',300,false,NULL),
  ('Eyeliner clásico','micropigmentacion',300,false,NULL),
  ('Eyeliner inferior','micropigmentacion',180,false,NULL)
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.bonos_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  sesiones integer NOT NULL,
  precio numeric NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bonos_catalogo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonos_catalogo TO authenticated;
GRANT ALL ON public.bonos_catalogo TO service_role;
ALTER TABLE public.bonos_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "publico lee bonos catalogo" ON public.bonos_catalogo FOR SELECT TO anon, authenticated USING (activo = true);
CREATE POLICY "autenticados gestionan catalogo" ON public.bonos_catalogo FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

INSERT INTO public.bonos_catalogo (nombre, sesiones, precio) VALUES
  ('Bono Criolipólisis x2', 2, 180),
  ('Bono Oxigenoterapia x4', 4, 165),
  ('Bono Masaje x5', 5, 130),
  ('Bono Láser Diodo x6', 6, 100),
  ('Bono Presoterapia x5', 5, 100),
  ('Bono Radiofrecuencia Corporal x6', 6, 280),
  ('Bono Maderoterapia x6', 6, 175),
  ('Bono Rejuvenecimiento con Láser x6', 6, 120),
  ('Bono Dermapen x6', 6, 280),
  ('Bono Radiofrecuencia Facial x6', 6, 260),
  ('Bono Masaje x10', 10, 250),
  ('Bono Presoterapia x10', 10, 180)
ON CONFLICT (nombre) DO NOTHING;

ALTER TABLE public.bonos ADD COLUMN IF NOT EXISTS catalogo_id uuid REFERENCES public.bonos_catalogo(id);

DROP POLICY IF EXISTS "publico puede comprar bono" ON public.bonos;
CREATE POLICY "publico puede comprar bono"
ON public.bonos FOR INSERT TO anon, authenticated
WITH CHECK (
  cliente_id IS NOT NULL
  AND total_sesiones > 0
  AND sesiones_restantes = total_sesiones
  AND precio >= 0
  AND estado = 'activo'
);

CREATE TABLE IF NOT EXISTS public.cliente_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_fotos TO authenticated;
GRANT ALL ON public.cliente_fotos TO service_role;
ALTER TABLE public.cliente_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados gestionan fotos" ON public.cliente_fotos FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS cliente_fotos_cliente_idx ON public.cliente_fotos(cliente_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('clientes-fotos','clientes-fotos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "autenticados ven fotos clientes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'clientes-fotos');

CREATE POLICY "autenticados suben fotos clientes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'clientes-fotos');

CREATE POLICY "autenticados borran fotos clientes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'clientes-fotos');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS servicios_updated_at ON public.servicios;
CREATE TRIGGER servicios_updated_at BEFORE UPDATE ON public.servicios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.citas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bonos;
