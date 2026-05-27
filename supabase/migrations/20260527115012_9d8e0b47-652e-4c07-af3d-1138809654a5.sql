DROP TRIGGER IF EXISTS trg_consumir_bono_ins ON public.citas;
DROP TRIGGER IF EXISTS trg_consumir_bono_del ON public.citas;
DROP TRIGGER IF EXISTS trg_consumir_bono_upd ON public.citas;

CREATE OR REPLACE FUNCTION public.consumir_bono()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.bono_id IS NOT NULL THEN
      UPDATE public.bonos
      SET sesiones_restantes = sesiones_restantes - 1,
          estado = CASE WHEN sesiones_restantes - 1 <= 0 THEN 'agotado' ELSE 'activo' END
      WHERE id = NEW.bono_id
        AND estado = 'activo'
        AND sesiones_restantes > 0;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'El bono no tiene sesiones disponibles';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.bono_id IS DISTINCT FROM NEW.bono_id THEN
      IF OLD.bono_id IS NOT NULL THEN
        UPDATE public.bonos
        SET sesiones_restantes = LEAST(sesiones_restantes + 1, total_sesiones),
            estado = 'activo'
        WHERE id = OLD.bono_id;
      END IF;

      IF NEW.bono_id IS NOT NULL THEN
        UPDATE public.bonos
        SET sesiones_restantes = sesiones_restantes - 1,
            estado = CASE WHEN sesiones_restantes - 1 <= 0 THEN 'agotado' ELSE 'activo' END
        WHERE id = NEW.bono_id
          AND estado = 'activo'
          AND sesiones_restantes > 0;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'El bono no tiene sesiones disponibles';
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.bono_id IS NOT NULL THEN
      UPDATE public.bonos
      SET sesiones_restantes = LEAST(sesiones_restantes + 1, total_sesiones),
          estado = 'activo'
      WHERE id = OLD.bono_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE TRIGGER trg_consumir_bono_ins
BEFORE INSERT ON public.citas
FOR EACH ROW
EXECUTE FUNCTION public.consumir_bono();

CREATE TRIGGER trg_consumir_bono_upd
BEFORE UPDATE OF bono_id ON public.citas
FOR EACH ROW
EXECUTE FUNCTION public.consumir_bono();

CREATE TRIGGER trg_consumir_bono_del
AFTER DELETE ON public.citas
FOR EACH ROW
EXECUTE FUNCTION public.consumir_bono();