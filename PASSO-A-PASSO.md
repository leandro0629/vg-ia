# ✅ Setup Passo-a-Passo: Automação Diários TCM/TCE

## 📊 O Que Você Tem Pronto

```
✅ SQL para criar tabelas         → setup-supabase-diarios.sql
✅ Workflow n8n pronto            → workflow-diarios-final.json
✅ Guia completo de setup         → SETUP-WORKFLOW-DIARIOS.md
✅ Credenciais Supabase encontradas
   - URL: https://eelhcdhefkkjvfirmwmi.supabase.co
   - Chave: sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82
```

---

## 🚀 PASSO 1: Preparar Banco de Dados (Supabase)

### 1.1 Executar SQL

1. Abra [Supabase Console](https://app.supabase.com)
2. Selecione o projeto: **eelhcdhefkkjvfirmwmi**
3. No menu lateral, clique **SQL Editor**
4. Clique em **"New Query"**
5. Cole **TODO** o conteúdo do arquivo: `setup-supabase-diarios.sql`
6. Clique em **"Run"**

✅ Isso vai criar:
- Tabela `diarios` (para armazenar PDFs)
- Tabela `diarios_log` (para logs)
- Bucket `diarios` (para armazenar PDFs)
- Índices e policies de segurança

### 1.2 Verificar Criação

No mesmo SQL Editor, rode:
```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'diarios%';

-- Verificar bucket criado
SELECT * FROM storage.buckets WHERE id = 'diarios';
```

**Esperado:** 2 tabelas (`diarios`, `diarios_log`) + 1 bucket (`diarios`)

---

## 🤖 PASSO 2: Configurar n8n

### 2.1 Credenciais Necessárias

Prepare estas informações:

```
SUPABASE_URL = https://eelhcdhefkkjvfirmwmi.supabase.co
SUPABASE_KEY = sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82
ANTHROPIC_API_KEY = ???
```

⚠️ **Falta:** `ANTHROPIC_API_KEY`
- Abra https://console.anthropic.com
- Vá em **API Keys**
- Crie uma nova chave (vai começar com `sk-ant-`)
- **CÓPIA ESSA CHAVE** (próximo passo)

### 2.2 Adicionar Variáveis no n8n

1. Abra **n8n** (http://localhost:5678 ou seu n8n hosted)
2. Clique em **Settings** (ícone de engrenagem)
3. Vá para **Variables**
4. Clique em **"Add Variable"**
5. Adicione **3 variáveis:**

```
Nome: SUPABASE_URL
Valor: https://eelhcdhefkkjvfirmwmi.supabase.co

Nome: SUPABASE_KEY
Valor: sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82

Nome: ANTHROPIC_API_KEY
Valor: sk-ant-XXXXXXXXXXXX (cole sua chave aqui)
```

6. Clique **Save** em cada uma

### 2.3 Importar Workflow

1. Na Dashboard do n8n, clique no **+** (New Workflow)
2. Clique em **Import**
3. Cole o **conteúdo completo** do arquivo: `workflow-diarios-final.json`
4. Clique em **"Import"**

### 2.4 Configurar Credenciais no Workflow

Após importar, você verá nós com **aviso vermelho** (credenciais faltando).

**Para cada nó Supabase:**
1. Clique no nó (ex: "Download PDF TCM")
2. Na aba **Credentials**, clique em **"Create New"**
3. Preencha:
   - **URL:** `https://eelhcdhefkkjvfirmwmi.supabase.co`
   - **API Key:** `sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82`
4. Clique **Create**

**Para cada nó Claude (OpenAI):**
1. Clique no nó (ex: "Claude - Analisar TCM")
2. Na aba **Credentials**, clique em **"Create New"**
3. Escolha **OpenAI** como tipo
4. Preencha **API Key:** `sk-ant-XXXXXX` (sua chave Anthropic)
5. Clique **Create**

---

## 🔍 PASSO 3: Validar Prompts do Claude

⚠️ **IMPORTANTE:** Os prompts podem precisar ajuste baseado na estrutura real dos sites.

### 3.1 Testar Scraping

1. Abra em novo navegador:
   - https://tcm.ioepa.com.br/busca/
   - https://www.tcepa.tc.br/diario-oficial

2. Procure por:
   - Onde está a data do diário mais recente?
   - Qual é o link para download do PDF?
   - Qual é o título/número?

### 3.2 Ajustar Prompts se Necessário

Se não encontrar as informações facilmente:

1. No workflow, clique no nó **"Claude - Analisar TCM"**
2. Na aba **Messages**, ajuste o prompt com detalhes específicos
3. Faça o mesmo para **"Claude - Analisar TCE"**

**Exemplo de prompt melhorado:**
```
Encontre no HTML fornecido:
- Data no formato YYYY-MM-DD (procure por "Diário n." ou "Data:" ou "Data de Publicação:")
- Link para PDF (procure por <a href="...pdf"> ou <a href="...arquivo">)
- Título (procure por "Diário n." ou similar)

Retorne em JSON: {"data": "YYYY-MM-DD", "url_pdf": "https://...", "titulo": "..."}
```

---

## 🧪 PASSO 4: Testar o Workflow

### 4.1 Teste Manual

1. No n8n, abra o workflow
2. Clique em **"Test Workflow"** (Ctrl + Enter)
3. Acompanhe os logs de cada nó

### 4.2 O Que Procurar

✅ **Esperado:**
- Scrape TCM: retorna HTML
- Scrape TCE: retorna HTML
- Claude análise: retorna JSON válido
- Comparar: identifica se há novo
- Se novo: Download, Upload, Inserção
- Notificação: criada no banco

❌ **Se falhar:**
- Veja a mensagem de erro (clique no nó com ⚠️)
- Procure por problemas de parse de JSON
- Verifique credenciais Supabase e Anthropic

### 4.3 Verificar Resultado no Supabase

Após teste bem-sucedido:

```sql
-- Ver diários salvos
SELECT * FROM public.diarios ORDER BY created_at DESC;

-- Ver logs
SELECT * FROM public.diarios_log ORDER BY created_at DESC;

-- Ver notificações
SELECT * FROM public.notifications ORDER BY created_at DESC LIMIT 5;
```

**Esperado:** 
- 2 registros em `diarios` (TCM e TCE)
- Log de sucesso em `diarios_log`
- 1 notificação em `notifications`

### 4.4 Verificar PDFs no Storage

1. No Supabase, vá para **Storage**
2. Abra o bucket **"diarios"**
3. Deve ver PDFs: `tcm_YYYY-MM-DD.pdf` e `tce_YYYY-MM-DD.pdf`

---

## 🔄 PASSO 5: Ativar Workflow em Produção

### 5.1 Ativar Automação

1. No workflow, procure pelo botão **"Activate"** (canto superior direito)
2. Clique para **ativar**
3. Status deve mudar para **"ACTIVE"**

✅ **Pronto!** O workflow agora rodará:
- Todos os dias
- Às 8h da manhã
- Verificará TCM e TCE
- Armazenará novos diários
- Notificará na Kausas

### 5.2 Monitorar Execuções

1. Clique em **"Executions"** (menu lateral)
2. Veja histórico de rodadas automáticas
3. Clique em uma execução para ver detalhes

### 5.3 Configurar Alertas (Opcional)

Se quiser ser notificado quando falhar:
1. No workflow final, após o nó de notificação
2. Adicione nó de **Email** ou **Slack**
3. Configure para rodar apenas em erro

---

## 🐛 Troubleshooting

### Erro: "Supabase: Invalid authentication"
- ❌ Chave errada ou expirada
- ✅ Solução: Verifique URL e chave no código da Kausas

### Erro: "Claude API key invalid"
- ❌ Chave Anthropic não começando com `sk-ant-`
- ✅ Solução: Gere nova chave em https://console.anthropic.com

### Erro: "PDF download failed"
- ❌ Link extraído está errado ou quebrado
- ✅ Solução: Revise o prompt do Claude com site aberto em mão

### Notificação não aparece na Kausas
- ❌ Listeners não ativados ou banco fora de sync
- ✅ Solução: Verifique console do navegador (F12)

### PDF não sobe pro Storage
- ❌ Permissões bucket ou credential problema
- ✅ Solução: Verifique RLS policies no Supabase

---

## 📋 Checklist Final

- [ ] SQL executado no Supabase (tabelas + bucket criados)
- [ ] Variáveis adicionadas no n8n
- [ ] Workflow importado
- [ ] Credenciais Supabase configuradas
- [ ] Credenciais Claude/Anthropic configuradas
- [ ] Teste manual passou
- [ ] Dados aparecem no Supabase
- [ ] PDFs no Storage
- [ ] Notificação aparece na Kausas
- [ ] Workflow ativado

---

## 🎉 Se Tudo Passou

**Parabéns!** Sua automação está funcionando. 

Agora:
1. Acompanhe os logs em "Executions"
2. Verifique diários todos os dias na Kausas
3. Explore refatorações se necessário

---

## Próximos Passos (Opcional)

- [ ] Adicionar mais órgãos (TCM, TCE de outros estados)
- [ ] Criar dashboard visual dos diários
- [ ] Enviar PDFs por email após download
- [ ] Integrar OCR para ler conteúdo automaticamente

---

**Status:** ✅ Pronto para implementar!
Qualquer dúvida, revise o arquivo: `SETUP-WORKFLOW-DIARIOS.md`
