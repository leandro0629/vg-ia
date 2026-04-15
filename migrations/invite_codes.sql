-- ============================================================
-- KAUSAS — Tabela de Códigos de Convite para Registro
-- Execute no Supabase: SQL Editor
-- ============================================================

-- 1. Criar tabela de invite codes
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL,
  used_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_used BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_used ON invite_codes(is_used);

-- 2. Gerar 5 códigos iniciais para o admin do VG usar (válidos por 30 dias)
INSERT INTO invite_codes (code, created_by, expires_at) VALUES
  ('VG-' || upper(substring(gen_random_uuid()::text, 1, 8)), 'admin', now() + interval '30 days'),
  ('VG-' || upper(substring(gen_random_uuid()::text, 1, 8)), 'admin', now() + interval '30 days'),
  ('VG-' || upper(substring(gen_random_uuid()::text, 1, 8)), 'admin', now() + interval '30 days'),
  ('VG-' || upper(substring(gen_random_uuid()::text, 1, 8)), 'admin', now() + interval '30 days'),
  ('VG-' || upper(substring(gen_random_uuid()::text, 1, 8)), 'admin', now() + interval '30 days')
ON CONFLICT DO NOTHING;
