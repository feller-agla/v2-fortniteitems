-- ============================================================
-- Table "messages" : création ou mise à jour complète
-- À exécuter dans Supabase → SQL Editor (tout en une fois)
-- ============================================================

-- 1) Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  sender_type text NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user', 'admin')),
  is_admin_sender boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Ajouter les colonnes manquantes si la table existait déjà
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id uuid;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content text DEFAULT '';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'user';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_admin_sender boolean NOT NULL DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2b) Remplir content si NULL (lignes existantes)
UPDATE public.messages SET content = '' WHERE content IS NULL;
ALTER TABLE public.messages ALTER COLUMN content SET DEFAULT '';
ALTER TABLE public.messages ALTER COLUMN content SET NOT NULL;

-- 3) Remplir sender_type pour les lignes où c'est NULL
UPDATE public.messages SET sender_type = CASE WHEN is_admin_sender THEN 'admin' ELSE 'user' END WHERE sender_type IS NULL;

-- 4) Imposer NOT NULL et défaut sur sender_type
ALTER TABLE public.messages ALTER COLUMN sender_type SET DEFAULT 'user';
ALTER TABLE public.messages ALTER COLUMN sender_type SET NOT NULL;

-- 5) Contrainte (user | admin) si pas déjà là
DO $$
BEGIN
  ALTER TABLE public.messages ADD CONSTRAINT messages_sender_type_check CHECK (sender_type IN ('user', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6) Index
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON public.messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

COMMENT ON TABLE public.messages IS 'Messages du chat client / support par commande';
COMMENT ON COLUMN public.messages.sender_type IS 'user = client, admin = support';
