-- ============================================================
-- KAUSAS — Migração para SaaS Multi-Tenant
-- Execute este arquivo no painel do Supabase: SQL Editor
-- ============================================================

-- 1. Tabela de escritórios
CREATE TABLE IF NOT EXISTS offices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT DEFAULT '',
  plan TEXT DEFAULT 'basico',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de usuários por escritório (substitui localStorage)
CREATE TABLE IF NOT EXISTS office_users (
  id TEXT PRIMARY KEY,
  office_id TEXT REFERENCES offices(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'advogado',
  name TEXT NOT NULL,
  member_id INTEGER,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Adicionar office_id na tabela app_data
ALTER TABLE app_data ADD COLUMN IF NOT EXISTS office_id TEXT DEFAULT 'vg-advocacia';

-- 4. Atualizar os dados existentes do VG para ter office_id correto
UPDATE app_data SET office_id = 'vg-advocacia' WHERE office_id IS NULL OR office_id = '';

-- 5. Recriar chave primária como composta (office_id + key)
ALTER TABLE app_data DROP CONSTRAINT IF EXISTS app_data_pkey;
ALTER TABLE app_data ADD PRIMARY KEY (office_id, key);

-- 6. Inserir VG Advocacia como primeiro escritório
INSERT INTO offices (id, name, cnpj, plan, email)
VALUES ('vg-advocacia', 'VG Advocacia', '', 'pro', 'kausasvgadmin@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- 7. Inserir usuários do VG (senhas serão sincronizadas pelo app automaticamente)
INSERT INTO office_users (id, office_id, email, password_hash, role, name, member_id) VALUES
  ('admin',       'vg-advocacia', 'kausasvgadmin@gmail.com',    'pending_sync', 'admin',      'Admin Geral',    NULL),
  ('gleydson',    'vg-advocacia', 'gleydson@vgai.com',          'pending_sync', 'socio',      'Gleydson',       1),
  ('caio',        'vg-advocacia', 'caio@vgai.com',              'pending_sync', 'advogado',   'Caio',           2),
  ('izabelle',    'vg-advocacia', 'izabelle@vgai.com',          'pending_sync', 'advogado',   'Izabelle',       3),
  ('juli',        'vg-advocacia', 'juli@vgai.com',              'pending_sync', 'estagiario', 'Juli',           4),
  ('yuripompeu',  'vg-advocacia', 'yuripompeu@vgai.com',        'pending_sync', 'advogado',   'Yuri Pompeu',    5),
  ('nakano',      'vg-advocacia', 'nakano@vgai.com',            'pending_sync', 'advogado',   'Nakano',         6),
  ('larissa',     'vg-advocacia', 'larissa@vgai.com',           'pending_sync', 'estagiario', 'Larissa',        7),
  ('wagner',      'vg-advocacia', 'wagner@vgai.com',            'pending_sync', 'socio',      'Wagner',         8),
  ('yuribeleza',  'vg-advocacia', 'yuribeleza@vgai.com',        'pending_sync', 'advogado',   'Yuri Beleza',    9),
  ('nicole',      'vg-advocacia', 'nicole@vgai.com',            'pending_sync', 'advogado',   'Nicole',         10),
  ('felipe',      'vg-advocacia', 'felipe@vgai.com',            'pending_sync', 'advogado',   'Felipe',         11),
  ('erika',       'vg-advocacia', 'erika@vgai.com',             'pending_sync', 'advogado',   'Erika',          12),
  ('leandro',     'vg-advocacia', 'leandrosmg0629@gmail.com',   'pending_sync', 'estagiario', 'Leandro Andrade',13),
  ('roger',       'vg-advocacia', 'roger@vgai.com',             'pending_sync', 'estagiario', 'Roger Cunha',    14)
ON CONFLICT (id) DO NOTHING;

-- 8. Row Level Security (quando Supabase Auth for ativado futuramente)
-- ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE office_users ENABLE ROW LEVEL SECURITY;
-- Por enquanto desabilitado — segurança feita no código (office_id no query)
