
CREATE TABLE public.citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  servicios TEXT[] NOT NULL DEFAULT '{}',
  fecha DATE NOT NULL,
  hora TEXT NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','realizada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX citas_slot_unico
  ON public.citas (fecha, hora)
  WHERE estado = 'pendiente';

ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede crear una reserva (formulario público)
CREATE POLICY "publico puede crear citas"
  ON public.citas FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Solo usuarios autenticados (Cristina) pueden ver/editar/borrar
CREATE POLICY "autenticados pueden ver citas"
  ON public.citas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "autenticados pueden actualizar citas"
  ON public.citas FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "autenticados pueden borrar citas"
  ON public.citas FOR DELETE
  TO authenticated
  USING (true);

-- Necesario para que el formulario público pueda comprobar slots ocupados
CREATE POLICY "publico puede leer fecha y hora"
  ON public.citas FOR SELECT
  TO anon
  USING (estado = 'pendiente');
