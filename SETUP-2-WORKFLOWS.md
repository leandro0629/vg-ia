# 📋 Setup: 2 Workflows (Principal + Retry)

## ✨ O Sistema Agora Funciona Assim:

```
⏰ 8:00 - Workflow 1 (Principal)
  └─ Tenta encontrar novo
     ├─ SIM → Baixa, sobe, notifica ✅
     └─ NÃO → Log: "Sem novo, Workflow 2 tentará"

⏱️ 8:30, 9:00, 9:30, 10:00, 10:30, 11:00, 11:30, 12:00 - Workflow 2 (Retry)
  └─ Tenta de novo
     ├─ SIM → Baixa, sobe, notifica ✅
     └─ NÃO → Log: "Próxima tentativa em 30min"

⏰ 12:00+ - Para automaticamente
```

---

## 🚀 Como Implementar (3 Passos)

### PASSO 1: Preparar Supabase (5 min)

1. Abra [Supabase Console](https://app.supabase.com)
2. Projeto: `eelhcdhefkkjvfirmwmi`
3. **SQL Editor** → New Query
4. Cole **TODO** o arquivo: `setup-supabase-diarios.sql`
5. Clique **Run**

✅ Criou: tabelas + bucket

---

### PASSO 2: Configurar n8n (10 min)

#### 2.1 Adicionar Variáveis

1. Abra **n8n**
2. **Settings** → **Variables**
3. Adicione estas 3:

```
Nome: SUPABASE_URL
Valor: https://eelhcdhefkkjvfirmwmi.supabase.co

Nome: SUPABASE_KEY
Valor: sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82

Nome: ANTHROPIC_API_KEY
Valor: sk-ant-XXXXXXX (sua chave do console.anthropic.com)
```

#### 2.2 Importar Workflow 1 (Principal)

1. Dashboard n8n → **New** → **Import**
2. Cole conteúdo: `workflow-1-principal-8h.json`
3. Clique **Import**

#### 2.3 Configurar Credenciais Workflow 1

Para cada nó **Supabase**:
1. Clique no nó
2. **Credentials** → **Create New**
3. Preencha:
   - URL: `https://eelhcdhefkkjvfirmwmi.supabase.co`
   - API Key: `sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82`

Para cada nó **Claude (OpenAI)**:
1. Clique no nó (ex: "Claude - Analisar TCM")
2. **Credentials** → **Create New** (OpenAI)
3. API Key: sua chave Anthropic `sk-ant-...`

#### 2.4 Importar Workflow 2 (Retry)

1. Dashboard → **New** → **Import**
2. Cole conteúdo: `workflow-2-retry-30min.json`
3. Clique **Import**
4. Configure credenciais **IGUAL AO WORKFLOW 1** (mesmas credenciais)

---

### PASSO 3: Testar e Ativar (5 min)

#### 3.1 Testar Workflow 1

1. Abra **Workflow 1**
2. Clique **Test Workflow** (Ctrl+Enter)
3. Aguarde conclusão
4. Procure por erros (nós vermelhos)

**Esperado:**
- ✅ Scrape OK
- ✅ Claude extrai data
- ✅ Compara datas
- ✅ Se novo: Download, Upload, Notificação

#### 3.2 Testar Workflow 2

1. Abra **Workflow 2**
2. Clique **Test Workflow**
3. Aguarde conclusão

**Esperado:**
- ✅ Mesmo fluxo do Workflow 1
- ✅ Verifica horário (8:30-12h)

#### 3.3 Ativar Ambos

**Workflow 1:**
1. Botão **Activate** (canto superior direito)
2. Status muda para "ACTIVE"

**Workflow 2:**
1. Mesmo procedimento
2. Status "ACTIVE"

✅ **Pronto!** Ambos rodando automaticamente

---

## 📊 O Que Vai Acontecer

### Dia 1

```
8:00   → W1 executa, procura novo
         ├─ SIM → Notifica na Kausas ✅
         └─ NÃO → Log "sem novo"
8:30   → W2 executa
9:00   → W2 executa
9:30   → W2 executa
10:00  → W2 executa
10:30  → W2 executa
11:00  → W2 executa
11:30  → W2 executa
12:00  → W2 executa (última tentativa)
12:01+ → Para automaticamente
```

---

## 🔍 Monitorar Execuções

### No n8n

1. Menu lateral → **Executions**
2. Veja histórico de ambos workflows
3. Clique em uma execução para detalhar

### No Supabase

```sql
-- Ver todos os diários encontrados
SELECT * FROM diarios ORDER BY created_at DESC;

-- Ver log de tentativas
SELECT * FROM diarios_log ORDER BY created_at DESC;

-- Ver notificações criadas
SELECT * FROM notifications WHERE tipo_notificacao = 'diario' ORDER BY created_at DESC LIMIT 10;
```

---

## 🐛 Troubleshooting

### Workflow não executa

**Problema:** Status não está "ACTIVE"
**Solução:**
1. Clique no workflow
2. Procure botão **Activate** (deve estar verde)
3. Se não funcionar, clique de novo

### Erro de credenciais

**Problema:** Nós ficam vermelhos com "Invalid credentials"
**Solução:**
1. Verifique que URL e Key estão corretos
2. Sem espaços extras
3. Recrie a credencial

### Claude não extrai data

**Problema:** JSON vazio ou null
**Solução:**
1. Abra o site no navegador
2. Procure manualmente a data do diário
3. Copie o HTML da página
4. Cole no prompt do nó Claude
5. Teste o prompt e ajuste

### PDF não faz download

**Problema:** Erro 404 ou URL inválida
**Solução:**
1. Claude extraiu URL errada
2. Teste a URL diretamente no navegador
3. Revise o prompt do Claude

---

## ✅ Checklist de Setup

- [ ] SQL executado no Supabase
- [ ] Variáveis adicionadas no n8n (3: URL, Key, API Key)
- [ ] Workflow 1 importado
- [ ] Workflow 1 credenciais OK
- [ ] Workflow 1 testado (sucesso)
- [ ] Workflow 2 importado
- [ ] Workflow 2 credenciais OK
- [ ] Workflow 2 testado (sucesso)
- [ ] Workflow 1 ativado (status ACTIVE)
- [ ] Workflow 2 ativado (status ACTIVE)

---

## 🎉 Pronto!

Seus workflows estão rodando:
- ✅ **Workflow 1** às 8h da manhã
- ✅ **Workflow 2** a cada 30min (8:30-12h)

Monitore no Supabase ou n8n Executions.

---

## 📞 Dúvidas?

Se algo não funciona:
1. Verifique os logs (n8n → Executions)
2. Procure por erros vermelhos
3. Leia a mensagem de erro
4. Ajuste conforme necessário

**Exemplo:**
- "Invalid URL" → Verifique o link extraído por Claude
- "Connection timeout" → Verifique credenciais Supabase
- "JSON parse error" → Revise prompt do Claude

---

**Status:** ✅ **PRONTO PARA USAR**
**Criado em:** 2026-04-06
