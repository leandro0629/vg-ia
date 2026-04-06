# 📧 Guia Completo: Notificações de Email via Supabase

## 🎯 O que Vamos Fazer:

Seu JUS IA vai enviar emails automaticamente quando:
1. ✅ Uma missão é criada
2. ✅ O status da missão muda
3. ✅ Faltam 3 dias para expirar
4. ✅ Faltam 2 dias para expirar
5. ✅ Falta 1 dia para expirar

Tudo via Supabase!

---

## ⚙️ Passo 1: Configurar Resend (Email Service)

### 1.1 Registrar no Resend
1. Acesse: https://resend.com
2. Clique em **"Sign Up"**
3. Use seu email
4. Confirme o email
5. Crie uma organização

### 1.2 Pegar API Key
1. Vá em **Settings** → **API Keys**
2. Clique em **"Create API Key"**
3. Copie a chave (começa com `re_`)
4. Guarde em um lugar seguro!

---

## 🚀 Passo 2: Deploy da Função no Supabase

### 2.1 Instalar Supabase CLI
```bash
npm install -g supabase
```

### 2.2 Login no Supabase
```bash
supabase login
```

### 2.3 Criar Pasta da Função
```bash
mkdir -p supabase/functions/enviar-notificacao-missao
```

### 2.4 Copiar o Código
1. Abra o arquivo `supabase-email-funcao.ts`
2. Copie TODO o conteúdo
3. Cole em: `supabase/functions/enviar-notificacao-missao/index.ts`

### 2.5 Deploy
```bash
supabase functions deploy enviar-notificacao-missao --project-id seu_project_id
```

**Onde pegar `seu_project_id`:**
- Vá em: https://app.supabase.com
- Selecione seu projeto
- A URL será: `https://app.supabase.com/project/SEU_PROJECT_ID`

### 2.6 Configurar Variáveis de Ambiente
No Supabase Dashboard:
1. Vá em **Project Settings** → **API**
2. Copie: `Project URL` e `Service Role Key`
3. Na aba **Functions**, clique em **enviar-notificacao-missao**
4. Vá em **Configuration** e adicione:
   - `RESEND_API_KEY`: sua chave do Resend
   - `SUPABASE_URL`: sua URL do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: sua service role key

---

## 🔌 Passo 3: Criar Triggers no Banco de Dados

No Supabase SQL Editor, execute esses scripts:

### 3.1 Trigger - Quando Missão é Criada
```sql
CREATE OR REPLACE FUNCTION public.notificar_missao_criada()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar a Edge Function
  SELECT http_post(
    'https://seu_project_id.functions.supabase.co/enviar-notificacao-missao',
    jsonb_build_object(
      'id', NEW.id,
      'titulo', NEW.titulo,
      'descricao', NEW.descricao,
      'responsavel', NEW.responsavel,
      'data_prazo', NEW.data_prazo,
      'prioridade', NEW.prioridade,
      'status', NEW.status,
      'tipo_notificacao', 'criada'
    ),
    'application/json'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_missao_criada
AFTER INSERT ON missoes
FOR EACH ROW
EXECUTE FUNCTION public.notificar_missao_criada();
```

### 3.2 Trigger - Quando Status Muda
```sql
CREATE OR REPLACE FUNCTION public.notificar_status_mudou()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT http_post(
      'https://seu_project_id.functions.supabase.co/enviar-notificacao-missao',
      jsonb_build_object(
        'id', NEW.id,
        'titulo', NEW.titulo,
        'descricao', NEW.descricao,
        'responsavel', NEW.responsavel,
        'data_prazo', NEW.data_prazo,
        'prioridade', NEW.prioridade,
        'status', NEW.status,
        'tipo_notificacao', 'status_mudou'
      ),
      'application/json'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_status_mudou
AFTER UPDATE ON missoes
FOR EACH ROW
EXECUTE FUNCTION public.notificar_status_mudou();
```

### 3.3 Function - Verificar Prazos (Cron Job)
```sql
CREATE OR REPLACE FUNCTION public.verificar_prazos_missoes()
RETURNS void AS $$
DECLARE
  v_missao RECORD;
  v_dias_restantes INT;
  v_tipo_notificacao TEXT;
BEGIN
  FOR v_missao IN
    SELECT id, titulo, descricao, responsavel, data_prazo, prioridade, status
    FROM missoes
    WHERE data_prazo IS NOT NULL
    AND status != 'concluida'
  LOOP
    v_dias_restantes := (v_missao.data_prazo::DATE - CURRENT_DATE);
    
    -- Verificar 3 dias antes
    IF v_dias_restantes = 3 THEN
      v_tipo_notificacao := 'prazo_3_dias';
      SELECT http_post(
        'https://seu_project_id.functions.supabase.co/enviar-notificacao-missao',
        jsonb_build_object(
          'id', v_missao.id,
          'titulo', v_missao.titulo,
          'descricao', v_missao.descricao,
          'responsavel', v_missao.responsavel,
          'data_prazo', v_missao.data_prazo,
          'prioridade', v_missao.prioridade,
          'status', v_missao.status,
          'tipo_notificacao', v_tipo_notificacao
        ),
        'application/json'
      );
    END IF;
    
    -- Verificar 2 dias antes
    IF v_dias_restantes = 2 THEN
      v_tipo_notificacao := 'prazo_2_dias';
      SELECT http_post(
        'https://seu_project_id.functions.supabase.co/enviar-notificacao-missao',
        jsonb_build_object(
          'id', v_missao.id,
          'titulo', v_missao.titulo,
          'descricao', v_missao.descricao,
          'responsavel', v_missao.responsavel,
          'data_prazo', v_missao.data_prazo,
          'prioridade', v_missao.prioridade,
          'status', v_missao.status,
          'tipo_notificacao', v_tipo_notificacao
        ),
        'application/json'
      );
    END IF;
    
    -- Verificar 1 dia antes
    IF v_dias_restantes = 1 THEN
      v_tipo_notificacao := 'prazo_1_dia';
      SELECT http_post(
        'https://seu_project_id.functions.supabase.co/enviar-notificacao-missao',
        jsonb_build_object(
          'id', v_missao.id,
          'titulo', v_missao.titulo,
          'descricao', v_missao.descricao,
          'responsavel', v_missao.responsavel,
          'data_prazo', v_missao.data_prazo,
          'prioridade', v_missao.prioridade,
          'status', v_missao.status,
          'tipo_notificacao', v_tipo_notificacao
        ),
        'application/json'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ⏰ Passo 4: Configurar Cron Job

Para rodar a função de verificar prazos diariamente:

1. No Supabase Dashboard
2. Vá em **Database** → **Webhooks**
3. Clique em **Create a webhook**
4. Configure:
   - **Trigger**: `Run a database function`
   - **Function**: `verificar_prazos_missoes`
   - **Schedule**: `Diariamente às 08:00`

---

## 🧪 Passo 5: Testar

### 5.1 Testar Criação de Missão
```javascript
// No seu código JUS IA:
const { data, error } = await supabase
  .from('missoes')
  .insert([{
    titulo: 'Teste de Notificação',
    descricao: 'Esta é uma missão de teste',
    responsavel: 'Seu Nome',
    data_prazo: '2026-04-15',
    prioridade: 'Alta',
    status: 'pendente'
  }]);

// Você vai receber um email em leandrosmg0629@gmail.com!
```

### 5.2 Testar Mudança de Status
```javascript
const { data, error } = await supabase
  .from('missoes')
  .update({ status: 'em_progresso' })
  .eq('id', 'seu-id-da-missao');

// Você vai receber um email sobre a mudança de status!
```

---

## 📋 Estrutura da Tabela `missoes`

Certifique-se que sua tabela tem esses campos:
```sql
CREATE TABLE missoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  responsavel TEXT,
  data_prazo DATE,
  prioridade TEXT, -- 'Baixa', 'Média', 'Alta', 'Crítica'
  status TEXT, -- 'pendente', 'em_progresso', 'concluida', 'cancelada'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚨 Troubleshooting

### Email não está chegando?
1. Verifique se RESEND_API_KEY está configurada
2. Cheque os logs da função no Supabase
3. Verifique spam/lixo do email

### Trigger não está funcionando?
1. Verifique se a tabela se chama `missoes`
2. Certifique-se que http_post está habilitado no Supabase
3. Cheque os logs do PostgreSQL

---

## ✅ Pronto!

Agora seu JUS IA envia emails automaticamente para `leandrosmg0629@gmail.com` quando:
- Missão é criada ✅
- Status muda ✅
- Prazo aproxima (3, 2, 1 dia) ✅

Alguma dúvida? Me avisa! 🚀
