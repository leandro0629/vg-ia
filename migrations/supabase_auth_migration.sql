-- ============================================================
-- KAUSAS — Migração para Supabase Auth
-- Execute no Supabase: SQL Editor
-- ============================================================

-- 1. Adicionar coluna auth_id em office_users (liga ao Supabase Auth)
ALTER TABLE office_users ADD COLUMN IF NOT EXISTS auth_id UUID;

-- 2. Criar índice para busca por auth_id
CREATE INDEX IF NOT EXISTS office_users_auth_id_idx ON office_users(auth_id);

-- ============================================================
-- INSTRUÇÕES MANUAIS (faça ANTES de testar o login):
-- ============================================================
--
-- No Supabase Dashboard → Authentication → Settings:
--   ✅ Desabilite "Confirm email" (Email Confirmations → OFF)
--   ✅ Isso permite que os usuários façam login imediatamente
--      sem precisar confirmar email
--
-- Após desabilitar, os usuários VG vão se auto-migrar
-- para Supabase Auth na primeira vez que fizerem login.
-- Não é necessário criar as contas manualmente.
--
-- ============================================================
-- RLS (Row Level Security) — OPCIONAL mas recomendado:
-- ============================================================
-- Após todos os usuários migrarem, você pode ativar RLS
-- nas tabelas usando auth.uid() para maior segurança.
--
-- Exemplo para office_users:
-- ALTER TABLE office_users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Usuários veem apenas seu próprio escritório"
--   ON office_users FOR ALL
--   USING (office_id = (
--     SELECT office_id FROM office_users WHERE auth_id = auth.uid() LIMIT 1
--   ));
-- ============================================================
