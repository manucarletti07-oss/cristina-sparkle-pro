DROP TRIGGER IF EXISTS trg_consumir_bono_ins ON public.citas;
DROP TRIGGER IF EXISTS trg_consumir_bono_del ON public.citas;

CREATE TRIGGER trg_consumir_bono_ins
AFTER INSERT ON public.citas
FOR EACH ROW
EXECUTE FUNCTION public.consumir_bono();

CREATE TRIGGER trg_consumir_bono_del
AFTER DELETE ON public.citas
FOR EACH ROW
EXECUTE FUNCTION public.consumir_bono();