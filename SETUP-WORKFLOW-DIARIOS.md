# 🚀 Setup Completo: Automação Diários TCM/TCE

## Passo 1: Preparar Supabase

### 1.1 Executar SQL de Setup

1. Abra [Supabase Console](https://app.supabase.com)
2. Vá para seu projeto: `eelhcdhefkkjvfirmwmi`
3. Abra **SQL Editor** no menu lateral
4. Cole todo o conteúdo do arquivo `setup-supabase-diarios.sql`
5. Clique em **"Run"**

Isso vai criar:
- ✅ Tabela `diarios` (para armazenar metadados)
- ✅ Tabela `diarios_log` (para logs de sincronização)
- ✅ Bucket `diarios` no Storage (para PDFs)
- ✅ Índices e policies de segurança

### 1.2 Verificar Storage

Vá em **Storage** → confirme que o bucket `diarios` está criado e **público**.

---

## Passo 2: Configurar n8n

### 2.1 Credenciais Necessárias

Você vai precisar adicionar no n8n:

```
SUPABASE_URL = https://eelhcdhefkkjvfirmwmi.supabase.co
SUPABASE_KEY = sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82
ANTHROPIC_API_KEY = [OBTER DO SEU CONSOLE ANTHROPIC]
```

⚠️ **Para a Anthropic API Key:**
1. Abra https://console.anthropic.com
2. Vá para **API Keys**
3. Copie sua chave (começa com `sk-ant-`)
4. No n8n: Settings → Variables → Nova variável

### 2.2 Importar Workflow

1. Abra **n8n Dashboard**
2. Clique em **"Import"** (+ ícone)
3. Cole o conteúdo do arquivo `workflow-diarios-tcm-tce.json`
4. Clique em **"Import"**

### 2.3 Configurar Credenciais no Workflow

Para cada nó que usa Supabase ou Claude:

**Nós Supabase:**
- Selecione cada nó Supabase
- Na aba **Credentials**, crie uma conexão nova
- Preencha:
  - URL: `https://eelhcdhefkkjvfirmwmi.supabase.co`
  - API Key: `sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82`

**Nós Claude (OpenAI):**
- Selecione cada nó Claude
- Configure credenciais com sua `ANTHROPIC_API_KEY`
- Model: `claude-opus-4-6`

---

## Passo 3: Ajustes no Workflow (IMPORTANTE!)

### 3.1 Revisar Prompts do Claude

Os prompts precisam ser ajustados baseado na **estrutura real** dos sites:

Abra https://tcm.ioepa.com.br/busca/ e https://www.tcepa.tc.br/diario-oficial

Veja onde está:
- Data do diário
- Link para PDF
- Título/número

Após verificar, atualize os nós "Claude - Analisar TCM" e "Claude - Analisar TCE" com prompts específicos.

### 3.2 Configurar Horário de Execução

No nó **"Cron - Diariamente 8h"**:
- Clique e edite
- Ajuste `triggerAtHour` para o horário desejado (0-23)

### 3.3 Remover Duplicação de Notificações

Se quiser uma notificação por diário (não uma por órgão), ajuste o nó final.

---

## Passo 4: Testar o Workflow

### 4.1 Teste Manual

1. Abra o workflow no n8n
2. Clique em **"Test Workflow"** (ou Ctrl+Enter)
3. Veja os logs de cada nó
4. Procure por erros

### 4.2 Verificar Resultados

Após teste bem-sucedido:

✅ Verifique no Supabase:
- SQL Editor: `SELECT * FROM public.diarios;`
- Deve ter registros dos últimos diários

✅ Verifique no Storage:
- Storage → diarios → PDFs devem estar presentes

✅ Verifique Notificações:
- Na Kausas, uma notificação deve aparecer
- Ou: `SELECT * FROM public.notifications ORDER BY created_at DESC;`

---

## Passo 5: Deploy em Produção

### 5.1 Ativar Workflow

No n8n:
1. Clique em **"Activate"** (toggle no topo)
2. O workflow agora roda automaticamente todos os dias no horário configurado

### 5.2 Monitorar Execuções

Menu lateral → **Executions** → veja logs das rodadas automáticas

### 5.3 Configurar Alertas (Opcional)

Se quiser notificação quando falhar:
- Adicione nó "Send Email" ou "Slack" no final
- Configure para rodar apenas em caso de erro

---

## Troubleshooting

### ❌ Erro: "Supabase connection failed"
- Verifique URL e API Key
- Confirme que está usando a chave `public`

### ❌ Erro: "Claude API key invalid"
- Verifique que a chave começa com `sk-ant-`
- Renove a chave se expirou (https://console.anthropic.com)

### ❌ Erro: "PDF download failed"
- Os links extraídos do HTML podem estar errados
- Revise o prompt do Claude com exemplos reais do site
- Teste manualmente o link no navegador

### ❌ Notificação não aparece na Kausas
- Verifique se a inserção na tabela `notifications` funcionou
- Confirme que a Kausas está escutando mudanças (RealTime)
- Verifique no console do navegador por erros

---

## URLs e Documentação

- **n8n Docs:** https://docs.n8n.io
- **Supabase Docs:** https://supabase.com/docs
- **Claude API:** https://docs.anthropic.com
- **TCM Diário:** https://tcm.ioepa.com.br/busca/
- **TCE Diário:** https://www.tcepa.tc.br/diario-oficial

---

## Próximos Passos

Após tudo funcionando:

1. **Adicionar mais órgãos** → Repita padrão para outros tribunais
2. **Refinar prompts** → Melhorar extração de dados
3. **Integração com email** → Enviar PDF por email além de armazenar
4. **Dashboard** → Criar visualização dos diários na Kausas

---

**Status:** ✅ Pronto para configurar!
