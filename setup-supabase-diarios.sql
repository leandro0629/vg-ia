-- ==========================================
-- SETUP: Tabela de Diários TCM/TCE
-- ==========================================

-- 1. Criar tabela diarios
CREATE TABLE IF NOT EXISTS public.diarios (
  id BIGSERIAL PRIMARY KEY,
  orgao TEXT NOT NULL CHECK (orgao IN ('TCM', 'TCE')),
  data DATE NOT NULL,
  titulo TEXT NOT NULL,
  arquivo TEXT NOT NULL,
  url_original TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(orgao, data)
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE public.diarios ENABLE ROW LEVEL SECURITY;

-- 3. Criar política de leitura pública
CREATE POLICY "Diários visíveis para todos" ON public.diarios
  FOR SELECT USING (true);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_diarios_orgao ON public.diarios(orgao);
CREATE INDEX IF NOT EXISTS idx_diarios_data ON public.diarios(data DESC);
CREATE INDEX IF NOT EXISTS idx_diarios_created ON public.diarios(created_at DESC);

-- 5. Criar tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS public.diarios_log (
  id BIGSERIAL PRIMARY KEY,
  orgao TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sucesso', 'erro', 'sem_atualizacao')),
  data_verificada DATE,
  mensagem TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Enable RLS para logs
ALTER TABLE public.diarios_log ENABLE ROW LEVEL SECURITY;

-- 7. Criar política de leitura para logs
CREATE POLICY "Logs visíveis para todos" ON public.diarios_log
  FOR SELECT USING (true);

-- 8. Criar índice para logs
CREATE INDEX IF NOT EXISTS idx_diarios_log_created ON public.diarios_log(created_at DESC);

-- ==========================================
-- STORAGE: Bucket para PDFs
-- ==========================================

-- Criar bucket (se não existir)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit)
VALUES ('diarios', 'diarios', true, false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- NOTIFICAÇÕES: Atualizar tabela existente
-- ==========================================

-- Adicionar coluna tipo_notificacao se não existir
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS tipo_notificacao TEXT DEFAULT 'info' CHECK (tipo_notificacao IN ('info', 'sucesso', 'aviso', 'erro', 'diario'));

-- Adicionar coluna data_criacao se não existir (para log)
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT NOW();

-- ==========================================
-- CONSULTAS DE TESTE
-- ==========================================

-- Ver estrutura criada
SELECT * FROM public.diarios LIMIT 0;
SELECT * FROM public.diarios_log LIMIT 0;

-- Ver bucket criado
SELECT * FROM storage.buckets WHERE id = 'diarios';
