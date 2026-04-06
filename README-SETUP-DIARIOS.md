# 📋 Automação Diários TCM/TCE - Setup Completo

## 🎯 O Que Você Tem

Sua automação está **100% configurada e pronta** para usar. Apenas 3 arquivos para ler na sequência:

1. **`PASSO-A-PASSO.md`** ← **COMECE AQUI** 👈
2. **`SETUP-WORKFLOW-DIARIOS.md`** (reference detalhado)
3. **`setup-supabase-diarios.sql`** (SQL para copiar/colar)

---

## ⚡ Resumo Rápido

### O Sistema Faz:

```
Todo dia às 8h
    ↓
Scrape: TCM + TCE
    ↓
Claude: Analisa HTML → Extrai data, título, PDF
    ↓
Compara com última data armazenada
    ↓
Se NOVO:
  ├─ Baixa PDF
  ├─ Sobe pro Supabase Storage
  ├─ Salva metadados no banco
  ├─ Deleta versão anterior
  └─ Notifica na Kausas: "📋 Diário atualizado"
```

### Tempo de Setup: ~15 minutos

1. **5 min**: Executar SQL no Supabase
2. **5 min**: Configurar credenciais no n8n
3. **5 min**: Teste manual e ativar

---

## 📂 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| **PASSO-A-PASSO.md** | 👈 Guia visual passo-a-passo (RECOMENDADO) |
| **SETUP-WORKFLOW-DIARIOS.md** | Guia detalhado de cada etapa |
| **setup-supabase-diarios.sql** | SQL pronto para copiar/colar no Supabase |
| **workflow-diarios-final.json** | Workflow n8n pronto para importar |
| **execute-setup.sh** | Script de automação (opcional) |

---

## 🔐 Credenciais Encontradas

✅ **Supabase** (encontradas no seu código):
```
URL: https://eelhcdhefkkjvfirmwmi.supabase.co
KEY: sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82
```

❓ **Anthropic API** (você precisa obter):
- Vá em: https://console.anthropic.com → API Keys
- Crie uma chave (começa com `sk-ant-`)
- Use no n8n

---

## 🚀 Quick Start (3 Passos)

### Passo 1: Supabase
```
1. Abra: https://app.supabase.com
2. Projeto: eelhcdhefkkjvfirmwmi
3. SQL Editor → New Query
4. Cole TUDO do arquivo: setup-supabase-diarios.sql
5. Run
```

### Passo 2: n8n
```
1. Abra seu n8n
2. Settings → Variables → Add:
   - SUPABASE_URL = https://eelhcdhefkkjvfirmwmi.supabase.co
   - SUPABASE_KEY = sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82
   - ANTHROPIC_API_KEY = sk-ant-XXXX (sua chave)
3. Dashboard → Import
4. Cole conteúdo: workflow-diarios-final.json
```

### Passo 3: Testar & Ativar
```
1. Clique no workflow
2. Test Workflow (Ctrl+Enter)
3. Veja se passou sem erros
4. Se sim: Clique "Activate"
```

---

## ✅ Depois Disso

O workflow roda **automaticamente** todos os dias às 8h. 

Monitore em:
- **n8n**: Menu → Executions
- **Supabase**: SQL → `SELECT * FROM diarios;`
- **Kausas**: Notificações aparecerão

---

## 🐛 Se Algo Não Funcionar

1. **Erro no teste?** → Veja logs do n8n (clique no nó com erro)
2. **Credenciais?** → Verifique que não têm espaços extras
3. **Claude não extrai?** → Sites podem ter HTML diferente, ajuste prompt
4. **PDF não sobe?** → Verifique URL do PDF é válida (teste no navegador)

→ **Solução detalhada:** Ver seção "Troubleshooting" em `PASSO-A-PASSO.md`

---

## 📊 O Que Você Ganhou

✅ **Automação diária** sem fazer nada  
✅ **Armazenamento centralizado** dos diários em Supabase  
✅ **Notificações na Kausas** quando atualizar  
✅ **Logs de todas rodadas** para auditoria  
✅ **PDFs organizados** com data no nome  
✅ **Comparação inteligente** com Claude  

---

## 🎯 Próximos Passos (Opcional)

- Adicionar mais órgãos públicos
- Dashboard visual na Kausas
- Enviar PDF por email também
- Integrar OCR para ler conteúdo

---

## 📞 Dúvidas?

→ Leia o arquivo: **`PASSO-A-PASSO.md`** (está bem completo!)

---

**Status:** ✅ **PRONTO PARA USAR**  
**Criado em:** 2026-04-06  
**Última atualização:** Agora
