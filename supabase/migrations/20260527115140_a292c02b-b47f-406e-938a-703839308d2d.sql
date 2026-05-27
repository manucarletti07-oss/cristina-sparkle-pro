DROP POLICY IF EXISTS "publico puede crear citas" ON public.citas;
DROP POLICY IF EXISTS "autenticados pueden ver citas" ON public.citas;
DROP POLICY IF EXISTS "autenticados pueden actualizar citas" ON public.citas;
DROP POLICY IF EXISTS "autenticados pueden borrar citas" ON public.citas;

CREATE POLICY "publico puede crear citas"
ON public.citas
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(nombre)) >= 2
  AND length(regexp_replace(telefono, '[^0-9+]', '', 'g')) >= 6
  AND fecha >= CURRENT_DATE
  AND profesional IN ('cristina', 'jessie')
  AND estado = 'pendiente'
);

CREATE POLICY "autenticados pueden ver citas"
ON public.citas
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "autenticados pueden actualizar citas"
ON public.citas
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "autenticados pueden borrar citas"
ON public.citas
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "autenticados gestionan clientes" ON public.clientes;
DROP POLICY IF EXISTS "publico puede crear cliente" ON public.clientes;

CREATE POLICY "publico puede crear cliente"
ON public.clientes
FOR INSERT
TO anon
WITH CHECK (
  length(trim(nombre)) >= 2
  AND telefono IS NOT NULL
  AND length(regexp_replace(telefono, '[^0-9+]', '', 'g')) >= 6
);

CREATE POLICY "autenticados gestionan clientes"
ON public.clientes
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "publico puede comprar bono" ON public.bonos;
DROP POLICY IF EXISTS "autenticados gestionan bonos" ON public.bonos;

CREATE POLICY "publico puede comprar bono"
ON public.bonos
FOR INSERT
TO anon, authenticated
WITH CHECK (
  cliente_id IS NOT NULL
  AND nombre = 'Bono de 10 sesiones'
  AND total_sesiones = 10
  AND sesiones_restantes = 10
  AND precio = 150
  AND estado = 'activo'
);

CREATE POLICY "autenticados gestionan bonos"
ON public.bonos
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);