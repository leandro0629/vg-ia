# 📋 Setup: 1 Workflow Único (Diários + Email)

## ✨ O Workflow Único Faz:

```
⏰ 8:00 Diariamente
  ↓
🌐 Scrape TCM + TCE
  ↓
🤖 Claude análise
  ↓
🔍 Compara datas
  ↓
✅ Encontrou novo?
  ├─ SIM:
  │  ├─ ⬇️ Download PDF
  │  ├─ ☁️ Upload Supabase
  │  ├─ 💾 Salva no banco
  │  ├─ 📋 Extrai dados
  │  ├─ 📧 Envia Email (Gmail)
  │  ├─ 🔔 Notifica Kausas
  │  └─ 📝 Log sucesso
  └─ NÃO:
     └─ 📝 Log sem novo
```

---

## 🚀 3 Passos Simples

### PASSO 1: Supabase (✅ Já Feito!)

Você já criou as tabelas. Pronto! ✅

---

### PASSO 2: n8n - Importar Workflow

1. **Abra n8n**
2. **Dashboard** → **New** → **Import**
3. Cole **TODO** o conteúdo: `workflow-unico-diarios-email.json`
4. Clique **Import**

---

### PASSO 3: n8n - Configurar Credenciais

#### 3.1 Adicionar Variáveis

1. **Settings** → **Variables**
2. Adicione:

```
SUPABASE_URL = https://eelhcdhefkkjvfirmwmi.supabase.co
SUPABASE_KEY = sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82
ANTHROPIC_API_KEY = sk-ant-XXXXXXX (sua chave)
```

#### 3.2 Configurar Supabase em cada nó

Para cada nó **Supabase** (Get, Insert, Upload):
1. Clique no nó
2. **Credentials** → **Create New**
3. Preencha URL e Key

#### 3.3 Configurar Gmail

1. Clique no nó **"📧 Enviar Email (Gmail)"**
2. **Credentials** → **Connect** (autorize sua conta Gmail)

#### 3.4 Configurar Claude/Anthropic

Para cada nó Claude:
1. Clique no nó
2. **Credentials** → **Create New** (OpenAI)
3. Cole sua chave: `sk-ant-...`

---

## ⚡ Testar

1. Abra o workflow
2. **Test Workflow** (Ctrl+Enter)
3. Procure por erros (nós vermelhos)

**Esperado:**
- ✅ Scrape OK
- ✅ Claude extrai
- ✅ Compara datas
- ✅ Se novo: Download, Upload, Email, Notificação

---

## 🎯 Ativar

1. Botão **Activate** (canto superior)
2. Status → "ACTIVE"

**Pronto!** Roda automaticamente às 8h todos os dias.

---

## 📊 Monitorar

### n8n
- Menu → **Executions**
- Veja histórico de rodadas

### Supabase
```sql
SELECT * FROM diarios ORDER BY created_at DESC;
SELECT * FROM diarios_log ORDER BY created_at DESC;
SELECT * FROM notifications WHERE tipo_notificacao = 'diario' ORDER BY created_at DESC;
```

### Gmail
Verifique inbox por emails de diários

### Kausas
Veja notificações aparecendo

---

## ⚙️ Customizações (Opcional)

### Mudar Horário de Execução

1. Clique no nó **"⏰ Cron - 8h Diariamente"**
2. Mude `triggerAtHour` para outro horário (0-23)

### Mudar Email de Envio

1. Clique no nó **"📧 Enviar Email"**
2. Mude `sendTo` para seu email

### Mudar Template do Email

1. Clique no nó **"📧 Enviar Email"**
2. Edite o HTML no campo `message`

---

## 🐛 Troubleshooting

### Erro: "relation does not exist"
- Volte ao Supabase
- Verifique que as tabelas foram criadas
- Rode a query de verificação

### Erro: "Gmail not connected"
- Clique no nó Gmail
- Clique **Connect**
- Autorize sua conta

### Email não envia
- Verificar credenciais Gmail
- Checar se a conta tem "Acesso a apps menos seguros" ativado

### Claude não extrai data
- Claude precisa ver o HTML real
- Teste manualmente o site
- Ajuste o prompt se necessário

---

## ✅ Checklist Final

- [ ] SQL executado (tabelas criadas)
- [ ] Workflow importado
- [ ] Variáveis adicionadas (3)
- [ ] Credenciais Supabase OK
- [ ] Credenciais Claude OK
- [ ] Gmail autorizado
- [ ] Teste manual passou
- [ ] Workflow ativado (ACTIVE)

---

## 🎉 Pronto!

Seu workflow rodar:
- ✅ **Todos os dias às 8h**
- ✅ **Scrapa TCM + TCE**
- ✅ **Claude analisa**
- ✅ **Se novo: Email + Notificação**
- ✅ **Tudo em UM workflow**

---

**Status:** ✅ PRONTO PARA USAR
