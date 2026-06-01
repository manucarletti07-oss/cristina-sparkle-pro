
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='tarjetas_regalo') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tarjetas_regalo;
  END IF;
END $$;

ALTER TABLE public.citas REPLICA IDENTITY FULL;
ALTER TABLE public.bonos REPLICA IDENTITY FULL;
ALTER TABLE public.clientes REPLICA IDENTITY FULL;
ALTER TABLE public.tarjetas_regalo REPLICA IDENTITY FULL;
