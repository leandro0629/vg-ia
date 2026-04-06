-- ==========================================
-- Criar tabela NOTIFICATIONS se não existir
-- ==========================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  msg TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  tipo_notificacao TEXT DEFAULT 'info' CHECK (tipo_notificacao IN ('info', 'sucesso', 'aviso', 'erro', 'diario')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política de leitura
CREATE POLICY "Notificações visíveis para todos" ON public.notifications
  FOR SELECT USING (true);

-- Índice
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Teste
SELECT * FROM public.notifications LIMIT 0;
