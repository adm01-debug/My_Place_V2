-- Add support and financial fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rh_responsavel TEXT,
ADD COLUMN IF NOT EXISTS apoio_departamento TEXT,
ADD COLUMN IF NOT EXISTS salario_base NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_hora_extra NUMERIC(10,2);

-- Ensure gestor_id exists and has a foreign key to profiles if possible
-- (Profiles table already has gestor_id based on previous read_query)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_gestor_id_fkey'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_gestor_id_fkey 
        FOREIGN KEY (gestor_id) REFERENCES public.profiles(id);
    END IF;
END $$;
