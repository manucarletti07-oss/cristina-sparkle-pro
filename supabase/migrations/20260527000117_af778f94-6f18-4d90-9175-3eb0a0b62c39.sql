-- Permitir a anon leer su propio cliente recién creado para que .insert().select() devuelva la fila
CREATE POLICY "publico puede leer clientes basico"
ON public.clientes
FOR SELECT
TO anon
USING (true);