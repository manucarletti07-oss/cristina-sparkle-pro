
-- Tabla bonos
CREATE TABLE public.bonos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL DEFAULT 'Bono de 10 sesiones',
  total_sesiones integer NOT NULL DEFAULT 10,
  sesiones_restantes integer NOT NULL DEFAULT 10,
  precio numeric NOT NULL DEFAULT 150,
  estado text NOT NULL DEFAULT 'activo', -- activo | agotado
  fecha_compra timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonos TO authenticated;
GRANT SELECT, INSERT ON public.bonos TO anon;
GRANT ALL ON public.bonos TO service_role;

ALTER TABLE public.bonos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publico puede comprar bono" ON public.bonos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "publico puede leer bonos activos" ON public.bonos FOR SELECT TO anon USING (estado = 'activo');
CREATE POLICY "autenticados gestionan bonos" ON public.bonos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_bonos_cliente ON public.bonos(cliente_id);

-- Añadir bono_id a citas
ALTER TABLE public.citas ADD COLUMN bono_id uuid REFERENCES public.bonos(id) ON DELETE SET NULL;

-- Trigger: al insertar cita con bono_id, descontar sesión y marcar agotado
CREATE OR REPLACE FUNCTION public.consumir_bono()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.bono_id IS NOT NULL THEN
    UPDATE public.bonos
      SET sesiones_restantes = GREATEST(sesiones_restantes - 1, 0),
          estado = CASE WHEN sesiones_restantes - 1 <= 0 THEN 'agotado' ELSE 'activo' END
      WHERE id = NEW.bono_id;
  ELSIF TG_OP = 'DELETE' AND OLD.bono_id IS NOT NULL THEN
    UPDATE public.bonos
      SET sesiones_restantes = LEAST(sesiones_restantes + 1, total_sesiones),
          estado = 'activo'
      WHERE id = OLD.bono_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_consumir_bono_ins
AFTER INSERT ON public.citas FOR EACH ROW EXECUTE FUNCTION public.consumir_bono();

CREATE TRIGGER trg_consumir_bono_del
AFTER DELETE ON public.citas FOR EACH ROW EXECUTE FUNCTION public.consumir_bono();
