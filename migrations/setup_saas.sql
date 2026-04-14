-- ============================================================
-- KAUSAS — Migração SaaS Multi-Tenant (v4 — offices.id é UUID)
-- Execute no Supabase: SQL Editor
-- ============================================================

-- UUID fixo do VG Advocacia (determinístico para uso no código)
-- '00000000-0000-0000-0000-000000000001'

-- 1. Criar tabela office_users SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS office_users (
  id TEXT PRIMARY KEY,
  office_id UUID NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'advogado',
  name TEXT NOT NULL,
  member_id INTEGER,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_office_users_office_id ON office_users(office_id);
CREATE INDEX IF NOT EXISTS idx_office_users_email     ON office_users(email);

-- 2. Adicionar office_id na app_data (como TEXT para ser flexível)
ALTER TABLE app_data ADD COLUMN IF NOT EXISTS office_id TEXT DEFAULT '00000000-0000-0000-0000-000000000001';

-- 3. Atualizar dados existentes do VG
UPDATE app_data SET office_id = '00000000-0000-0000-0000-000000000001'
WHERE office_id IS NULL OR office_id = '' OR office_id = 'vg-advocacia';

-- 4. Recriar chave primária como composta
ALTER TABLE app_data DROP CONSTRAINT IF EXISTS app_data_pkey;
ALTER TABLE app_data ADD PRIMARY KEY (office_id, key);

-- 5. Inserir VG Advocacia com UUID fixo
INSERT INTO offices (id, name, plan, email)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'VG Advocacia', 'pro', 'kausasvgadmin@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- 6. Inserir usuários do VG
INSERT INTO office_users (id, office_id, email, password_hash, role, name, member_id) VALUES
  ('admin',       '00000000-0000-0000-0000-000000000001', 'kausasvgadmin@gmail.com',  'pending_sync', 'admin',      'Admin Geral',    NULL),
  ('gleydson',    '00000000-0000-0000-0000-000000000001', 'gleydson@vgai.com',        'pending_sync', 'socio',      'Gleydson',       1),
  ('caio',        '00000000-0000-0000-0000-000000000001', 'caio@vgai.com',            'pending_sync', 'advogado',   'Caio',           2),
  ('izabelle',    '00000000-0000-0000-0000-000000000001', 'izabelle@vgai.com',        'pending_sync', 'advogado',   'Izabelle',       3),
  ('juli',        '00000000-0000-0000-0000-000000000001', 'juli@vgai.com',            'pending_sync', 'estagiario', 'Juli',           4),
  ('yuripompeu',  '00000000-0000-0000-0000-000000000001', 'yuripompeu@vgai.com',      'pending_sync', 'advogado',   'Yuri Pompeu',    5),
  ('nakano',      '00000000-0000-0000-0000-000000000001', 'nakano@vgai.com',          'pending_sync', 'advogado',   'Nakano',         6),
  ('larissa',     '00000000-0000-0000-0000-000000000001', 'larissa@vgai.com',         'pending_sync', 'estagiario', 'Larissa',        7),
  ('wagner',      '00000000-0000-0000-0000-000000000001', 'wagner@vgai.com',          'pending_sync', 'socio',      'Wagner',         8),
  ('yuribeleza',  '00000000-0000-0000-0000-000000000001', 'yuribeleza@vgai.com',      'pending_sync', 'advogado',   'Yuri Beleza',    9),
  ('nicole',      '00000000-0000-0000-0000-000000000001', 'nicole@vgai.com',          'pending_sync', 'advogado',   'Nicole',         10),
  ('felipe',      '00000000-0000-0000-0000-000000000001', 'felipe@vgai.com',          'pending_sync', 'advogado',   'Felipe',         11),
  ('erika',       '00000000-0000-0000-0000-000000000001', 'erika@vgai.com',           'pending_sync', 'advogado',   'Erika',          12),
  ('leandro',     '00000000-0000-0000-0000-000000000001', 'leandrosmg0629@gmail.com', 'pending_sync', 'estagiario', 'Leandro Andrade',13),
  ('roger',       '00000000-0000-0000-0000-000000000001', 'roger@vgai.com',           'pending_sync', 'estagiario', 'Roger Cunha',    14)
ON CONFLICT (id) DO NOTHING;
